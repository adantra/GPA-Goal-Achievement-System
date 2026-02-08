import React from 'react';
import { Activity, Flame, PieChart, Calendar, CalendarClock } from 'lucide-react';

interface Props {
    onShowAudit: () => void;
    onShowWeeklyReview: () => void;
    onShowSpaceTime: () => void;
    onShowAmygdala: () => void;
    onShowSchedule: () => void;
}

const NeuroToolsSidebar: React.FC<Props> = ({
    onShowAudit,
    onShowWeeklyReview,
    onShowSpaceTime,
    onShowAmygdala,
    onShowSchedule,
}) => {
    return (
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <h3 className="text-slate-300 font-semibold mb-2 text-sm uppercase tracking-wider">Neuro-Tools</h3>
            <div className="space-y-2">
                <button onClick={onShowAudit} className="w-full py-3 bg-indigo-900/20 hover:bg-indigo-900/40 border border-indigo-500/20 text-indigo-300 rounded-lg transition flex items-center justify-center gap-2 text-sm font-medium">
                    <PieChart size={16} /> Neuro-Balance Audit
                </button>
                <button onClick={onShowWeeklyReview} className="w-full py-3 bg-emerald-900/20 hover:bg-emerald-900/40 border border-emerald-500/20 text-emerald-300 rounded-lg transition flex items-center justify-center gap-2 text-sm font-medium">
                    <Calendar size={16} /> Weekly Review
                </button>
                <button onClick={onShowSpaceTime} className="w-full py-3 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-500/20 text-purple-300 rounded-lg transition flex items-center justify-center gap-2 text-sm font-medium">
                    <Activity size={16} /> Space-Time Bridge
                </button>
                <button onClick={onShowAmygdala} className="w-full py-3 bg-red-900/20 hover:bg-red-900/40 border border-red-500/20 text-red-300 rounded-lg transition flex items-center justify-center gap-2 text-sm font-medium">
                    <Flame size={16} /> Amygdala Protocol
                </button>
                <button onClick={onShowSchedule} className="w-full py-3 bg-sky-900/20 hover:bg-sky-900/40 border border-sky-500/20 text-sky-300 rounded-lg transition flex items-center justify-center gap-2 text-sm font-medium">
                    <CalendarClock size={16} /> Neuro-Chronology
                </button>
            </div>
        </div>
    );
};

export default NeuroToolsSidebar;
