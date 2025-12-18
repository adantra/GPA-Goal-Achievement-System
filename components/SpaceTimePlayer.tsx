import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SPACE_TIME_PHASES } from '../types';
import { Play, Pause, RotateCcw, Volume2, VolumeX, X, Loader2, WifiOff } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";

interface Props {
    onClose: () => void;
}

// Helper functions for raw PCM decoding
function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    // Ensure data length is even for Int16Array
    const alignedData = data.length % 2 !== 0 ? data.subarray(0, data.length - 1) : data;
    
    const dataInt16 = new Int16Array(alignedData.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

const SpaceTimePlayer: React.FC<Props> = ({ onClose }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(SPACE_TIME_PHASES[0].duration);
    const [isMuted, setIsMuted] = useState(false);
    const [isIntermission, setIsIntermission] = useState(false);
    const [audioCache, setAudioCache] = useState<Record<string, AudioBuffer>>({});
    const [audioError, setAudioError] = useState<string | null>(null);
    const [loadingPhases, setLoadingPhases] = useState<Set<string>>(new Set(SPACE_TIME_PHASES.map(p => p.name)));
    
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    const currentPhase = SPACE_TIME_PHASES[currentPhaseIndex];
    const isAudioReady = !!audioCache[currentPhase.name];
    const isPhaseLoading = loadingPhases.has(currentPhase.name);

    // Initialize Audio and Pre-load TTS
    useEffect(() => {
        const initAudioAndFetch = async () => {
            // Initialize AudioContext
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            if (!process.env.API_KEY) {
                console.warn("No API Key found for TTS");
                setAudioError("API Key missing");
                setLoadingPhases(new Set());
                return;
            }

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            // Sequentially load audio to avoid rate limits
            for (const phase of SPACE_TIME_PHASES) {
                if (audioCache[phase.name]) {
                    setLoadingPhases(prev => {
                        const next = new Set(prev);
                        next.delete(phase.name);
                        return next;
                    });
                    continue;
                }

                try {
                    const response = await ai.models.generateContent({
                        model: "gemini-2.5-flash-preview-tts",
                        contents: [{ parts: [{ text: phase.description }] }],
                        config: {
                            responseModalities: [Modality.AUDIO],
                            speechConfig: {
                                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                            }
                        }
                    });

                    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                    if (base64 && audioContextRef.current) {
                        const bytes = decode(base64);
                        // 24000Hz is standard for this model per docs
                        const buffer = await decodeAudioData(bytes, audioContextRef.current, 24000, 1);
                        setAudioCache(prev => ({ ...prev, [phase.name]: buffer }));
                    }
                } catch (err) {
                    console.error(`Failed to load TTS for ${phase.name}`, err);
                    setAudioError("Some audio failed to load");
                } finally {
                    setLoadingPhases(prev => {
                        const next = new Set(prev);
                        next.delete(phase.name);
                        return next;
                    });
                }
            }
        };

        initAudioAndFetch();

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            audioContextRef.current?.close();
        };
    }, []);

    // Sound Generation Functions
    const playDing = () => {
        if (isMuted || !audioContextRef.current) return;
        const ctx = audioContextRef.current;
        
        // Create oscillator for "Ding"
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // Bell-like tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(523.25, ctx.currentTime + 1.5);
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        
        osc.start();
        osc.stop(ctx.currentTime + 1.5);
    };

    const playVoice = (phaseName: string) => {
        if (isMuted || !audioContextRef.current) return;
        const buffer = audioCache[phaseName];
        if (buffer) {
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current.destination);
            // Delay voice slightly to let the bell ring first
            source.start(audioContextRef.current.currentTime + 0.8);
        } else {
            console.warn(`Audio buffer for ${phaseName} not found.`);
        }
    };

    const playPhaseAudio = (phaseName: string) => {
        // Resume context if suspended (browser policy)
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }
        playDing();
        playVoice(phaseName);
    };

    // Timer Logic
    useEffect(() => {
        if (isPlaying && !isIntermission && timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (isPlaying && !isIntermission && timeLeft === 0) {
            // End of phase, start intermission
            if (currentPhaseIndex < SPACE_TIME_PHASES.length - 1) {
                setIsIntermission(true);
            } else {
                setIsPlaying(false);
                playDing(); // Just a ding for completion
            }
        } else if (isPlaying && isIntermission) {
             // Intermission delay
             timerRef.current = setTimeout(() => {
                setIsIntermission(false);
                const nextIndex = currentPhaseIndex + 1;
                setCurrentPhaseIndex(nextIndex);
                setTimeLeft(SPACE_TIME_PHASES[nextIndex].duration);
                playPhaseAudio(SPACE_TIME_PHASES[nextIndex].name);
            }, 3000); // 3 second pause
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isPlaying, timeLeft, currentPhaseIndex, isIntermission]);

    const handleTogglePlay = () => {
        if (!isPlaying) {
            // If starting from the very beginning of a phase, play audio
            const isStartOfPhase = timeLeft === SPACE_TIME_PHASES[currentPhaseIndex].duration;
            if (isStartOfPhase && !isIntermission) {
                playPhaseAudio(SPACE_TIME_PHASES[currentPhaseIndex].name);
            }
            setIsPlaying(true);
        } else {
            setIsPlaying(false);
        }
    };

    const handleReset = () => {
        setIsPlaying(false);
        setCurrentPhaseIndex(0);
        setTimeLeft(SPACE_TIME_PHASES[0].duration);
        setIsIntermission(false);
    };

    // Calculate scale based on phase for visual effect
    const getScale = (index: number) => {
        if (index === 5) return 1; // Return
        return 0.5 + (index * 0.5); // 0.5, 1.0, 1.5, 2.0, 2.5
    };

    return (
        <div className="bg-black/90 backdrop-blur-md fixed inset-0 z-50 flex flex-col items-center justify-center p-4">
            <button 
                onClick={onClose}
                className="absolute top-6 right-6 text-white/50 hover:text-white p-2 transition-colors rounded-full hover:bg-white/10"
                aria-label="Close"
            >
                <X size={32} />
            </button>

            <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
                {/* Visualizer Circles */}
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={currentPhase.name}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ 
                            scale: getScale(currentPhaseIndex), 
                            opacity: isIntermission ? 0.3 : 0.8,
                            borderColor: currentPhase.color,
                            backgroundColor: `${currentPhase.color}20` 
                        }}
                        exit={{ scale: 1.2, opacity: 0 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="rounded-full border-4 absolute w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                        style={{ borderColor: currentPhase.color, boxShadow: `0 0 40px ${currentPhase.color}40` }}
                    >
                        {/* Pulse Effect */}
                        <motion.div
                            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                            transition={{ repeat: Infinity, duration: 4 }}
                            className="w-full h-full rounded-full absolute inset-0 bg-current opacity-10"
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Text Overlay */}
                <div className="z-10 text-center relative pointer-events-none">
                    <motion.h2 
                        key={`${currentPhase.name}-title`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-4xl font-bold text-white mb-2 drop-shadow-lg"
                    >
                        {currentPhase.name}
                    </motion.h2>
                    <motion.p 
                        key={`${currentPhase.name}-desc`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-slate-200 max-w-xs mx-auto drop-shadow-md text-sm sm:text-base"
                    >
                        {currentPhase.description}
                    </motion.p>
                    
                    {/* Audio Status Indicator */}
                    <AnimatePresence>
                        {isPhaseLoading && (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-black/50 rounded-full text-xs text-indigo-300 border border-indigo-500/30"
                            >
                                <Loader2 size={12} className="animate-spin" />
                                Downloading Neural Voice...
                            </motion.div>
                        )}
                        {!isPhaseLoading && !isAudioReady && (
                             <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-red-900/50 rounded-full text-xs text-red-300 border border-red-500/30"
                            >
                                <WifiOff size={12} />
                                Voice Unavailable
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Controls */}
            <div className="mt-12 flex flex-col items-center gap-6 w-full max-w-md">
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <motion.div 
                        className="h-full bg-white"
                        initial={{ width: '0%' }}
                        animate={{ width: `${((currentPhase.duration - timeLeft) / currentPhase.duration) * 100}%` }}
                        transition={{ duration: 1, ease: "linear" }}
                    />
                </div>
                
                <div className="flex items-center gap-8">
                    <button onClick={handleReset} className="p-4 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition">
                        <RotateCcw size={24} />
                    </button>
                    
                    <button 
                        onClick={handleTogglePlay} 
                        className="p-6 rounded-full bg-white text-black hover:bg-slate-200 transition shadow-lg shadow-white/20 flex items-center justify-center"
                    >
                        {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                    </button>

                    <button 
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-4 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition relative"
                    >
                        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                        {loadingPhases.size > 0 && (
                            <div className="absolute -top-1 -right-1">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                                </span>
                            </div>
                        )}
                    </button>
                </div>

                <div className="text-slate-400 font-mono">
                     {isIntermission ? "Deep breath..." : `${timeLeft}s remaining in phase`}
                </div>
            </div>
        </div>
    );
};

export default SpaceTimePlayer;