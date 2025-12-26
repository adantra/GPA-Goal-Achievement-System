import React, { useState } from 'react';
import { createGoal } from '../services/goalController';
import { Loader2, AlertTriangle, CheckCircle, Sparkles, Bot, Zap, ArrowRight, Target, Minimize2, Info, Brain, CalendarClock } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface Props {
    onGoalCreated: () => void;
    onOpenAssistant: (title: string, description: string) => void;
}

interface ExpansionSuggestion {
    title: string;
    description: string;
    reasoning: string;
    difficulty: number;
}

const CreateGoalForm: React.FC<Props> = ({ onGoalCreated, onOpenAssistant }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState(5);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // AI Assessment State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<{ 
        rating: number; 
        reasoning: string; 
        suggestion: string;
        alternativeActions?: string[];
        estimatedTimeframe?: string;
        timeframeReasoning?: string;
    } | null>(null);

    // Expansion State
    const [isExpanding, setIsExpanding] = useState(false);
    const [expansionSuggestions, setExpansionSuggestions] = useState<ExpansionSuggestion[] | null>(null);

    // Simplification State
    const [isSimplifying, setIsSimplifying] = useState(false);
    const [simplificationSuggestions, setSimplificationSuggestions] = useState<ExpansionSuggestion[] | null>(null);

    // Goldilocks logic helpers
    const isTooEasy = difficulty < 6;
    const isTooHard = difficulty > 8;
    const isValid = !isTooEasy && !isTooHard;

    const getDifficultyColor = () => {
        if (isTooEasy) return 'text-blue-400';
        if (isTooHard) return 'text-red-400';
        return 'text-green-400'; // Optimal
    };

    const getDifficultyLabel = () => {
        if (isTooEasy) return 'Too Easy / Boring';
        if (isTooHard) return 'Too Lofty / Anxiety-Inducing';
        return 'The Goldilocks Zone (Optimal)';
    };

    const handleAIAssess = async () => {
        if (!title || !description) return;
        if (!process.env.API_KEY) {
            setError("Neuro-Link Error: API Key missing.");
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        setAiFeedback(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
                You are a neuroscience-based goal achievement coach.
                Analyze this goal:
                Title: "${title}"
                Description: "${description}"

                Estimate the difficulty on a scale of 1-10 for an average person.
                1 = Trivial/Boring.
                10 = Impossible/Anxiety-Inducing.
                6-8 = Goldilocks Zone (Optimal Challenge).

                Provide:
                1. estimated_rating (integer 1-10)
                2. reasoning (concise explanation)
                3. suggestion:
                   - If rating < 6, suggest "Expanding Horizon" (increasing scope/ambition).
                   - If rating > 8, suggest "Reducing Scope" (breaking it down).
                   - If 6-8, suggest a minor tweak for clarity.
                4. alternative_actions: A list of 3 concrete, immediate micro-actions or starting points the user could take to begin this goal.
                5. estimated_timeframe: Realistic timeframe to complete this goal (e.g., "2-3 weeks", "6 months", "1-2 years")
                6. timeframe_reasoning: Brief explanation of why this timeframe is realistic
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            estimated_rating: { type: Type.INTEGER },
                            reasoning: { type: Type.STRING },
                            suggestion: { type: Type.STRING },
                            alternative_actions: { 
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            },
                            estimated_timeframe: { type: Type.STRING },
                            timeframe_reasoning: { type: Type.STRING }
                        },
                        required: ["estimated_rating", "reasoning", "suggestion", "alternative_actions", "estimated_timeframe", "timeframe_reasoning"]
                    }
                }
            });

            if (response.text) {
                 const data = JSON.parse(response.text);
                 setAiFeedback({
                     rating: data.estimated_rating,
                     reasoning: data.reasoning,
                     suggestion: data.suggestion,
                     alternativeActions: data.alternative_actions,
                     estimatedTimeframe: data.estimated_timeframe,
                     timeframeReasoning: data.timeframe_reasoning
                 });
                 // Optional: Auto-set difficulty if the user hasn't touched it much? 
                 // Better to let user apply it manually via the UI button provided.
            }
        } catch (err: any) {
            console.error(err);
            setError("AI Assessment failed.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleExpandHorizon = async () => {
        if (!title || !process.env.API_KEY) return;

        setIsExpanding(true);
        setError(null);
        setExpansionSuggestions(null);
        setSimplificationSuggestions(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
                The user has proposed a goal that is too simple (Low Arousal): "${title}".
                Current Description: "${description}"

                Suggest 3 "Expanded Horizon" versions of this goal that increase the challenge to the optimal "Goldilocks Zone" (Difficulty 7-8/10).
                Focus on increasing the scale, intensity, or impact to maximize dopaminergic engagement.

                For each suggestion provide:
                1. title (action-oriented, punchy)
                2. description (motivating, clear "why")
                3. reasoning (the neuro-biological benefit of this harder version)
                4. difficulty (fixed at 7 or 8)
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            suggestions: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        reasoning: { type: Type.STRING },
                                        difficulty: { type: Type.INTEGER }
                                    },
                                    required: ["title", "description", "reasoning", "difficulty"]
                                }
                            }
                        },
                        required: ["suggestions"]
                    }
                }
            });

            if (response.text) {
                const data = JSON.parse(response.text);
                setExpansionSuggestions(data.suggestions);
            }
        } catch (err) {
            console.error(err);
            setError("Neural expansion failed.");
        } finally {
            setIsExpanding(false);
        }
    };

    const handleReduceScope = async () => {
        if (!title || !process.env.API_KEY) return;

        setIsSimplifying(true);
        setError(null);
        setSimplificationSuggestions(null);
        setExpansionSuggestions(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
                The user has proposed a goal that is likely too overwhelming (High Friction/Anxiety): "${title}".
                Current Description: "${description}"

                Suggest 3 "Reduced Scope" versions of this goal that bring it down to the optimal "Goldilocks Zone" (Difficulty 6-8/10).
                Focus on creating concrete "Stepping Stones" or "Minimum Viable Protocols" that reduce amygdala resistance while maintaining progress.

                For each suggestion provide:
                1. title (action-oriented, precise)
                2. description (clear, achievable steps)
                3. reasoning (why this lower friction approach works neuro-biologically)
                4. difficulty (fixed between 6 and 8)
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            suggestions: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        reasoning: { type: Type.STRING },
                                        difficulty: { type: Type.INTEGER }
                                    },
                                    required: ["title", "description", "reasoning", "difficulty"]
                                }
                            }
                        },
                        required: ["suggestions"]
                    }
                }
            });

            if (response.text) {
                const data = JSON.parse(response.text);
                setSimplificationSuggestions(data.suggestions);
            }
        } catch (err) {
            console.error(err);
            setError("Neural reduction failed.");
        } finally {
            setIsSimplifying(false);
        }
    };

    const applySuggestion = (s: ExpansionSuggestion) => {
        setTitle(s.title);
        setDescription(s.description);
        setDifficulty(s.difficulty);
        setExpansionSuggestions(null);
        setSimplificationSuggestions(null);
        setAiFeedback(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isValid) return;

        setLoading(true);
        try {
            await createGoal({
                title,
                description,
                difficultyRating: difficulty,
                estimatedTimeframe: aiFeedback?.estimatedTimeframe,
                // Persist AI Assessment if available, regardless of whether user followed it perfectly
                aiAssessment: aiFeedback ? {
                    estimatedRating: aiFeedback.rating,
                    reasoning: aiFeedback.reasoning,
                    suggestion: aiFeedback.suggestion,
                    alternativeActions: aiFeedback.alternativeActions,
                    estimatedTimeframe: aiFeedback.estimatedTimeframe,
                    timeframeReasoning: aiFeedback.timeframeReasoning,
                    timestamp: new Date().toISOString()
                } : undefined
            });
            onGoalCreated();
            setTitle('');
            setDescription('');
            setDifficulty(5);
            setAiFeedback(null);
            setExpansionSuggestions(null);
            setSimplificationSuggestions(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl relative">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="bg-indigo-500 w-2 h-6 rounded-full block"></span>
                    Define New Protocol
                </h2>
                <button
                    type="button"
                    onClick={() => onOpenAssistant(title, description)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg text-xs font-bold border border-indigo-500/30 transition-colors"
                >
                    <Bot size={16} />
                    Neural Assistant
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Goal Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                        placeholder="e.g., Run a Marathon"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition h-24"
                        placeholder="Why is this important?"
                        required
                    />
                </div>

                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-sm font-medium text-slate-300">Difficulty Rating (1-10)</label>
                        <button
                            type="button"
                            onClick={handleAIAssess}
                            disabled={!title || !description || isAnalyzing}
                            className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            {isAnalyzing ? 'Analyzing...' : 'AI Assess Difficulty'}
                        </button>
                    </div>
                    
                    <div className="flex justify-between items-center mb-2">
                        <span className={`font-mono font-bold ${getDifficultyColor()}`}>
                            {difficulty} - {getDifficultyLabel()}
                        </span>
                    </div>
                    
                    <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={difficulty}
                        onChange={(e) => setDifficulty(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    
                    <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                        <span>1 (Trivial)</span>
                        <span>10 (Impossible)</span>
                    </div>

                    {aiFeedback && (
                        <div className="mt-4 p-4 bg-indigo-950/40 border border-indigo-500/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-indigo-300 font-semibold text-sm flex items-center gap-2">
                                    <Sparkles size={14} />
                                    AI Assessment: Level {aiFeedback.rating}
                                </h4>
                                {aiFeedback.rating !== difficulty && (
                                    <button
                                        type="button"
                                        onClick={() => setDifficulty(aiFeedback.rating)}
                                        className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-colors"
                                    >
                                        Apply Rating
                                    </button>
                                )}
                            </div>
                            <p className="text-slate-300 text-sm mb-2">{aiFeedback.reasoning}</p>
                            
                            {/* Estimated Timeframe */}
                            {aiFeedback.estimatedTimeframe && (
                                <div className="mb-2 p-3 bg-slate-950/50 rounded-lg border border-slate-700">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CalendarClock size={14} className="text-emerald-400" />
                                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Estimated Timeframe</span>
                                    </div>
                                    <p className="text-white font-semibold text-base mb-1">{aiFeedback.estimatedTimeframe}</p>
                                    {aiFeedback.timeframeReasoning && (
                                        <p className="text-slate-400 text-xs italic">{aiFeedback.timeframeReasoning}</p>
                                    )}
                                </div>
                            )}
                            
                            <div className="text-slate-400 text-xs italic border-l-2 border-indigo-500/30 pl-3 mb-2">
                                "Suggestion: {aiFeedback.suggestion}"
                            </div>
                            {aiFeedback.alternativeActions && aiFeedback.alternativeActions.length > 0 && (
                                <div className="mt-3 bg-black/20 p-2 rounded border border-indigo-500/10">
                                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-1">Suggested Starting Points:</span>
                                    <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                                        {aiFeedback.alternativeActions.map((action, i) => (
                                            <li key={i}>{action}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium mt-3">
                                <Brain size={12} />
                                Analysis & suggestions will be attached to protocol upon creation.
                            </div>
                        </div>
                    )}

                    {!isValid && (
                        <div className={`mt-4 p-4 rounded-lg border flex flex-col gap-3 ${isTooEasy ? 'bg-blue-900/10 border-blue-900/40' : 'bg-red-900/10 border-red-900/40'}`}>
                            <div className="flex items-start gap-3">
                                {isTooEasy ? <Zap className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                                <div>
                                    <h4 className={`text-sm font-bold mb-1 ${isTooEasy ? 'text-blue-300' : 'text-red-300'}`}>
                                        {isTooEasy ? 'Protocol Too Simple (Low Arousal)' : 'Protocol Too Complex (High Friction)'}
                                    </h4>
                                    <p className={`text-xs ${isTooEasy ? 'text-blue-200/70' : 'text-red-200/70'}`}>
                                        {isTooEasy 
                                            ? "This goal lacks the necessary challenge to sustain dopaminergic drive. You need to expand the scope." 
                                            : "This goal is likely to trigger amygdala-based avoidance. You need to reduce the scope to stepping stones."}
                                    </p>
                                </div>
                            </div>

                            {isTooEasy && (
                                <button
                                    type="button"
                                    onClick={handleExpandHorizon}
                                    disabled={isExpanding || !title}
                                    className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg text-xs font-bold border border-blue-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
                                >
                                    {isExpanding ? <Loader2 size={14} className="animate-spin" /> : <Target size={14} />}
                                    Expand Horizon (Increase Ambition)
                                </button>
                            )}

                            {isTooHard && (
                                <button
                                    type="button"
                                    onClick={handleReduceScope}
                                    disabled={isSimplifying || !title}
                                    className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg text-xs font-bold border border-red-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
                                >
                                    {isSimplifying ? <Loader2 size={14} className="animate-spin" /> : <Minimize2 size={14} />}
                                    Reduce Scope (Break Down Goal)
                                </button>
                            )}
                        </div>
                    )}

                    {/* Expansion Suggestions List */}
                    {expansionSuggestions && (
                        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                            <div className="text-[10px] text-blue-400 uppercase tracking-widest font-bold flex items-center gap-2">
                                <Target size={10} /> Expanded Protocols
                            </div>
                            {expansionSuggestions.map((s, i) => (
                                <div 
                                    key={i} 
                                    onClick={() => applySuggestion(s)}
                                    className="p-3 bg-slate-950/50 border border-blue-500/20 rounded-lg cursor-pointer hover:border-blue-500/60 hover:bg-slate-950 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h5 className="text-sm font-bold text-blue-300 group-hover:text-blue-200 transition-colors">{s.title}</h5>
                                        <div className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">LVL {s.difficulty}</div>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-2 line-clamp-2">{s.description}</p>
                                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-mono">
                                        <Zap size={10} /> {s.reasoning}
                                    </div>
                                </div>
                            ))}
                            <button 
                                onClick={() => setExpansionSuggestions(null)}
                                className="w-full text-[10px] text-slate-600 hover:text-slate-400 py-1"
                            >
                                Dismiss Suggestions
                            </button>
                        </div>
                    )}

                    {/* Simplification Suggestions List */}
                    {simplificationSuggestions && (
                        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                            <div className="text-[10px] text-red-400 uppercase tracking-widest font-bold flex items-center gap-2">
                                <Minimize2 size={10} /> Reduced Scope Protocols
                            </div>
                            {simplificationSuggestions.map((s, i) => (
                                <div 
                                    key={i} 
                                    onClick={() => applySuggestion(s)}
                                    className="p-3 bg-slate-950/50 border border-emerald-500/20 rounded-lg cursor-pointer hover:border-emerald-500/60 hover:bg-slate-950 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h5 className="text-sm font-bold text-emerald-300 group-hover:text-emerald-200 transition-colors">{s.title}</h5>
                                        <div className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">LVL {s.difficulty}</div>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-2 line-clamp-2">{s.description}</p>
                                    <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-mono">
                                        <CheckCircle size={10} /> {s.reasoning}
                                    </div>
                                </div>
                            ))}
                            <button 
                                onClick={() => setSimplificationSuggestions(null)}
                                className="w-full text-[10px] text-slate-600 hover:text-slate-400 py-1"
                            >
                                Dismiss Suggestions
                            </button>
                        </div>
                    )}
                    
                    {isValid && (
                        <div className="mt-4 p-3 bg-green-900/20 border border-green-900/50 rounded flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <p className="text-sm text-green-300">
                                <strong>Optimal Zone:</strong> Dopamine-Adrenaline balance optimized for pursuit.
                            </p>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="text-red-400 text-sm bg-red-950/30 p-3 rounded">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!isValid || loading}
                    className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all
                        ${isValid 
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                        }`}
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Initialize Goal Protocol'}
                </button>
            </form>
        </div>
    );
};

export default CreateGoalForm;