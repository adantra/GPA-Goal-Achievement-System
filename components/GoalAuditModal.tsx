import React, { useState, useEffect } from 'react';
import { Goal } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { X, PieChart, Loader2, Target, AlertTriangle, CheckCircle, Brain, Scale, Lightbulb, Sparkles } from 'lucide-react';

interface Props {
    goals: Goal[];
    onClose: () => void;
}

interface CategoryBreakdown {
    category: string;
    count: number;
    status: 'balanced' | 'deficient' | 'excessive';
}

interface AuditResult {
    overallScore: number;
    summary: string;
    categoryBreakdown: CategoryBreakdown[];
    loadAnalysis: string;
    recommendations: string[];
}

const GoalAuditModal: React.FC<Props> = ({ goals, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [audit, setAudit] = useState<AuditResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingSuggestions, setLoadingSuggestions] = useState<string | null>(null); // Track which category is loading
    const [categorySuggestions, setCategorySuggestions] = useState<Record<string, string[]>>({}); // Store suggestions per category

    useEffect(() => {
        const generateAudit = async () => {
            if (!process.env.API_KEY) {
                setError("API Key missing.");
                setLoading(false);
                return;
            }

            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                const activeGoals = goals.filter(g => g.status === 'active');
                
                if (activeGoals.length === 0) {
                    setAudit({
                        overallScore: 0,
                        summary: "No active goals detected. You are currently in a state of stasis.",
                        categoryBreakdown: [],
                        loadAnalysis: "Load is zero. The brain requires challenge to maintain neuroplasticity.",
                        recommendations: ["Create at least one physical goal.", "Create one learning goal."]
                    });
                    setLoading(false);
                    return;
                }

                const goalsContext = activeGoals.map(g => 
                    `- "${g.title}" (Difficulty: ${g.difficultyRating}/10): ${g.description}`
                ).join('\n');

                const prompt = `
                    Act as a high-performance life architect and neuro-optimization coach.
                    Analyze the user's current goal portfolio to determine if they are leading a balanced life or heading towards burnout/neglect.
                    
                    Goals:
                    ${goalsContext}

                    Analyze against these 5 pillars:
                    1. Physical (Health, Fitness)
                    2. Cognitive/Career (Wealth, Skills, Work)
                    3. Emotional/Social (Relationships, Connection)
                    4. Restorative/Spiritual (Sleep, Meditation, Meaning)
                    5. Creative/Play (Hobbies, Fun)

                    Determine:
                    - Overall Balance Score (0-100).
                    - Category Breakdown (Count goals in each pillar, mark as 'balanced', 'deficient' (0 goals), or 'excessive' (3+ goals)).
                    - Load Analysis: Is the total difficulty volume too high (cortisol risk) or too low (boredom)?
                    - 3 Concrete Recommendations to fix the balance.
                `;

                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                overallScore: { type: Type.INTEGER },
                                summary: { type: Type.STRING },
                                categoryBreakdown: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            category: { type: Type.STRING },
                                            count: { type: Type.INTEGER },
                                            status: { type: Type.STRING, enum: ['balanced', 'deficient', 'excessive'] }
                                        }
                                    }
                                },
                                loadAnalysis: { type: Type.STRING },
                                recommendations: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING }
                                }
                            },
                            required: ["overallScore", "summary", "categoryBreakdown", "loadAnalysis", "recommendations"]
                        }
                    }
                });

                if (response.text) {
                    setAudit(JSON.parse(response.text));
                }
            } catch (err: any) {
                console.error(err);
                setError("Audit failed: " + err.message);
            } finally {
                setLoading(false);
            }
        };

        generateAudit();
    }, [goals]);

    const generateSuggestions = async (category: CategoryBreakdown) => {
        if (!process.env.API_KEY) {
            alert("API Key missing.");
            return;
        }

        setLoadingSuggestions(category.category);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const activeGoals = goals.filter(g => g.status === 'active');
            const goalsContext = activeGoals.map(g => 
                `- "${g.title}" (Difficulty: ${g.difficultyRating}/10): ${g.description}`
            ).join('\n');

            const prompt = `
                Act as a high-performance life architect and goal-setting coach.
                
                The user's current goals are:
                ${goalsContext}
                
                The "${category.category}" life pillar is currently ${category.status} (${category.count} goals).
                
                ${category.status === 'deficient' ? 
                    `This area is DEFICIENT. Provide 3-5 specific, actionable goal suggestions to strengthen this pillar. Make them concrete and compelling.` :
                    `This area is EXCESSIVE. Provide 3-5 specific suggestions on how to consolidate, prioritize, or potentially remove/defer some goals to reduce cognitive load while maintaining progress.`
                }
                
                Consider:
                - Specific, measurable outcomes
                - Realistic time commitments
                - Synergy with existing goals
                - Practical first steps
                
                For deficient areas, suggest NEW goals to add.
                For excessive areas, suggest ways to consolidate or streamline EXISTING goals.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-flash-lite-latest',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            suggestions: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            }
                        },
                        required: ["suggestions"]
                    }
                }
            });

            if (response.text) {
                const data = JSON.parse(response.text);
                setCategorySuggestions(prev => ({
                    ...prev,
                    [category.category]: data.suggestions
                }));
            }
        } catch (err: any) {
            console.error(err);
            alert("Failed to generate suggestions: " + err.message);
        } finally {
            setLoadingSuggestions(null);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400 border-emerald-500';
        if (score >= 60) return 'text-yellow-400 border-yellow-500';
        return 'text-red-400 border-red-500';
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-4xl w-full max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-800 bg-slate-900 z-10 flex justify-between items-start shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                <PieChart size={24} />
                            </div>
                            Neuro-Balance Audit
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Holistic evaluation of your current pursuit portfolio.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-500 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-950/30">
                    {loading && (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <Loader2 size={48} className="animate-spin text-indigo-500" />
                            <p className="text-indigo-300 font-mono animate-pulse">Analyzing Life Architecture...</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="bg-red-900/20 border border-red-900/50 p-4 rounded-xl text-red-300 flex items-center gap-3">
                            <AlertTriangle size={24} />
                            {error}
                        </div>
                    )}

                    {!loading && audit && (
                        <div className="space-y-8">
                            {/* Score Section */}
                            <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
                                <div className={`w-40 h-40 rounded-full border-8 flex flex-col items-center justify-center bg-slate-900 shadow-[0_0_30px_rgba(0,0,0,0.5)] ${getScoreColor(audit.overallScore)}`}>
                                    <span className="text-4xl font-black">{audit.overallScore}</span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">Balance</span>
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-xl font-bold text-white mb-2">Audit Summary</h3>
                                    <p className="text-slate-300 leading-relaxed">{audit.summary}</p>
                                </div>
                            </div>

                            {/* Load Analysis */}
                            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-300 uppercase tracking-wider mb-3">
                                    <Scale size={16} /> Cognitive Load Analysis
                                </h4>
                                <p className="text-slate-200">{audit.loadAnalysis}</p>
                            </div>

                            {/* Category Grid */}
                            <div>
                                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                                    <Target size={16} /> Life Pillars Breakdown
                                </h4>
                                <div className="space-y-4">
                                    {audit.categoryBreakdown.map((cat, idx) => (
                                        <div key={idx}>
                                            <div className={`p-4 rounded-xl border ${
                                                cat.status === 'balanced' ? 'bg-emerald-900/10 border-emerald-500/30' : 
                                                cat.status === 'deficient' ? 'bg-red-900/10 border-red-500/30' : 
                                                'bg-yellow-900/10 border-yellow-500/30'
                                            }`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="font-bold text-slate-200 text-base">{cat.category}</span>
                                                            <span className="text-2xl font-black text-slate-500/50">{cat.count}</span>
                                                            <div className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${
                                                                cat.status === 'balanced' ? 'text-emerald-400 bg-emerald-500/10' : 
                                                                cat.status === 'deficient' ? 'text-red-400 bg-red-500/10' : 
                                                                'text-yellow-400 bg-yellow-500/10'
                                                            }`}>
                                                                {cat.status}
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Suggestion Button for Deficient/Excessive */}
                                                        {cat.status !== 'balanced' && !categorySuggestions[cat.category] && (
                                                            <button
                                                                onClick={() => generateSuggestions(cat)}
                                                                disabled={loadingSuggestions === cat.category}
                                                                className="flex items-center gap-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 font-medium"
                                                            >
                                                                {loadingSuggestions === cat.category ? (
                                                                    <>
                                                                        <Loader2 size={12} className="animate-spin" />
                                                                        Generating...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Lightbulb size={12} />
                                                                        Get AI Suggestions
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Display Suggestions */}
                                                {categorySuggestions[cat.category] && (
                                                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Sparkles size={14} className="text-indigo-400" />
                                                            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                                                                {cat.status === 'deficient' ? 'Suggested Goals to Add' : 'Suggestions to Optimize'}
                                                            </span>
                                                        </div>
                                                        <ul className="space-y-2">
                                                            {categorySuggestions[cat.category].map((suggestion, i) => (
                                                                <li key={i} className="flex gap-2 text-slate-300 text-sm">
                                                                    <span className="text-indigo-400 shrink-0">{i + 1}.</span>
                                                                    <span>{suggestion}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-xl p-6 border border-indigo-500/20">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider mb-4">
                                    <Brain size={16} /> Neural Prescriptions
                                </h4>
                                <ul className="space-y-3">
                                    {audit.recommendations.map((rec, idx) => (
                                        <li key={idx} className="flex gap-3 text-slate-300">
                                            <div className="mt-1 min-w-[20px]">
                                                <CheckCircle size={16} className="text-indigo-400" />
                                            </div>
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GoalAuditModal;