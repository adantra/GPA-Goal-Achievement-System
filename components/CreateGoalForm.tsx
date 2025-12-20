import React, { useState } from 'react';
import { createGoal } from '../services/goalController';
import { Loader2, AlertTriangle, CheckCircle, Sparkles, Bot, Target, Zap } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import NeuralAssistant from './NeuralAssistant';
import GoalScalingWizard from './GoalScalingWizard';

interface Props {
    onGoalCreated: () => void;
}

const CreateGoalForm: React.FC<Props> = ({ onGoalCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState(5);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAssistant, setShowAssistant] = useState(false);
    const [showScalingWizard, setShowScalingWizard] = useState(false);
    
    // AI Assessment State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<{ rating: number; reasoning: string; suggestion: string } | null>(null);

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
                3. suggestion (if outside 6-8, suggest how to adjust it to be within 6-8. If inside, suggest how to maintain momentum).
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
                            suggestion: { type: Type.STRING }
                        },
                        required: ["estimated_rating", "reasoning", "suggestion"]
                    }
                }
            });

            if (response.text) {
                 const data = JSON.parse(response.text);
                 setAiFeedback({
                     rating: data.estimated_rating,
                     reasoning: data.reasoning,
                     suggestion: data.suggestion
                 });
            }
        } catch (err: any) {
            console.error(err);
            setError("AI Assessment failed.");
        } finally {
            setIsAnalyzing(false);
        }
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
                difficultyRating: difficulty
            });
            onGoalCreated();
            setTitle('');
            setDescription('');
            setDifficulty(5);
            setAiFeedback(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl relative">
            
            <NeuralAssistant 
                isOpen={showAssistant} 
                onClose={() => setShowAssistant(false)}
                contextData={{ title, description, mode: 'creation' }}
            />

            <GoalScalingWizard 
                isOpen={showScalingWizard}
                onClose={() => setShowScalingWizard(false)}
                onComplete={() => {
                    onGoalCreated();
                    setTitle('');
                    setDescription('');
                }}
            />

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="bg-indigo-500 w-2 h-6 rounded-full block"></span>
                    Define New Protocol
                </h2>
                <button
                    onClick={() => setShowAssistant(!showAssistant)}
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

                    {/* AI Feedback Display */}
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
                            <div className="text-slate-400 text-xs italic border-l-2 border-indigo-500/30 pl-3">
                                "Suggestion: {aiFeedback.suggestion}"
                            </div>
                        </div>
                    )}

                    {!isValid && (
                        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="p-3 bg-red-900/20 border border-red-900/50 rounded flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-300">
                                    <strong>Neuro-Lock Active:</strong> {isTooEasy ? "This task is too small/boring to recruit enough autonomic arousal." : "This goal is too difficult and will trigger avoidance."}
                                    <br/>Adjust slider to 6-8 or use the procedure below.
                                </p>
                            </div>
                            
                            {isTooEasy && (
                                <button
                                    type="button"
                                    onClick={() => setShowScalingWizard(true)}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/40"
                                >
                                    <Zap size={18} />
                                    Scale to Significance Procedure
                                </button>
                            )}
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