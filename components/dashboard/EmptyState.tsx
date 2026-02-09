import React from 'react';
import { Target, Sparkles, BrainCircuit, Rocket, ArrowLeft } from 'lucide-react';

interface Props {
    type: 'no-goals' | 'no-matches';
    onClearFilters?: () => void;
}

const EmptyState: React.FC<Props> = ({ type, onClearFilters }) => {
    if (type === 'no-matches') {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-8">
                {/* Animated search illustration */}
                <div className="relative mb-8">
                    <div className="w-24 h-24 rounded-full bg-slate-800/50 border-2 border-dashed border-slate-700 flex items-center justify-center animate-pulse">
                        <Target size={40} className="text-slate-600" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 bg-indigo-500/20 border border-indigo-500/30 rounded-full flex items-center justify-center">
                        <span className="text-indigo-400 text-sm">?</span>
                    </div>
                </div>
                <h3 className="text-xl font-bold text-slate-300 mb-2">No matching protocols</h3>
                <p className="text-slate-500 text-center max-w-md mb-6">
                    Your search or filter criteria didn't match any goals. Try broadening your search or clearing the active filters.
                </p>
                {onClearFilters && (
                    <button
                        onClick={onClearFilters}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg transition-colors font-medium text-sm"
                    >
                        <ArrowLeft size={16} />
                        Clear all filters
                    </button>
                )}
            </div>
        );
    }

    // no-goals — first-time / empty state
    return (
        <div className="flex flex-col items-center justify-center py-16 px-8">
            {/* Animated brain illustration */}
            <div className="relative mb-8">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-950/50 to-purple-950/50 border border-indigo-500/20 flex items-center justify-center">
                    <BrainCircuit size={56} className="text-indigo-400 animate-pulse" />
                </div>
                {/* Orbiting particles */}
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: '8s' }}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-3 h-3 bg-indigo-500/40 rounded-full"></div>
                </div>
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }}>
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-purple-500/40 rounded-full"></div>
                </div>
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: '6s' }}>
                    <div className="absolute top-1/2 right-0 translate-x-2 w-2 h-2 bg-emerald-500/40 rounded-full"></div>
                </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-3">Your neural network awaits</h3>
            <p className="text-slate-400 text-center max-w-lg mb-8 leading-relaxed">
                No active protocols detected. Define your first goal in the panel on the left to begin building your neural pathways toward achievement.
            </p>

            {/* Onboarding tips */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
                <OnboardingTip
                    icon={<Rocket size={20} className="text-indigo-400" />}
                    title="Create a goal"
                    description="Use the form on the left to set your first neural protocol"
                    step={1}
                />
                <OnboardingTip
                    icon={<Target size={20} className="text-emerald-400" />}
                    title="Add milestones"
                    description="Break it down into concrete, achievable checkpoints"
                    step={2}
                />
                <OnboardingTip
                    icon={<Sparkles size={20} className="text-purple-400" />}
                    title="Let AI assist"
                    description="The Neural Assistant can help refine and optimize your goals"
                    step={3}
                />
            </div>
        </div>
    );
};

const OnboardingTip: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    step: number;
}> = ({ icon, title, description, step }) => (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-indigo-500/30 transition-colors group">
        <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-400 border border-slate-700 group-hover:border-indigo-500/50 transition-colors">
                {step}
            </div>
            {icon}
        </div>
        <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
);

export default EmptyState;
