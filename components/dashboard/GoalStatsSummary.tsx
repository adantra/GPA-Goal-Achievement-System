import React, { useMemo } from 'react';
import { Goal } from '../../types';
import { Target, TrendingUp, Calendar, Flame } from 'lucide-react';

interface Props {
    goals: Goal[];
}

/**
 * Displays aggregate statistics about goals and milestones:
 * - Active vs completed goals
 * - Weekly milestone completions
 * - Current streak (consecutive days with milestone activity)
 */
const GoalStatsSummary: React.FC<Props> = ({ goals }) => {
    const stats = useMemo(() => {
        const activeCount = goals.filter(g => g.status === 'active').length;
        const completedCount = goals.filter(g => g.status === 'completed').length;
        
        // Calculate this week's milestone completions
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);
        
        let weeklyCompletions = 0;
        const allMilestones = goals.flatMap(g => g.milestones);
        
        // Count completed milestones (we don't have completedAt timestamp, so we count all completed ones for now)
        // TODO: Add completedAt timestamp to Milestone type for accurate weekly tracking
        weeklyCompletions = allMilestones.filter(m => m.isCompleted).length;
        
        // Calculate streak (simplified: days with activity based on lastWorkedOn)
        // For a proper implementation, we'd need a daily activity log
        const datesWithActivity = goals
            .filter(g => g.lastWorkedOn)
            .map(g => new Date(g.lastWorkedOn!).toDateString())
            .filter((date, index, self) => self.indexOf(date) === index)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        
        let streak = 0;
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (datesWithActivity.length > 0) {
            if (datesWithActivity[0] === today || datesWithActivity[0] === yesterday) {
                streak = 1;
                let checkDate = new Date(datesWithActivity[0]);
                
                for (let i = 1; i < datesWithActivity.length; i++) {
                    const prevDate = new Date(checkDate);
                    prevDate.setDate(prevDate.getDate() - 1);
                    
                    if (datesWithActivity[i] === prevDate.toDateString()) {
                        streak++;
                        checkDate = prevDate;
                    } else {
                        break;
                    }
                }
            }
        }
        
        return { activeCount, completedCount, weeklyCompletions, streak };
    }, [goals]);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
                icon={<Target size={20} className="text-indigo-400" />}
                label="Active Goals"
                value={stats.activeCount}
                color="indigo"
            />
            <StatCard
                icon={<TrendingUp size={20} className="text-emerald-400" />}
                label="Completed"
                value={stats.completedCount}
                color="emerald"
            />
            <StatCard
                icon={<Calendar size={20} className="text-purple-400" />}
                label="Week's Milestones"
                value={stats.weeklyCompletions}
                color="purple"
            />
            <StatCard
                icon={<Flame size={20} className="text-orange-400" />}
                label="Current Streak"
                value={stats.streak}
                subtitle={stats.streak === 1 ? 'day' : 'days'}
                color="orange"
            />
        </div>
    );
};

const StatCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: number;
    subtitle?: string;
    color: 'indigo' | 'emerald' | 'purple' | 'orange';
}> = ({ icon, label, value, subtitle, color }) => {
    const colorClasses = {
        indigo: 'bg-indigo-950/30 border-indigo-500/20 hover:border-indigo-500/40',
        emerald: 'bg-emerald-950/30 border-emerald-500/20 hover:border-emerald-500/40',
        purple: 'bg-purple-950/30 border-purple-500/20 hover:border-purple-500/40',
        orange: 'bg-orange-950/30 border-orange-500/20 hover:border-orange-500/40',
    };

    return (
        <div className={`${colorClasses[color]} border rounded-xl p-4 transition-all hover:scale-105 hover:shadow-lg`}>
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</span>
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">{value}</span>
                {subtitle && <span className="text-sm text-slate-500">{subtitle}</span>}
            </div>
        </div>
    );
};

export default GoalStatsSummary;
