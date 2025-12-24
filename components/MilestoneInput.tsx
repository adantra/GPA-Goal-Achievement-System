import React, { useState } from 'react';
import { ActionType, Action } from '../types';
import { Plus, X, ShieldAlert, ArrowRightCircle, Sparkles, Loader2, Check, Calendar } from 'lucide-react';
import { createMilestone } from '../services/milestoneController';
import { GoogleGenAI, Type } from "@google/genai";

interface Props {
    goalId: string;
    goalTitle: string;
    goalDescription: string;
    onMilestoneCreated: () => void;
}

interface MilestoneOption {
    title: string;
    description: string;
    go_actions: string[];
    no_go_actions: string[];
}

const MilestoneInput: React.FC<Props> = ({ goalId, goalTitle, goalDescription, onMilestoneCreated }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [title, setTitle] = useState('');
    
    // Default deadline to 1 week from now
    const getDefaultDeadline = () => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().split('T')[0];
    };
    
    const [deadline, setDeadline] = useState(getDefaultDeadline());
    const [goActions, setGoActions] = useState<string[]>([]);
    const [noGoActions, setNoGoActions] = useState<string[]>([]);
    const [currentGo, setCurrentGo] = useState('');
    const [currentNoGo, setCurrentNoGo] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiThinking, setAiThinking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // AI Options State
    const [aiOptions, setAiOptions] = useState<MilestoneOption[] | null>(null);

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

    const handleCancel = () => {
        setIsExpanded(false);
        setTitle('');
        setDeadline(getDefaultDeadline());
        setGoActions([]);
        setNoGoActions([]);
        setCurrentGo('');
        setCurrentNoGo('');
        setAiOptions(null);
        setError(null);
    };

    const handleAIGenerate = async () => {
        if (!process.env.API_KEY) {
            setError("Neuro-Link Error: API Key missing.");
            return;
        }

        setAiThinking(true);
        setError(null);
        setAiOptions(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = `
                You are a neuroscience-based goal achievement coach. 
                The user has the following goal: "${goalTitle}".
                Description: "${goalDescription}".
                
                Generate 3 distinct, concrete, actionable milestone options to help achieve this goal.
                Provide variety in strategy, intensity, or focus (e.g., "Steady Start", "Intense Push", "Technique Focus").

                Crucially, strictly follow the "Go/No-Go" protocol for each option:
                1. Title (Concise).
                2. Description (Briefly explain the strategy/difficulty).
                3. 2-3 "Go" actions (Specific actions to take).
                4. 2-3 "No-Go" actions (Specific distractions, habits, or behaviors to avoid).
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            options: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        go_actions: { 
                                            type: Type.ARRAY, 
                                            items: { type: Type.STRING } 
                                        },
                                        no_go_actions: { 
                                            type: Type.ARRAY, 
                                            items: { type: Type.STRING } 
                                        }
                                    },
                                    required: ["title", "description", "go_actions", "no_go_actions"]
                                }
                            }
                        },
                        required: ["options"]
                    }
                }
            });

            if (response.text) {
                const data = JSON.parse(response.text);
                if (data.options && Array.isArray(data.options)) {
                    setAiOptions(data.options);
                }
            }

        } catch (err: any) {
            console.error(err);
            setError("Neural synthesis failed. Verify API configuration.");
        } finally {
            setAiThinking(false);
        }
    };

    const selectOption = (option: MilestoneOption) => {
        setTitle(option.title);
        setGoActions(option.go_actions || []);
        setNoGoActions(option.no_go_actions || []);
        setAiOptions(null);
    };

    const isValid = title.trim().length > 0 && goActions.length > 0 && noGoActions.length > 0 && deadline;

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
            await createMilestone(goalId, title, deadline, actions);
            onMilestoneCreated();
            // Reset form and collapse
            handleCancel();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    if (!isExpanded) {
        return (
            <button 
                onClick={() => setIsExpanded(true)}
                className="w-full mt-4 py-3 border-2 border-dashed border-slate-800 rounded-xl text-slate-500 hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-slate-900/50 transition-all flex items-center justify-center gap-2 font-medium text-sm group"
            >
                <div className="p-1 rounded-full bg-slate-800 group-hover:bg-indigo-500/20 transition-colors">
                    <Plus size={16} />
                </div>
                Define New Milestone Protocol
            </button>
        );
    }

    return (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mt-6 relative overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200">
            {aiThinking && (
                <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-indigo-400">
                    <Loader2 className="animate-spin mb-2" size={32} />
                    <span className="text-sm font-mono animate-pulse">Consulting Neural Network...</span>
                </div>
            )}

            <button onClick={handleCancel} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-10">
                <X size={20} />
            </button>

            <div className="flex justify-between items-center mb-4 pr-8">
                <h3 className="text-lg font-semibold text-white">Add Milestone</h3>
                <button
                    type="button"
                    onClick={handleAIGenerate}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 text-xs transition-colors shadow-sm shadow-indigo-500/10"
                >
                    <Sparkles size={14} />
                    Get AI Suggestions
                </button>
            </div>

            {/* AI Options Selection */}
            {aiOptions && (
                <div className="mb-6 space-y-3 animate-in fade-in slide-in-from-top-4">
                    <div className="text-sm text-slate-400 mb-2">Select a strategy protocol:</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {aiOptions.map((opt, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => selectOption(opt)}
                                className="bg-slate-900/80 border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-900 rounded-xl p-4 cursor-pointer transition-all group flex flex-col h-full"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors line-clamp-1">{opt.title}</h4>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400">
                                        <Check size={16} />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mb-3 leading-relaxed flex-grow">{opt.description}</p>
                                
                                <div className="space-y-2 mt-auto pt-3 border-t border-slate-800/50">
                                    <div className="text-[10px]">
                                        <span className="text-emerald-500/80 font-bold uppercase tracking-wider block mb-1">Actions (Go)</span>
                                        <ul className="list-disc list-inside text-slate-500 space-y-0.5">
                                            {opt.go_actions.slice(0, 2).map((a, i) => <li key={i} className="truncate">{a}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center">
                        <button 
                            onClick={() => setAiOptions(null)}
                            className="text-xs text-slate-500 hover:text-white mt-2 underline decoration-slate-700 underline-offset-2"
                        >
                            Cancel Suggestions
                        </button>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-4"></div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Milestone Title</label>
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g., Week 1 Training Log"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-indigo-500"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1 flex items-center gap-2">
                            <Calendar size={14} /> Target Completion Date
                        </label>
                        <input
                            type="date"
                            value={deadline}
                            onChange={e => setDeadline(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-indigo-500 [color-scheme:dark]"
                            required
                        />
                    </div>
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
                            {goActions.length === 0 && <li className="text-xs text-slate-500 italic">Add at least one action...</li>}
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
                            {noGoActions.length === 0 && <li className="text-xs text-slate-500 italic">Add at least one avoidance...</li>}
                        </ul>
                    </div>
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 rounded-lg font-semibold bg-slate-900 text-slate-400 hover:text-white transition-colors text-sm border border-slate-700"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!isValid || loading}
                        className={`flex-1 py-2 rounded-lg font-semibold transition-all shadow-lg flex items-center justify-center gap-2 ${
                            isValid 
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20' 
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                        }`}
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                        {loading ? 'Adding...' : 'Add Milestone Protocol'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MilestoneInput;