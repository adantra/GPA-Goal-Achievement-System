import React, { useState, useEffect, useMemo } from 'react';
import { AlertOctagon, Sparkles, Wand2, Loader2, ThumbsUp, AlertTriangle, Save, X, RefreshCw, Zap } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { getCurrentUser } from '../services/auth';
import { getGoals } from '../services/goalController';

interface Props {
    onUnlock: () => void;
    mode?: 'block' | 'view';
}

const ForeshadowingFailureModal: React.FC<Props> = ({ onUnlock, mode = 'block' }) => {
    const [text, setText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [feedback, setFeedback] = useState<{ score: number; critique: string; suggestion: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Use useMemo to stabilize currentUser if strictly necessary, but better to depend on ID
    // We'll just get the user once or depend on the ID.
    const currentUser = getCurrentUser();
    const userId = currentUser?.id;

    // Load saved text on mount
    useEffect(() => {
        if (userId) {
            const saved = localStorage.getItem(`gpa_data_${userId}_amygdala`);
            if (saved) {
                setText(saved);
            }
        }
    }, [userId]); // Fixed dependency: use userId string instead of object reference

    const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    // In view mode, we don't enforce word count strictly for closing, but visual feedback is good
    const isEnough = wordCount >= 50; 
    const isBusy = isAnalyzing || isEnhancing || isGenerating;

    const getAI = () => {
        if (!process.env.API_KEY) {
            setError("API Key missing.");
            return null;
        }
        return new GoogleGenAI({ apiKey: process.env.API_KEY });
    };

    const handleGenerate = async () => {
        const ai = getAI();
        if (!ai) return;

        setIsGenerating(true);
        setError(null);
        setFeedback(null);

        try {
            // Fetch goals for context
            const goals = await getGoals();
            const goalsContext = goals.length > 0 
                ? goals.map(g => `- ${g.title}: ${g.description}`).join('\n')
                : "General life improvement and discipline.";

            const prompt = `
                Write a "Foreshadowing Failure" scenario for a user with the following goals:
                ${goalsContext}

                The text should be a VISCERAL, FIRST-PERSON narrative described from the perspective of their future self (5 years later) who completely failed to achieve these goals due to laziness and inaction.
                
                Requirements:
                - Focus on the PAIN of regret, the mediocrity of life, and the physical sensation of disappointment.
                - Make it vivid and emotional to trigger amygdala activation (fear of failure).
                - Keep it under 150 words but punchy.
                - Output strictly plain text.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });

            if (response.text) {
                setText(response.text.trim());
            }
        } catch (err: any) {
            console.error(err);
            setError("Generation failed. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAnalyze = async () => {
        const ai = getAI();
        if (!ai || !text.trim()) return;

        setIsAnalyzing(true);
        setError(null);
        setFeedback(null);

        try {
            const prompt = `
                Analyze this "Foreshadowing Failure" text. The user is trying to vividly describe the negative consequences of failing their life goals to trigger amygdala activation (fear of failure).
                
                Rate its emotional intensity (1-10).
                1 = Dry, logical, emotionless.
                10 = Visceral, painful, highly emotional, uses sensory details.
                
                Provide:
                1. score (integer 1-10)
                2. critique (concise feedback on what is missing)
                3. suggestion (one specific way to make it more painful/effective)

                Text: "${text}"
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            score: { type: Type.INTEGER },
                            critique: { type: Type.STRING },
                            suggestion: { type: Type.STRING }
                        },
                        required: ["score", "critique", "suggestion"]
                    }
                }
            });

            if (response.text) {
                const data = JSON.parse(response.text);
                setFeedback(data);
            }
        } catch (err: any) {
            console.error(err);
            setError("Analysis failed. Try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleEnhance = async () => {
        const ai = getAI();
        if (!ai || !text.trim()) return;

        setIsEnhancing(true);
        setError(null);

        try {
            const prompt = `
                Rewrite the following text to be more visceral, emotional, and painful.
                The goal is to strictly foreshadow the NEGATIVE consequences of failure.
                Use sensory details (sight, sound, feeling). Keep it first-person.
                Maintain the core meaning but dial up the emotional weight to 11.
                Output strictly plain text.
                
                Text: "${text}"
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });

            if (response.text) {
                setText(response.text.trim());
                // Clear old feedback as text changed
                setFeedback(null);
            }
        } catch (err: any) {
            console.error(err);
            setError("Enhancement failed.");
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleComplete = () => {
        if (currentUser) {
            localStorage.setItem(`gpa_data_${currentUser.id}_amygdala`, text);
        }
        onUnlock();
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-5xl w-full h-[85vh] bg-slate-900 border border-red-900/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden flex flex-col">
                {/* Background Pulse for urgency */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50"></div>
                
                {mode === 'view' && (
                    <button 
                        onClick={handleComplete} 
                        className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                )}

                <div className="flex items-center gap-4 mb-6 shrink-0">
                    <div className="p-3 bg-red-900/20 rounded-full text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                        <AlertOctagon size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            {mode === 'block' ? 'Access Blocked: Foreshadowing Failure' : 'Amygdala Activation Protocol'}
                        </h1>
                        <p className="text-red-400 text-sm font-mono tracking-wide uppercase">
                            {mode === 'block' ? 'Protocol 3: Amygdala Activation Required' : 'Status: Active Monitoring'}
                        </p>
                    </div>
                </div>

                <div className="prose prose-invert mb-6 text-slate-300 text-base leading-relaxed shrink-0 max-w-none">
                    <p>
                        {mode === 'block' 
                            ? "To ensure you remain committed, you must vividly describe the negative consequences of failing to achieve your current goals. What will your life look like in 5 years if you stay exactly as you are?"
                            : "Review your failure scenario. Read this daily to maintain autonomic arousal and prevent complacency. Feel the pain of inaction."
                        }
                    </p>
                </div>

                <div className="relative flex-1 min-h-[300px] flex flex-col">
                    <textarea
                        className="w-full h-full bg-black/50 border border-slate-700 rounded-xl p-8 text-xl leading-9 text-white focus:ring-2 focus:ring-red-500 outline-none transition resize-none font-serif tracking-wide placeholder:text-slate-600 shadow-inner"
                        placeholder="Describe your failure scenario here... If I fail, I will..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={isBusy}
                    />
                    
                    {/* Empty State Generator Overlay */}
                    {!text.trim() && !isBusy && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <button
                                onClick={handleGenerate}
                                className="pointer-events-auto bg-slate-800/80 hover:bg-slate-700 backdrop-blur text-white px-6 py-3 rounded-lg border border-slate-600 flex items-center gap-3 shadow-xl transition-all hover:scale-105 text-lg font-medium"
                            >
                                <Zap size={20} className="text-yellow-400" />
                                Generate Scenario from My Goals
                            </button>
                        </div>
                    )}
                    
                    {/* Loading Overlay */}
                    {isBusy && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] rounded-xl flex items-center justify-center z-10">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 size={32} className="animate-spin text-red-500" />
                                <span className="text-red-300 font-mono text-sm">
                                    {isGenerating ? 'Synthesizing Failure Timeline...' : isAnalyzing ? 'Analyzing Cortisol Response...' : 'Intensifying Neural Impact...'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* AI Tools Toolbar */}
                    <div className="absolute bottom-4 right-4 flex gap-2 z-20">
                         {text.length > 0 && (
                            <button
                                onClick={handleGenerate}
                                disabled={isBusy}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
                                title="Regenerate from scratch"
                            >
                                <RefreshCw size={12} />
                                Regenerate
                            </button>
                        )}
                        <button
                            onClick={handleAnalyze}
                            disabled={isBusy || text.length < 10}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
                            title="Analyze emotional intensity"
                        >
                            <Sparkles size={12} />
                            Analyze
                        </button>
                        <button
                            onClick={handleEnhance}
                            disabled={isBusy || text.length < 10}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-300 text-xs rounded-lg border border-red-900/50 transition-colors disabled:opacity-50"
                            title="Rewrite to be more visceral"
                        >
                            <Wand2 size={12} />
                            Intensify
                        </button>
                    </div>
                </div>

                {/* AI Feedback Section */}
                {feedback && (
                    <div className="mt-4 p-4 bg-slate-950/50 rounded-lg border border-slate-800 animate-in fade-in slide-in-from-top-2 shrink-0">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Neuro-Analysis</span>
                            <div className={`flex items-center gap-2 px-2 py-0.5 rounded text-xs font-bold ${feedback.score >= 7 ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                <ActivityIcon score={feedback.score} />
                                Intensity: {feedback.score}/10
                            </div>
                        </div>
                        <p className="text-slate-300 text-sm mb-2"><span className="text-slate-500">Critique:</span> {feedback.critique}</p>
                        <div className="text-xs text-indigo-300 flex gap-2">
                             <Sparkles size={12} className="shrink-0 mt-0.5" />
                             <span><span className="font-semibold">Suggestion:</span> {feedback.suggestion}</span>
                        </div>
                    </div>
                )}

                {error && <div className="mt-2 text-xs text-red-400">{error}</div>}

                <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-800 shrink-0">
                    <div className={`text-sm font-mono ${isEnough ? 'text-green-400' : 'text-slate-500'}`}>
                        Word Count: {wordCount} / 50
                    </div>

                    <button
                        onClick={handleComplete}
                        disabled={(mode === 'block' && !isEnough) || isBusy}
                        className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2
                            ${(mode === 'view' || isEnough)
                                ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/40' 
                                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                            }`}
                    >
                        {(mode === 'view') ? (
                            <>
                                <Save size={18} /> Save & Close
                            </>
                        ) : (
                            isEnough ? (
                                <>
                                    <ThumbsUp size={18} /> Unlock Dashboard
                                </>
                            ) : 'Write More to Unlock'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ActivityIcon = ({ score }: { score: number }) => {
    if (score >= 8) return <AlertOctagon size={14} />;
    if (score >= 5) return <AlertTriangle size={14} />;
    return <Sparkles size={14} />;
}

export default ForeshadowingFailureModal;