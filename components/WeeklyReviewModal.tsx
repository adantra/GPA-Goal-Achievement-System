import React, { useState, useEffect } from 'react';
import { Goal, WeeklyReview } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { X, Calendar, TrendingUp, AlertCircle, Target, Lightbulb, Sparkles, Loader2 } from 'lucide-react';

interface Props {
    goals: Goal[];
    onClose: () => void;
}

const WeeklyReviewModal: React.FC<Props> = ({ goals, onClose }) => {
    const [wentWell, setWentWell] = useState('');
    const [blockers, setBlockers] = useState('');
    const [priorities, setPriorities] = useState<string[]>(['', '', '']);
    const [aiInsights, setAiInsights] = useState<string>('');
    const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [pastReviews, setPastReviews] = useState<WeeklyReview[]>([]);

    const getWeekDates = () => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        return {
            start: monday.toISOString().split('T')[0],
            end: sunday.toISOString().split('T')[0],
            display: `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        };
    };

    const weekDates = getWeekDates();

    useEffect(() => {
        // Load past reviews
        const savedReviews = localStorage.getItem('gpa_weekly_reviews');
        if (savedReviews) {
            setPastReviews(JSON.parse(savedReviews));
        }
    }, []);

    const handleGenerateInsights = async () => {
        if (!process.env.API_KEY) {
            alert("API Key missing for AI insights");
            return;
        }

        setIsGeneratingInsights(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const activeGoals = goals.filter(g => g.status === 'active');
            const completedMilestones = goals.flatMap(g => 
                g.milestones.filter(m => m.isCompleted)
            ).length;
            
            const goalsContext = activeGoals.map(g => 
                `- "${g.title}" (Difficulty: ${g.difficultyRating}/10, ${g.milestones.filter(m => m.isCompleted).length}/${g.milestones.length} milestones completed)`
            ).join('\n');

            const prompt = `
                Act as a high-performance life coach analyzing a user's weekly progress.
                
                Current Active Goals:
                ${goalsContext}
                
                User's Reflection:
                What went well: "${wentWell}"
                What blocked them: "${blockers}"
                Next week priorities: ${priorities.filter(p => p.trim()).join(', ')}
                
                Provide 3-5 specific, actionable insights:
                1. Celebrate wins (be specific)
                2. Identify patterns in blockers
                3. Suggest strategies to overcome obstacles
                4. Recommend goal adjustments if needed
                5. Motivational guidance based on neuroscience
                
                Be encouraging but realistic. Reference specific goals they mentioned.
                Keep tone conversational and supportive.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-flash-lite-latest',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            insights: { type: Type.STRING }
                        },
                        required: ["insights"]
                    }
                }
            });

            if (response.text) {
                const data = JSON.parse(response.text);
                setAiInsights(data.insights);
            }
        } catch (err) {
            console.error("Failed to generate insights", err);
            alert("Failed to generate AI insights. Please try again.");
        } finally {
            setIsGeneratingInsights(false);
        }
    };

    const handleSave = () => {
        setIsSaving(true);
        
        const review: WeeklyReview = {
            id: crypto.randomUUID(),
            weekStartDate: weekDates.start,
            weekEndDate: weekDates.end,
            wentWell,
            blockers,
            priorities: priorities.filter(p => p.trim()),
            aiInsights,
            completedAt: new Date().toISOString()
        };

        const reviews = [...pastReviews, review];
        localStorage.setItem('gpa_weekly_reviews', JSON.stringify(reviews));
        
        setTimeout(() => {
            setIsSaving(false);
            alert('Weekly review saved! 🎉');
            onClose();
        }, 500);
    };

    const updatePriority = (index: number, value: string) => {
        const newPriorities = [...priorities];
        newPriorities[index] = value;
        setPriorities(newPriorities);
    };

    const canGenerateInsights = wentWell.trim() || blockers.trim() || priorities.some(p => p.trim());

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-3xl w-full max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Calendar size={28} className="text-indigo-400" />
                                Weekly Review Ritual
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">
                                Week of {weekDates.display}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-500 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    
                    {/* What Went Well */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2">
                            <TrendingUp size={16} />
                            What went well this week?
                        </label>
                        <textarea
                            value={wentWell}
                            onChange={e => setWentWell(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-y min-h-[100px]"
                            placeholder="Celebrate your wins, big or small..."
                        />
                    </div>

                    {/* Blockers */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-red-400 uppercase tracking-wider mb-2">
                            <AlertCircle size={16} />
                            What blocked or challenged you?
                        </label>
                        <textarea
                            value={blockers}
                            onChange={e => setBlockers(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-y min-h-[100px]"
                            placeholder="What got in your way? Be honest..."
                        />
                    </div>

                    {/* Next Week Priorities */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-indigo-400 uppercase tracking-wider mb-3">
                            <Target size={16} />
                            Top 3 Priorities for Next Week
                        </label>
                        <div className="space-y-3">
                            {priorities.map((priority, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <span className="text-indigo-400 font-bold text-sm shrink-0">{index + 1}.</span>
                                    <input
                                        type="text"
                                        value={priority}
                                        onChange={e => updatePriority(index, e.target.value)}
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        placeholder={`Priority ${index + 1}...`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Insights */}
                    <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 rounded-xl p-5 border border-indigo-500/20">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                                <Lightbulb size={16} className="text-yellow-400" />
                                AI Coach Insights
                            </h4>
                            <button
                                onClick={handleGenerateInsights}
                                disabled={isGeneratingInsights || !canGenerateInsights}
                                className="text-sm flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                {isGeneratingInsights ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={14} />
                                        Generate Insights
                                    </>
                                )}
                            </button>
                        </div>
                        
                        {aiInsights ? (
                            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                {aiInsights}
                            </div>
                        ) : (
                            <p className="text-slate-500 italic text-sm">
                                Fill in your reflections above, then click "Generate Insights" for personalized AI coaching.
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-900 shrink-0">
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || (!wentWell.trim() && !blockers.trim() && !priorities.some(p => p.trim()))}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Complete Review'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeeklyReviewModal;

