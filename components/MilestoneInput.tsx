import React, { useState } from 'react';
import { ActionType, Action } from '../types';
import { Plus, X, ShieldAlert, ArrowRightCircle, Sparkles, Loader2 } from 'lucide-react';
import { createMilestone } from '../services/milestoneController';
import { GoogleGenAI, Type } from "@google/genai";

interface Props {
    goalId: string;
    goalTitle: string;
    goalDescription: string;
    onMilestoneCreated: () => void;
}

const MilestoneInput: React.FC<Props> = ({ goalId, goalTitle, goalDescription, onMilestoneCreated }) => {
    const [title, setTitle] = useState('');
    const [goActions, setGoActions] = useState<string[]>([]);
    const [noGoActions, setNoGoActions] = useState<string[]>([]);
    const [currentGo, setCurrentGo] = useState('');
    const [currentNoGo, setCurrentNoGo] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiThinking, setAiThinking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddGo = () => {
        if (currentGo.trim()) {
            setGoActions([...goActions, currentGo.trim()]);
            setCurrentGo('');
        }
    };

    const handleAddNoGo = () => {
        if (currentNoGo.trim()) {
            setNoGoActions([...noGoActions, currentNoGo.trim()]);
            setCurrentNoGo('');
        }
    };

    const removeAction = (type: ActionType, index: number) => {
        if (type === ActionType.GO) {
            setGoActions(goActions.filter((_, i) => i !== index));
        } else {
            setNoGoActions(noGoActions.filter((_, i) => i !== index));
        }
    };

    const handleAIGenerate = async () => {
        if (!process.env.API_KEY) {
            setError("Neuro-Link Error: API Key missing.");
            return;
        }

        setAiThinking(true);
        setError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = `
                You are a neuroscience-based goal achievement coach. 
                The user has the following goal: "${goalTitle}".
                Description: "${goalDescription}".
                
                Generate a single, concrete, actionable milestone to help achieve this goal. 
                Crucially, you must strictly follow the "Go/No-Go" protocol:
                1. Provide a concise Title.
                2. Provide 2-3 "Go" actions (Specific actions to take).
                3. Provide 2-3 "No-Go" actions (Specific distractions, habits, or behaviors to avoid).
                
                The difficulty should be moderate (Goldilocks zone).
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            go_actions: { 
                                type: Type.ARRAY, 
                                items: { type: Type.STRING } 
                            },
                            no_go_actions: { 
                                type: Type.ARRAY, 
                                items: { type: Type.STRING } 
                            }
                        },
                        required: ["title", "go_actions", "no_go_actions"]
                    }
                }
            });

            if (response.text) {
                const data = JSON.parse(response.text);
                setTitle(data.title);
                setGoActions(data.go_actions || []);
                setNoGoActions(data.no_go_actions || []);
            }

        } catch (err: any) {
            console.error(err);
            setError("Neural synthesis failed. Verify API configuration.");
        } finally {
            setAiThinking(false);
        }
    };

    const isValid = title.trim().length > 0 && goActions.length > 0 && noGoActions.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        setLoading(true);
        setError(null);

        const actions: Omit<Action, 'id'>[] = [
            ...goActions.map(desc => ({ description: desc, type: ActionType.GO })),
            ...noGoActions.map(desc => ({ description: desc, type: ActionType.NO_GO }))
        ];

        try {
            await createMilestone(goalId, title, actions);
            onMilestoneCreated();
            // Reset form
            setTitle('');
            setGoActions([]);
            setNoGoActions([]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mt-6 relative overflow-hidden">
            {aiThinking && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-indigo-400">
                    <Loader2 className="animate-spin mb-2" size={32} />
                    <span className="text-sm font-mono animate-pulse">Consulting Neural Network...</span>
                </div>
            )}

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Add Milestone</h3>
                <button
                    type="button"
                    onClick={handleAIGenerate}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 text-xs transition-colors"
                >
                    <Sparkles size={14} />
                    Auto-Fill with AI
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Milestone Title</label>
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g., Week 1 Training Log"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-indigo-500"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* GO Actions */}
                    <div className="bg-emerald-950/20 p-4 rounded-lg border border-emerald-900/50">
                        <label className="flex items-center gap-2 text-emerald-400 text-sm font-bold mb-3">
                            <ArrowRightCircle size={16} />
                            Actions to Take (GO)
                        </label>
                        <div className="flex gap-2 mb-3">
                            <input
                                value={currentGo}
                                onChange={e => setCurrentGo(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddGo())}
                                placeholder="Do this..."
                                className="flex-1 bg-slate-900 border border-slate-700 rounded text-sm p-2 text-white"
                            />
                            <button
                                type="button"
                                onClick={handleAddGo}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <ul className="space-y-2">
                            {goActions.map((action, i) => (
                                <li key={i} className="flex justify-between items-center text-sm text-slate-300 bg-slate-900/50 p-2 rounded">
                                    <span>{action}</span>
                                    <button type="button" onClick={() => removeAction(ActionType.GO, i)} className="text-slate-500 hover:text-red-400">
                                        <X size={14} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* NO-GO Actions */}
                    <div className="bg-red-950/20 p-4 rounded-lg border border-red-900/50">
                        <label className="flex items-center gap-2 text-red-400 text-sm font-bold mb-3">
                            <ShieldAlert size={16} />
                            Actions to Avoid (NO-GO)
                        </label>
                        <div className="flex gap-2 mb-3">
                            <input
                                value={currentNoGo}
                                onChange={e => setCurrentNoGo(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddNoGo())}
                                placeholder="Avoid this..."
                                className="flex-1 bg-slate-900 border border-slate-700 rounded text-sm p-2 text-white"
                            />
                            <button
                                type="button"
                                onClick={handleAddNoGo}
                                className="bg-red-600 hover:bg-red-500 text-white p-2 rounded"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <ul className="space-y-2">
                            {noGoActions.map((action, i) => (
                                <li key={i} className="flex justify-between items-center text-sm text-slate-300 bg-slate-900/50 p-2 rounded">
                                    <span>{action}</span>
                                    <button type="button" onClick={() => removeAction(ActionType.NO_GO, i)} className="text-slate-500 hover:text-red-400">
                                        <X size={14} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={!isValid || loading}
                    className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                        isValid 
                        ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                >
                    {loading ? 'Adding...' : 'Add Milestone'}
                </button>
            </form>
        </div>
    );
};

export default MilestoneInput;