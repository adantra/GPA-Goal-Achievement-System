import React, { useState, useEffect } from 'react';
import { Goal, PreMortemData, PreMortemItem } from '../../types';
import { updateGoal } from '../../services/goalController';
import { X, Save, Plus, Skull, ShieldCheck, AlertTriangle, Trash2, RotateCcw } from 'lucide-react';

interface Props {
    goal: Goal;
    onClose: () => void;
    onSaved: () => void;
}

/**
 * Obstacle Pre-Mortem Modal
 * Research: Gary Klein — prospective hindsight increases failure identification by 30%
 * 
 * Prompt: "Imagine you've failed at this goal in 3 months. What went wrong?"
 * Then flip each failure into a preventive action.
 */
const PreMortemModal: React.FC<Props> = ({ goal, onClose, onSaved }) => {
    const [items, setItems] = useState<PreMortemItem[]>(goal.preMortem?.items || []);
    const [newFailure, setNewFailure] = useState('');
    const [newPrevention, setNewPrevention] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const isExisting = !!goal.preMortem?.completedAt;

    const handleAddItem = () => {
        if (!newFailure.trim() || !newPrevention.trim()) return;
        const item: PreMortemItem = {
            id: crypto.randomUUID(),
            failure: newFailure.trim(),
            preventiveAction: newPrevention.trim(),
            isHappening: false,
        };
        setItems(prev => [...prev, item]);
        setNewFailure('');
        setNewPrevention('');
    };

    const handleRemoveItem = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const toggleHappening = (id: string) => {
        setItems(prev => prev.map(i =>
            i.id === id ? { ...i, isHappening: !i.isHappening } : i
        ));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const preMortemData: PreMortemData = {
                items,
                completedAt: new Date().toISOString(),
            };
            await updateGoal(goal.id, { preMortem: preMortemData });
            onSaved();
            onClose();
        } catch (e) {
            console.error('Failed to save Pre-Mortem', e);
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Skull size={20} className="text-red-400" />
                            Obstacle Pre-Mortem
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            For: <span className="text-slate-400">{goal.title}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition p-1">
                        <X size={20} />
                    </button>
                </div>

                {/* Prompt */}
                <div className="px-5 pt-4 shrink-0">
                    <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-4">
                        <p className="text-sm text-red-300 font-medium leading-relaxed">
                            <span className="text-red-400 font-bold">Imagine it's 3 months from now</span> and you've completely failed at "<span className="text-white">{goal.title}</span>". 
                            What went wrong? List every possible failure scenario, then flip each into a preventive action.
                        </p>
                    </div>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 custom-scrollbar">
                    {/* Existing items */}
                    {items.map(item => (
                        <div
                            key={item.id}
                            className={`rounded-xl border p-4 group transition-all ${
                                item.isHappening
                                    ? 'bg-red-900/20 border-red-500/30'
                                    : 'bg-slate-800/30 border-slate-700/50'
                            }`}
                        >
                            <div className="flex gap-3">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
                                        <div>
                                            <span className="text-[10px] font-bold text-red-400 uppercase">What went wrong</span>
                                            <p className="text-sm text-slate-300">{item.failure}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <ShieldCheck size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                                        <div>
                                            <span className="text-[10px] font-bold text-emerald-400 uppercase">Preventive action</span>
                                            <p className="text-sm text-slate-300">{item.preventiveAction}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 items-center shrink-0">
                                    <button
                                        onClick={() => toggleHappening(item.id)}
                                        className={`p-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                                            item.isHappening
                                                ? 'bg-red-600/20 border-red-500/40 text-red-400'
                                                : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-red-500/30 hover:text-red-400'
                                        }`}
                                        title={item.isHappening ? 'Mark as not happening' : 'Flag: this is starting to happen'}
                                    >
                                        <AlertTriangle size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="p-1.5 text-slate-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                                        title="Remove"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                            {item.isHappening && (
                                <div className="mt-2 pt-2 border-t border-red-500/20 flex items-center gap-2">
                                    <AlertTriangle size={12} className="text-red-400" />
                                    <span className="text-[10px] text-red-400 font-bold uppercase">This failure is starting to happen — activate your preventive action!</span>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Add new failure/prevention pair */}
                    <div className="bg-slate-800/30 border border-dashed border-slate-700 rounded-xl p-4 space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                            <Plus size={12} />
                            Add Failure Scenario
                        </h4>
                        <div>
                            <label className="text-[10px] font-bold text-red-400 uppercase block mb-1">What went wrong?</label>
                            <input
                                value={newFailure}
                                onChange={e => setNewFailure(e.target.value)}
                                placeholder="e.g., I stopped showing up to practice sessions after week 3"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:ring-1 focus:ring-red-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">How to prevent it?</label>
                            <input
                                value={newPrevention}
                                onChange={e => setNewPrevention(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                                placeholder="e.g., Schedule practice as a non-negotiable calendar event every Tuesday and Thursday"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        <button
                            onClick={handleAddItem}
                            disabled={!newFailure.trim() || !newPrevention.trim()}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Plus size={12} />
                            Add to Pre-Mortem
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-5 border-t border-slate-800 shrink-0">
                    <span className="text-xs text-slate-600">
                        {items.length} {items.length === 1 ? 'scenario' : 'scenarios'} identified
                        {items.some(i => i.isHappening) && (
                            <span className="text-red-400 ml-2 font-bold">
                                ({items.filter(i => i.isHappening).length} flagged!)
                            </span>
                        )}
                    </span>
                    <button
                        onClick={handleSave}
                        disabled={items.length === 0 || isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/30"
                    >
                        <Save size={14} />
                        {isSaving ? 'Saving...' : isExisting ? 'Update Pre-Mortem' : 'Save Pre-Mortem'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PreMortemModal;
