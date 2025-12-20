import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BrainCircuit, Target, ArrowRight, Sparkles, Zap, Shield, 
    AlertCircle, ChevronRight, CheckCircle, Bot, Loader2, 
    Eye, EyeOff, Globe, Info, Flame, Activity, Hourglass, 
    ChevronLeft, Compass
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { createGoal } from '../services/goalController';
import { createMilestone } from '../services/milestoneController';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

const STATIONS = [
    { name: 'Station 1: Interosception', icon: <EyeOff />, desc: 'Close eyes. Focus on your internal state (breath, heart) for 3 breaths.' },
    { name: 'Station 2: Somatosensory', icon: <Target />, desc: 'Open eyes. Focus on a part of your body (like your hand) for 3 breaths.' },
    { name: 'Station 3: Perpersonal Focus', icon: <Eye />, desc: 'Focus on the isolated task itself (the "here and now") 5–15 feet away for 3 breaths.' },
    { name: 'Station 4: Extrapersonal Focus', icon: <Globe />, desc: 'Focus on a far horizon—representing the significant, long-term goal—for 3 breaths.' },
    { name: 'Station 5: Space-Time Bridge', icon: <Sparkles />, desc: 'Broaden your vision to see the entire landscape, connecting the immediate task to the distant horizon.' },
    { name: 'Station 6: Neural Re-integration', icon: <BrainCircuit />, desc: 'Return focus to your internal state. The circuit is bridged.' }
];

const GoalScalingWizard: React.FC<Props> = ({ isOpen, onClose, onComplete }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // Phase 1 Data
    const [initialTask, setInitialTask] = useState('');
    const [compulsionReason, setCompulsionReason] = useState('');
    
    // Phase 2 Data (AI Generated)
    const [scaledGoal, setScaledGoal] = useState({
        title: '',
        description: '',
        goActions: [] as string[],
        noGoActions: [] as string[]
    });

    // Phase 3: Space-Time Bridging
    const [activeStation, setActiveStation] = useState(0);
    const [isBridging, setIsBridging] = useState(false);

    // Phase 4: Amygdala Lock
    const [failureScenario, setFailureScenario] = useState('');

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setError(null);
            setLoading(false);
            setActiveStation(0);
            setIsBridging(false);
            setFailureScenario('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleScaleAnalysis = async () => {
        if (!initialTask || !process.env.API_KEY) return;
        setLoading(true);
        setError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
                Goal Elevation Procedure:
                Task: "${initialTask}"
                Dopamine Signal (Why they feel compelled): "${compulsionReason}"

                Instructions:
                1. Upscale this isolated task into a SIGNIFICANT long-term goal (tomorrow, next month, next year).
                2. Use the "Lateral Prefrontal Planning" principle to frame it. (e.g., Reading a book -> Mastering a subject).
                3. Ensure it hits the "Goldilocks Zone" of moderate challenge (Rating 7/10).
                4. Define 2 concrete "GO" actions and 2 concrete "NO-GO" actions.

                Output JSON:
                {
                    "title": "Elevated Title",
                    "description": "The 'Wide-Angle' view of the goal's significance",
                    "go": ["action 1", "action 2"],
                    "no_go": ["avoidance 1", "avoidance 2"]
                }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            go: { type: Type.ARRAY, items: { type: Type.STRING } },
                            no_go: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["title", "description", "go", "no_go"]
                    }
                }
            });

            const data = JSON.parse(response.text || '{}');
            setScaledGoal({
                title: data.title,
                description: data.description,
                goActions: data.go,
                noGoActions: data.no_go
            });
            setStep(3);
        } catch (err) {
            setError("Neural synthesis timed out. Re-initializing link...");
        } finally {
            setLoading(false);
        }
    };

    const runBridgingPractice = () => {
        setIsBridging(true);
        let current = 0;
        // 15 seconds per station for a roughly 90s practice
        const interval = setInterval(() => {
            current++;
            if (current >= STATIONS.length) {
                clearInterval(interval);
                setIsBridging(false);
                setStep(5);
            } else {
                setActiveStation(current);
            }
        }, 12000); 
    };

    const finalizeProtocol = async () => {
        if (!failureScenario.trim()) {
            setError("You must record the failure scenario to activate the Amygdala Lock.");
            return;
        }

        setLoading(true);
        try {
            const goal = await createGoal({
                title: scaledGoal.title,
                description: scaledGoal.description,
                difficultyRating: 7
            });

            const actions = [
                ...scaledGoal.goActions.map(a => ({ description: a, type: 'GO' as const })),
                ...scaledGoal.noGoActions.map(a => ({ description: a, type: 'NO_GO' as const }))
            ];

            // The isolated task becomes the first milestone
            await createMilestone(goal.id, "First Milestone: " + initialTask, actions);
            
            // Save failure scenario to user metadata
            localStorage.setItem(`gpa_data_${localStorage.getItem('gpa_session') ? JSON.parse(localStorage.getItem('gpa_session')!).id : 'global'}_amygdala`, failureScenario);

            onComplete();
            onClose();
        } catch (err: any) {
            setError(err.message || "Protocol deployment failed.");
        } finally {
            setLoading(false);
        }
    };

    const wizardContent = (
        <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="max-w-5xl w-full h-[90vh] bg-slate-900 border border-indigo-500/20 rounded-[3rem] shadow-[0_0_150px_rgba(79,70,229,0.1)] overflow-hidden flex flex-col relative"
            >
                {/* Header: Dynamic Progress */}
                <div className="p-10 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between shrink-0">
                    <div>
                        <div className="flex items-center gap-3 text-indigo-400 mb-2">
                            <Compass size={24} className="animate-spin-slow" />
                            <span className="text-xs font-black tracking-[0.3em] uppercase opacity-60">Phase {step}: {
                                step === 1 ? 'Neural Alignment' : 
                                step === 2 ? 'Lateral Projection' : 
                                step === 3 ? 'Significance Review' : 
                                step === 4 ? 'Space-Time Bridge' : 
                                'Amygdala Lock'
                            }</span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Significance Upgrade Protocol</h2>
                    </div>
                    <button onClick={onClose} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-500 hover:text-white transition-all">
                        <ArrowRight className="rotate-45" size={24} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="absolute top-[132px] left-0 w-full h-1 bg-slate-800">
                    <motion.div 
                        initial={{ width: '0%' }}
                        animate={{ width: `${(step / 5) * 100}%` }}
                        className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.8)]"
                    />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                <div className="space-y-4">
                                    <h3 className="text-4xl font-black text-white">Identify the Dopamine Pulse</h3>
                                    <p className="text-slate-400 text-xl leading-relaxed">
                                        Your brain has signaled a "compulsion" to do a specific task. This is a value signal from your orbital frontal cortex.
                                    </p>
                                </div>

                                <div className="space-y-8">
                                    <div>
                                        <label className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4 block">1. The Isolated Task (Immediate reach)</label>
                                        <input 
                                            value={initialTask}
                                            onChange={e => setInitialTask(e.target.value)}
                                            placeholder="e.g., Read this book chapter, organize my desk..."
                                            className="w-full bg-black/40 border-2 border-slate-700 rounded-2xl p-6 text-2xl text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4 block">2. Why do you feel compelled? (Identify Value Signal)</label>
                                        <textarea 
                                            value={compulsionReason}
                                            onChange={e => setCompulsionReason(e.target.value)}
                                            placeholder="I feel it will make me smarter, I'm anxious about my career, etc."
                                            className="w-full bg-black/40 border-2 border-slate-700 rounded-2xl p-6 text-lg text-white h-32 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700"
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setStep(2)}
                                    disabled={!initialTask}
                                    className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl text-xl font-black shadow-2xl shadow-indigo-900/40 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                                >
                                    Assess Neural Alignment <ChevronRight size={28} />
                                </button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                                <div className="flex items-center gap-4 p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl">
                                    <Activity className="text-indigo-400" size={32} />
                                    <div>
                                        <h4 className="text-white font-bold text-lg">Lateral Prefrontal Planning</h4>
                                        <p className="text-indigo-200/60">We are upscaling your focus from "perpersonal" to "extrapersonal" space.</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <p className="text-2xl text-slate-300 leading-relaxed">
                                        The AI will now analyze how this small task connects to a <span className="text-white font-bold">significant time scale</span> (next year or decade).
                                    </p>
                                    <div className="p-8 bg-black/40 border-2 border-dashed border-slate-700 rounded-[2rem] text-center italic text-slate-500">
                                        Initiating Neural Re-scaling Process...
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={() => setStep(1)} className="flex-1 py-6 bg-slate-800 hover:bg-slate-700 text-white rounded-3xl font-black transition-all">Back</button>
                                    <button 
                                        onClick={handleScaleAnalysis}
                                        disabled={loading}
                                        className="flex-[2] py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl text-xl font-black shadow-2xl shadow-indigo-900/40 transition-all flex items-center justify-center gap-4"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : <><Bot /> Project Significance</>}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="s3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10">
                                <div className="text-center">
                                    <div className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-black uppercase tracking-[0.2em] mb-6">
                                        Significant Goal Synthesized
                                    </div>
                                    <h3 className="text-5xl font-black text-white mb-6 leading-tight">{scaledGoal.title}</h3>
                                    <p className="text-slate-400 text-2xl leading-relaxed max-w-3xl mx-auto">{scaledGoal.description}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-emerald-950/20 border-2 border-emerald-500/20 p-8 rounded-[2.5rem]">
                                        <h4 className="text-emerald-400 font-black uppercase tracking-widest mb-6 flex items-center gap-3 text-lg">
                                            <Zap size={24} /> "GO" Actions
                                        </h4>
                                        <div className="space-y-4">
                                            {scaledGoal.goActions.map((a, i) => (
                                                <div key={i} className="flex items-start gap-4 text-slate-300 text-lg bg-black/30 p-5 rounded-2xl">
                                                    <CheckCircle size={24} className="text-emerald-500 shrink-0 mt-0.5" />
                                                    {a}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-red-950/20 border-2 border-red-500/20 p-8 rounded-[2.5rem]">
                                        <h4 className="text-red-400 font-black uppercase tracking-widest mb-6 flex items-center gap-3 text-lg">
                                            <Shield size={24} /> "NO-GO" Actions
                                        </h4>
                                        <div className="space-y-4">
                                            {scaledGoal.noGoActions.map((a, i) => (
                                                <div key={i} className="flex items-start gap-4 text-slate-300 text-lg bg-black/30 p-5 rounded-2xl">
                                                    <AlertCircle size={24} className="text-red-500 shrink-0 mt-0.5" />
                                                    {a}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setStep(4)}
                                    className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl text-xl font-black shadow-2xl shadow-indigo-900/40 transition-all"
                                >
                                    Proceed to Space-Time Bridging
                                </button>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[450px] text-center space-y-12">
                                {!isBridging ? (
                                    <div className="space-y-10 max-w-2xl">
                                        <div className="w-32 h-32 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 mx-auto border-2 border-indigo-500/20 mb-4">
                                            <Hourglass className="animate-pulse" size={56} />
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-4xl font-black text-white">Space-Time Bridging</h3>
                                            <p className="text-slate-400 text-xl leading-relaxed">
                                                This 90-second practice trains your brain to "batch time" correctly by linking your internal state to the far horizon of this significant goal.
                                            </p>
                                        </div>
                                        <button 
                                            onClick={runBridgingPractice}
                                            className="w-full py-6 bg-white text-black hover:bg-indigo-50 rounded-3xl text-2xl font-black transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                                        >
                                            Begin Neural Anchor
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-16 w-full max-w-3xl">
                                        <div className="relative">
                                            <motion.div 
                                                animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.4, 0.1] }}
                                                transition={{ duration: 4, repeat: Infinity }}
                                                className="absolute inset-0 bg-indigo-500 rounded-full blur-[100px]"
                                            />
                                            <div className="relative w-40 h-40 bg-slate-800 rounded-full flex items-center justify-center text-indigo-400 border-4 border-indigo-500/30 mx-auto shadow-2xl">
                                                {React.cloneElement(STATIONS[activeStation].icon as React.ReactElement, { size: 64 })}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            <motion.h4 
                                                key={activeStation}
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                className="text-4xl font-black text-indigo-400"
                                            >
                                                {STATIONS[activeStation].name}
                                            </motion.h4>
                                            <motion.p 
                                                key={STATIONS[activeStation].desc}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-2xl text-white max-w-xl mx-auto h-24 leading-relaxed"
                                            >
                                                {STATIONS[activeStation].desc}
                                            </motion.p>
                                        </div>

                                        <div className="flex justify-center gap-4">
                                            {STATIONS.map((_, i) => (
                                                <div key={i} className={`h-3 rounded-full transition-all duration-700 ${activeStation === i ? 'w-24 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'w-4 bg-slate-800'}`} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {step === 5 && (
                            <motion.div key="s5" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 max-w-4xl mx-auto py-8">
                                <div className="text-center space-y-4">
                                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center text-red-400 mx-auto border-2 border-red-500/20 mb-6">
                                        <Flame size={48} className="animate-pulse" />
                                    </div>
                                    <h3 className="text-4xl font-black text-white">Phase 4: Amygdala Lock</h3>
                                    <p className="text-xl text-slate-400 leading-relaxed">
                                        To sustain pursuit, you must recruit your "No-Go" circuit. Describe exactly how painful it will be if you fail to achieve this significant goal.
                                    </p>
                                </div>
                                
                                <div className="relative">
                                    <textarea 
                                        value={failureScenario}
                                        onChange={e => setFailureScenario(e.target.value)}
                                        placeholder="If I stay as I am and fail this goal, in 5 years I will be..."
                                        className="w-full bg-black/40 border-2 border-red-500/20 rounded-[2rem] p-8 text-xl text-red-200/80 h-48 focus:border-red-500 outline-none transition-all placeholder:text-red-900/40 font-serif leading-relaxed"
                                    />
                                    <div className="absolute top-4 right-6 text-red-500/30 font-black uppercase text-[10px] tracking-widest">Arousal Protocol Active</div>
                                </div>

                                <div className="p-8 bg-red-950/20 border-2 border-dashed border-red-500/20 rounded-3xl text-sm italic text-red-200/50">
                                    "Visualizing failure recruits the amygdala, using a healthy sense of anxiety to keep you in pursuit when dopamine alone is insufficient."
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={() => setStep(4)} className="flex-1 py-6 bg-slate-800 hover:bg-slate-700 text-white rounded-3xl font-black transition-all">Back</button>
                                    <button 
                                        onClick={finalizeProtocol}
                                        disabled={loading || !failureScenario.trim()}
                                        className="flex-[2] py-6 bg-red-600 hover:bg-red-500 text-white rounded-3xl text-2xl font-black shadow-2xl shadow-red-900/40 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : 'Deploy Significant Protocol'}
                                    </button>
                                </div>
                                {error && <p className="text-center text-red-400 font-mono text-sm">{error}</p>}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );

    return createPortal(wizardContent, document.body);
};

const ActivityIcon = ({ className, size }: { className?: string, size?: number }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size || 24} 
        height={size || 24} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
);

export default GoalScalingWizard;