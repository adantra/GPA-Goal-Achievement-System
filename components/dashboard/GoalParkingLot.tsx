import React, { useState } from 'react';
import { Goal } from '../../types';
import { ParkingSquare, Plus, Rocket, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatRelativeDate } from '../../utils/dateFormatting';
import { createParkedGoal, updateGoal, deleteGoal } from '../../services/goalController';

interface Props {
    parkedGoals: Goal[];
    onReload: () => Promise<void>;
}

/**
 * Goal Parking Lot — a "Someday/Maybe" section for goals that aren't active
 * but shouldn't be forgotten. Quick-add with just a title, one-click promotion.
 */
const GoalParkingLot: React.FC<Props> = ({ parkedGoals, onReload }) => {
    const [isExpanded, setIsExpanded] = useState(parkedGoals.length > 0);
    const [newTitle, setNewTitle] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = async () => {
        if (!newTitle.trim()) return;
        setIsAdding(true);
        try {
            await createParkedGoal(newTitle.trim());
            setNewTitle('');
            await onReload();
        } catch (e) {
            console.error('Failed to create parked goal', e);
        } finally {
            setIsAdding(false);
        }
    };

    const handlePromote = async (goal: Goal) => {
        if (!confirm(`Activate "${goal.title}"? It will move to your active goals.`)) return;
        try {
            await updateGoal(goal.id, { status: 'active', lastWorkedOn: new Date().toISOString() });
            await onReload();
        } catch (e) {
            console.error('Failed to promote goal', e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this parked goal permanently?')) return;
        try {
            await deleteGoal(id);
            await onReload();
        } catch (e) {
            console.error('Failed to delete parked goal', e);
        }
    };

    return (
        <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-900/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <ParkingSquare size={18} className="text-amber-400" />
                    <span className="text-sm font-semibold text-slate-300">Parking Lot</span>
                    <span className="text-xs text-slate-500">Someday / Maybe</span>
                    {parkedGoals.length > 0 && (
                        <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                            {parkedGoals.length}
                        </span>
                    )}
                </div>
                {isExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
            </button>

            {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                    {/* Quick-add input */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            placeholder="Quick-add a someday goal..."
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none placeholder:text-slate-600"
                            disabled={isAdding}
                        />
                        <button
                            onClick={handleAdd}
                            disabled={!newTitle.trim() || isAdding}
                            className="flex items-center gap-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-400 px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Plus size={14} />
                            Park
                        </button>
                    </div>

                    {/* Parked goals list */}
                    {parkedGoals.length === 0 ? (
                        <p className="text-xs text-slate-600 italic py-2 text-center">
                            No parked goals yet. Add ideas you want to revisit later.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {parkedGoals.map(goal => (
                                <div
                                    key={goal.id}
                                    className="flex items-center gap-3 bg-slate-800/30 border border-slate-800 rounded-lg px-3 py-2.5 group hover:border-amber-500/30 transition-colors"
                                >
                                    <ParkingSquare size={14} className="text-amber-400/50 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-300 truncate">{goal.title}</p>
                                        {goal.createdAt && (
                                            <p className="text-[10px] text-slate-600">
                                                Parked {formatRelativeDate(goal.createdAt)}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handlePromote(goal)}
                                            className="flex items-center gap-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 px-2 py-1 rounded text-[11px] font-medium border border-indigo-500/30 transition"
                                            title="Activate this goal"
                                        >
                                            <Rocket size={11} />
                                            Activate
                                        </button>
                                        <button
                                            onClick={() => handleDelete(goal.id)}
                                            className="p-1 text-slate-600 hover:text-red-400 transition"
                                            title="Remove"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GoalParkingLot;
