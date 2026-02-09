import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Share2, Award, X } from 'lucide-react';
import { Goal } from '../../types';

interface Props {
    goal: Goal;
    onClose: () => void;
}

/**
 * Celebration modal shown when a goal is completed.
 * Features:
 * - Confetti animation
 * - Achievement badge display
 * - Share-worthy completion card
 */
const CompletionCelebration: React.FC<Props> = ({ goal, onClose }) => {
    useEffect(() => {
        // Trigger confetti animation on mount
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

        function randomInRange(min: number, max: number) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                clearInterval(interval);
                return;
            }

            const particleCount = 50 * (timeLeft / duration);

            // Left side
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            // Right side
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    const completedMilestones = goal.milestones.filter(m => m.isCompleted).length;
    const totalMilestones = goal.milestones.length;

    // Determine achievement badge based on difficulty and milestones
    const getAchievementBadge = () => {
        if (goal.difficultyRating >= 8) {
            return { icon: '🏆', title: 'Legendary', subtitle: 'Conquered an epic challenge', color: 'from-yellow-500 to-orange-500' };
        } else if (totalMilestones >= 10) {
            return { icon: '🎯', title: 'Marathon Master', subtitle: 'Completed 10+ milestones', color: 'from-purple-500 to-pink-500' };
        } else if (goal.difficultyRating >= 6) {
            return { icon: '⭐', title: 'High Achiever', subtitle: 'Crushed a tough goal', color: 'from-blue-500 to-indigo-500' };
        } else {
            return { icon: '✨', title: 'Goal Getter', subtitle: 'Achievement unlocked', color: 'from-emerald-500 to-teal-500' };
        }
    };

    const badge = getAchievementBadge();

    const handleShare = () => {
        const text = `🎉 Just completed my goal: "${goal.title}"! ${completedMilestones} milestones conquered. #GoalPursuitAccelerator #Achievement`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Goal Completed!',
                text,
            }).catch(err => console.log('Share failed:', err));
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(text);
            alert('Achievement copied to clipboard! Share it with your network.');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className={`bg-gradient-to-r ${badge.color} p-6 relative overflow-hidden`}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition text-white"
                    >
                        <X size={20} />
                    </button>
                    <div className="text-center">
                        <div className="text-6xl mb-3 animate-bounce">{badge.icon}</div>
                        <h2 className="text-2xl font-bold text-white mb-1">{badge.title}</h2>
                        <p className="text-white/80 text-sm">{badge.subtitle}</p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Goal Info */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-start gap-3 mb-3">
                            <Trophy size={24} className="text-emerald-400 shrink-0 mt-1" />
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-1">{goal.title}</h3>
                                <p className="text-sm text-slate-400">{goal.description}</p>
                            </div>
                        </div>
                        <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <Award size={16} className="text-indigo-400" />
                                <span className="text-slate-300">
                                    <span className="font-semibold">{completedMilestones}</span> milestones
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500">•</span>
                                <span className="text-slate-300">
                                    Difficulty: <span className="font-semibold text-indigo-400">{goal.difficultyRating}/10</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleShare}
                            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                        >
                            <Share2 size={18} />
                            Share Achievement
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-lg transition-colors font-medium border border-slate-700"
                        >
                            Continue
                        </button>
                    </div>

                    {/* Motivational quote */}
                    <div className="text-center">
                        <p className="text-sm text-slate-500 italic">
                            "Success is the sum of small efforts, repeated day in and day out."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompletionCelebration;
