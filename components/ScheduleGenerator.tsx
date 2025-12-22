import React, { useState, useEffect } from 'react';
import { Goal } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { X, CalendarClock, Loader2, Sun, Moon, Briefcase, Coffee, Zap, RefreshCw, CalendarDays } from 'lucide-react';

interface Props {
    goals: Goal[];
    onClose: () => void;
}

interface ScheduleItem {
    time: string;
    activity: string;
    type: 'protocol' | 'routine' | 'rest' | 'work';
    protocolRef?: string; // Reference to the goal title if applicable
}

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface FullSchedule {
    monday: ScheduleItem[];
    tuesday: ScheduleItem[];
    wednesday: ScheduleItem[];
    thursday: ScheduleItem[];
    friday: ScheduleItem[];
    saturday: ScheduleItem[];
    sunday: ScheduleItem[];
    reasoning: string;
}

const ScheduleGenerator: React.FC<Props> = ({ goals, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [schedule, setSchedule] = useState<FullSchedule | null>(null);
    const [viewMode, setViewMode] = useState<DayKey>('monday');
    const [error, setError] = useState<string | null>(null);

    const generateSchedule = async () => {
        if (!process.env.API_KEY) {
            setError("API Key missing.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const activeGoals = goals.filter(g => g.status === 'active');
            const goalsContext = activeGoals.map(g => {
                const pendingMilestones = g.milestones.filter(m => !m.isCompleted).map(m => m.title).join(", ");
                return `- Protocol: "${g.title}" (Difficulty: ${g.difficultyRating}/10). Focus: ${g.description}. Current Phase/Milestones: ${pendingMilestones}`;
            }).join('\n');

            const prompt = `
                You are a master scheduler focusing on neurological optimization.
                Create a realistic, balanced 7-day weekly schedule (Monday through Sunday) for a user with a standard 9-5 job (Mon-Fri).
                
                Active Protocols to Integrate:
                ${goalsContext}

                Rules:
                1. Monday-Friday are Workdays (9am-5pm job).
                2. Saturday-Sunday are Weekends (free time).
                3. INTELLIGENT DISTRIBUTION: Balance the protocols across the week.
                   - If a protocol is daily (e.g. Meditation), schedule it every day.
                   - If a protocol is intense physical training (e.g. Hypertrophy), distribute it optimally (e.g. Mon, Tue, Thu, Fri) with rest days.
                   - Don't overload a single day.
                4. Respect circadian rhythms (light in morning, dark at night).
                5. Label items associated with the user's goals as type 'protocol'.
                6. Label standard life stuff (Sleep, Commute, 9-5 Work) as 'routine' or 'work'.
                
                Return JSON format with keys for all 7 days (lowercase) and reasoning.
            `;

            const itemSchema = {
                type: Type.OBJECT,
                properties: {
                    time: { type: Type.STRING },
                    activity: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['protocol', 'routine', 'rest', 'work'] },
                    protocolRef: { type: Type.STRING }
                },
                required: ["time", "activity", "type"]
            };

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            monday: { type: Type.ARRAY, items: itemSchema },
                            tuesday: { type: Type.ARRAY, items: itemSchema },
                            wednesday: { type: Type.ARRAY, items: itemSchema },
                            thursday: { type: Type.ARRAY, items: itemSchema },
                            friday: { type: Type.ARRAY, items: itemSchema },
                            saturday: { type: Type.ARRAY, items: itemSchema },
                            sunday: { type: Type.ARRAY, items: itemSchema },
                            reasoning: { type: Type.STRING }
                        },
                        required: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "reasoning"]
                    }
                }
            });

            if (response.text) {
                const data = JSON.parse(response.text);
                setSchedule(data);
            }
        } catch (err: any) {
            console.error(err);
            setError("Failed to synthesize schedule.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        generateSchedule();
    }, []);

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'protocol': return 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-900/40';
            case 'work': return 'bg-slate-800 border-slate-700 text-slate-400';
            case 'rest': return 'bg-emerald-900/30 border-emerald-800 text-emerald-300';
            default: return 'bg-slate-900 border-slate-800 text-slate-500';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'protocol': return <Zap size={14} className="text-yellow-400" />;
            case 'work': return <Briefcase size={14} />;
            case 'rest': return <Coffee size={14} />;
            case 'routine': 
            default: return <Sun size={14} />;
        }
    };

    const days: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-4xl w-full h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-800 bg-slate-900 z-10 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                <CalendarClock size={24} />
                            </div>
                            Neuro-Chronology: Weekly Architecture
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">7-Day Protocol Distribution & Optimization.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-500 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-950/50 relative">
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-20">
                            <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
                            <p className="text-indigo-300 font-mono animate-pulse">Calculating Temporal Architecture...</p>
                        </div>
                    )}

                    {!loading && schedule && (
                        <div className="max-w-3xl mx-auto">
                            {/* Day Selector */}
                            <div className="flex justify-between items-center bg-slate-900 p-1.5 rounded-xl border border-slate-800 mb-8 overflow-x-auto">
                                {days.map(day => (
                                    <button 
                                        key={day}
                                        onClick={() => setViewMode(day)}
                                        className={`flex-1 min-w-[3rem] py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                            viewMode === day 
                                            ? 'bg-indigo-600 text-white shadow-lg' 
                                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                                        }`}
                                    >
                                        {day.substring(0, 3)}
                                    </button>
                                ))}
                            </div>

                            <div className="mb-4 flex items-center gap-2 text-sm text-indigo-300 font-mono">
                                <CalendarDays size={16} />
                                <span className="uppercase font-bold">{viewMode} Schedule</span>
                            </div>

                            <div className="space-y-4 relative before:absolute before:left-[4.5rem] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-800">
                                {schedule[viewMode]?.map((item, idx) => (
                                    <div key={idx} className="flex items-stretch gap-6 group">
                                        <div className="w-16 text-right pt-3 font-mono text-sm text-slate-500 font-bold shrink-0">
                                            {item.time}
                                        </div>
                                        
                                        {/* Connector Dot */}
                                        <div className="relative flex flex-col items-center">
                                            <div className={`w-3 h-3 rounded-full border-2 mt-4 z-10 bg-slate-950 ${item.type === 'protocol' ? 'border-indigo-500 bg-indigo-500 box-content shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'border-slate-700'}`}></div>
                                        </div>

                                        <div className={`flex-1 p-4 rounded-xl border transition-all hover:scale-[1.01] ${getTypeColor(item.type)}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold flex items-center gap-2">
                                                    {getTypeIcon(item.type)}
                                                    {item.activity}
                                                </h4>
                                                {item.type === 'protocol' && (
                                                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white font-mono uppercase tracking-wider">
                                                        High Priority
                                                    </span>
                                                )}
                                            </div>
                                            {item.protocolRef && (
                                                <div className="text-xs opacity-80 mt-1 flex items-center gap-1">
                                                    <RefreshCw size={10} />
                                                    Linked to: {item.protocolRef}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-lg">
                                <h4 className="text-indigo-400 text-xs font-bold uppercase mb-2">Neural Architect's Weekly Strategy</h4>
                                <p className="text-slate-400 text-sm italic">"{schedule.reasoning}"</p>
                            </div>
                        </div>
                    )}
                    
                    {error && (
                        <div className="flex flex-col items-center justify-center h-full text-red-400">
                            <p className="mb-4">{error}</p>
                            <button onClick={generateSchedule} className="px-4 py-2 bg-slate-800 rounded-lg text-white text-sm">Retry</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScheduleGenerator;