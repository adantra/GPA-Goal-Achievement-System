import React, { useState, useEffect } from 'react';
import { Goal, WOOPData } from '../../types';
import { updateGoal } from '../../services/goalController';
import { X, ChevronRight, ChevronLeft, Save, Sparkles, Star, Mountain, Shield, Check } from 'lucide-react';

interface Props {
    goal: Goal;
    onClose: () => void;
    onSaved: () => void;
}

const STEPS = [
    {
        key: 'wish' as const,
        title: 'Wish',
        icon: <Star size={20} className="text-yellow-400" />,
        color: 'yellow',
        prompt: 'What do you most wish for with this goal?',
        description: 'Name your most important wish or concern regarding this goal. Something challenging but achievable.',
        placeholder: 'e.g., I want to become fluent in Spanish within a year',
    },
    {
        key: 'outcome' as const,
        title: 'Outcome',
        icon: <Sparkles size={20} className="text-emerald-400" />,
        color: 'emerald',
        prompt: 'What would the best outcome look and feel like?',
        description: 'Imagine the very best outcome vividly. What does it look like? How would you feel? Let yourself experience it mentally.',
        placeholder: 'e.g., I feel confident ordering food, making jokes, and having deep conversations in Spanish. My friends are impressed.',
    },
    {
        key: 'obstacle' as const,
        title: 'Obstacle',
        icon: <Mountain size={20} className="text-red-400" />,
        color: 'red',
        prompt: 'What inner obstacle stands in the way?',
        description: 'Now think — what is it within you that holds you back from achieving this outcome? An emotion, habit, belief, or behavior.',
        placeholder: 'e.g., I get bored of flashcards after a week and lose motivation when I can\'t understand native speakers',
    },
    {
        key: 'plan' as const,
        title: 'Plan',
        icon: <Shield size={20} className="text-indigo-400" />,
        color: 'indigo',
        prompt: 'If [obstacle], then I will...',
        description: 'Create an if-then plan to overcome the obstacle. This is the critical link between intention and action.',
        placeholder: 'e.g., If I feel bored with flashcards, then I will switch to watching a Spanish show. If I can\'t understand, I\'ll turn on subtitles and note 3 new phrases.',
    },
];

const STEP_COLORS: Record<string, string> = {
    yellow: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/30',
    emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
    red: 'from-red-500/20 to-red-600/5 border-red-500/30',
    indigo: 'from-indigo-500/20 to-indigo-600/5 border-indigo-500/30',
};

/**
 * WOOP Modal — Mental Contrasting (Gabriele Oettingen)
 * Guided 4-step workflow: Wish → Outcome → Obstacle → Plan
 */
const WOOPModal: React.FC<Props> = ({ goal, onClose, onSaved }) => {
    const [step, setStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [data, setData] = useState<WOOPData>({
        wish: goal.woop?.wish || '',
        outcome: goal.woop?.outcome || '',
        obstacle: goal.woop?.obstacle || '',
        plan: goal.woop?.plan || '',
    });

    const currentStep = STEPS[step];
    const isLastStep = step === STEPS.length - 1;
    const isComplete = data.wish && data.outcome && data.obstacle && data.plan;
    const isExisting = !!goal.woop?.completedAt;

    const handleFieldChange = (value: string) => {
        setData(prev => ({ ...prev, [currentStep.key]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateGoal(goal.id, {
                woop: { ...data, completedAt: new Date().toISOString() },
            });
            onSaved();
            onClose();
        } catch (e) {
            console.error('Failed to save WOOP', e);
        } finally {
            setIsSaving(false);
        }
    };

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="text-2xl">🧠</span>
                            WOOP — Mental Contrasting
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            For: <span className="text-slate-400">{goal.title}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition p-1">
                        <X size={20} />
                    </button>
                </div>

                {/* Progress dots */}
                <div className="flex justify-center gap-3 pt-4 pb-2">
                    {STEPS.map((s, i) => (
                        <button
                            key={s.key}
                            onClick={() => setStep(i)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                                i === step
                                    ? 'bg-slate-700 text-white scale-105'
                                    : data[s.key]
                                        ? 'text-emerald-400 bg-emerald-500/10'
                                        : 'text-slate-600 hover:text-slate-400'
                            }`}
                        >
                            {data[s.key] ? <Check size={10} /> : <span className="text-[10px]">{i + 1}</span>}
                            {s.title}
                        </button>
                    ))}
                </div>

                {/* Step content */}
                <div className={`m-5 p-5 rounded-xl bg-gradient-to-br border ${STEP_COLORS[currentStep.color]}`}>
                    <div className="flex items-center gap-3 mb-3">
                        {currentStep.icon}
                        <div>
                            <h3 className="text-white font-semibold">{currentStep.prompt}</h3>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">{currentStep.description}</p>
                    <textarea
                        value={data[currentStep.key]}
                        onChange={e => handleFieldChange(e.target.value)}
                        placeholder={currentStep.placeholder}
                        rows={4}
                        className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        autoFocus
                    />
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between p-5 pt-0">
                    <button
                        onClick={() => setStep(s => s - 1)}
                        disabled={step === 0}
                        className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                        <ChevronLeft size={16} />
                        Back
                    </button>
                    
                    <div className="flex gap-2">
                        {isLastStep || isExisting ? (
                            <button
                                onClick={handleSave}
                                disabled={!isComplete || isSaving}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/30"
                            >
                                <Save size={14} />
                                {isSaving ? 'Saving...' : isExisting ? 'Update WOOP' : 'Complete WOOP'}
                            </button>
                        ) : (
                            <button
                                onClick={() => setStep(s => s + 1)}
                                disabled={!data[currentStep.key]}
                                className="flex items-center gap-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Next
                                <ChevronRight size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WOOPModal;
