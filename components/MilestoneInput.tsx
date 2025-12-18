import React, { useState } from 'react';
import { ActionType, Action } from '../types';
import { Plus, X, ShieldAlert, ArrowRightCircle } from 'lucide-react';
import { createMilestone } from '../services/milestoneController';

interface Props {
    goalId: string;
    onMilestoneCreated: () => void;
}

const MilestoneInput: React.FC<Props> = ({ goalId, onMilestoneCreated }) => {
    const [title, setTitle] = useState('');
    const [goActions, setGoActions] = useState<string[]>([]);
    const [noGoActions, setNoGoActions] = useState<string[]>([]);
    const [currentGo, setCurrentGo] = useState('');
    const [currentNoGo, setCurrentNoGo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const isValid = title.trim().length > 0 && goActions.length > 0 && noGoActions.length > 0;

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
            await createMilestone(goalId, title, actions);
            onMilestoneCreated();
            // Reset form
            setTitle('');
            setGoActions([]);
            setNoGoActions([]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Add Milestone</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Milestone Title</label>
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g., Week 1 Training Log"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-indigo-500"
                    />
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
                        </ul>
                    </div>
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={!isValid || loading}
                    className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                        isValid 
                        ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                >
                    {loading ? 'Adding...' : 'Add Milestone'}
                </button>
            </form>
        </div>
    );
};

export default MilestoneInput;
