import React, { useState } from 'react';
import { ImplementationIntention } from '../../types';
import { Plus, X, Zap, ArrowRight, Shield } from 'lucide-react';

interface Props {
    intentions: ImplementationIntention[];
    onChange: (intentions: ImplementationIntention[]) => void;
    readOnly?: boolean;
}

/**
 * Implementation Intentions (If-Then Plans)
 * Research: Peter Gollwitzer — nearly doubles goal follow-through rates
 * 
 * Structured fields: Trigger → Action → Fallback
 * "When [trigger], I will [action]. If [obstacle], then [fallback]."
 */
const ImplementationIntentions: React.FC<Props> = ({ intentions, onChange, readOnly = false }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [trigger, setTrigger] = useState('');
    const [action, setAction] = useState('');
    const [fallback, setFallback] = useState('');

    const handleAdd = () => {
        if (!trigger.trim() || !action.trim()) return;
        const newIntention: ImplementationIntention = {
            id: crypto.randomUUID(),
            trigger: trigger.trim(),
            action: action.trim(),
            fallback: fallback.trim(),
        };
        onChange([...intentions, newIntention]);
        setTrigger('');
        setAction('');
        setFallback('');
        setIsAdding(false);
    };

    const handleRemove = (id: string) => {
        onChange(intentions.filter(i => i.id !== id));
    };

    if (intentions.length === 0 && readOnly) return null;

    return (
        <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 mb-1">
                <Zap size={12} className="text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">If-Then Plans</span>
                <span className="text-[10px] text-slate-600">(Implementation Intentions)</span>
            </div>

            {/* Existing intentions */}
            {intentions.map(intention => (
                <div key={intention.id} className="bg-amber-900/10 border border-amber-500/20 rounded-lg p-2.5 group relative">
                    <div className="space-y-1 text-xs">
                        <div className="flex items-start gap-2">
                            <span className="text-amber-400 font-bold text-[10px] uppercase mt-0.5 shrink-0 w-12">When</span>
                            <span className="text-slate-300">{intention.trigger}</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold text-[10px] uppercase mt-0.5 shrink-0 w-12 flex items-center gap-0.5">
                                <ArrowRight size={8} />I will
                            </span>
                            <span className="text-slate-300">{intention.action}</span>
                        </div>
                        {intention.fallback && (
                            <div className="flex items-start gap-2">
                                <span className="text-sky-400 font-bold text-[10px] uppercase mt-0.5 shrink-0 w-12 flex items-center gap-0.5">
                                    <Shield size={8} />Else
                                </span>
                                <span className="text-slate-400">{intention.fallback}</span>
                            </div>
                        )}
                    </div>
                    {!readOnly && (
                        <button
                            onClick={() => handleRemove(intention.id)}
                            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-opacity p-0.5"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
            ))}

            {/* Add new intention */}
            {!readOnly && (
                isAdding ? (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 space-y-2">
                        <div>
                            <label className="text-[10px] font-bold text-amber-400 uppercase block mb-1">
                                When... (Trigger)
                            </label>
                            <input
                                value={trigger}
                                onChange={e => setTrigger(e.target.value)}
                                placeholder="e.g., When I sit at my desk after lunch"
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:ring-1 focus:ring-amber-500 outline-none"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">
                                I will... (Action)
                            </label>
                            <input
                                value={action}
                                onChange={e => setAction(e.target.value)}
                                placeholder="e.g., Practice piano for 20 minutes"
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-sky-400 uppercase block mb-1">
                                If too hard... (Fallback — optional)
                            </label>
                            <input
                                value={fallback}
                                onChange={e => setFallback(e.target.value)}
                                placeholder="e.g., Just 5 minutes of scales"
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:ring-1 focus:ring-sky-500 outline-none"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                onClick={() => { setIsAdding(false); setTrigger(''); setAction(''); setFallback(''); }}
                                className="px-2.5 py-1 text-xs text-slate-400 hover:text-white transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={!trigger.trim() || !action.trim()}
                                className="px-3 py-1 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded text-xs font-medium hover:bg-amber-600/30 transition disabled:opacity-40"
                            >
                                Add Plan
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-400 transition py-1"
                    >
                        <Plus size={12} />
                        Add If-Then Plan
                    </button>
                )
            )}
        </div>
    );
};

export default ImplementationIntentions;
