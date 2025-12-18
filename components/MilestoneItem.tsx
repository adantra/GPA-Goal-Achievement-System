import React, { useState } from 'react';
import { Milestone, ActionType, Action, RewardType } from '../types';
import { updateMilestone, deleteMilestone, completeMilestone } from '../services/milestoneController';
import { Trophy, Check, Edit2, Trash2, X, Plus, Save, ArrowRightCircle, ShieldAlert } from 'lucide-react';

interface Props {
    milestone: Milestone;
    onUpdate: () => void;
    onReward: (message: string) => void;
}

const MilestoneItem: React.FC<Props> = ({ milestone, onUpdate, onReward }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Edit State
    const [editTitle, setEditTitle] = useState(milestone.title);
    const [editActions, setEditActions] = useState<Action[]>(milestone.actions);
    
    // Inputs for adding new actions during edit
    const [newGoAction, setNewGoAction] = useState('');
    const [newNoGoAction, setNewNoGoAction] = useState('');

    const handleComplete = async () => {
        try {
            const { message } = await completeMilestone(milestone.id);
            onReward(message);
            onUpdate();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this milestone?")) {
            setIsSaving(true);
            try {
                await deleteMilestone(milestone.id);
                onUpdate();
            } catch (error) {
                console.error(error);
                setIsSaving(false);
            }
        }
    };

    const handleSave = async () => {
        // Validation handled by backend, but we can do basic check here
        const hasGo = editActions.some(a => a.type === ActionType.GO);
        const hasNoGo = editActions.some(a => a.type === ActionType.NO_GO);
        if (!hasGo || !hasNoGo) {
            alert("Protocol Violation: Must have at least one GO and one NO-GO action.");
            return;
        }

        setIsSaving(true);
        try {
            await updateMilestone(milestone.id, {
                title: editTitle,
                actions: editActions
            });
            setIsEditing(false);
            onUpdate();
        } catch (error) {
            console.error(error);
            alert("Failed to update milestone.");
        } finally {
            setIsSaving(false);
        }
    };

    const addAction = (type: ActionType) => {
        const text = type === ActionType.GO ? newGoAction : newNoGoAction;
        if (!text.trim()) return;

        const newAction: Action = {
            id: crypto.randomUUID(),
            description: text,
            type: type
        };

        setEditActions([...editActions, newAction]);
        
        if (type === ActionType.GO) setNewGoAction('');
        else setNewNoGoAction('');
    };

    const removeAction = (actionId: string) => {
        setEditActions(editActions.filter(a => a.id !== actionId));
    };

    if (isEditing) {
        return (
            <div className="p-4 bg-slate-800 border border-indigo-500/50 rounded-xl space-y-4 shadow-xl">
                <div>
                    <label className="text-xs text-indigo-300 font-bold uppercase mb-1 block">Edit Milestone Title</label>
                    <input 
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                        placeholder="Milestone Title"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Edit GO Actions */}
                    <div className="bg-emerald-900/20 p-3 rounded border border-emerald-900/30">
                        <h5 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1">
                            <ArrowRightCircle size={12} /> ACTIONS TO TAKE
                        </h5>
                        <ul className="space-y-2 mb-2">
                            {editActions.filter(a => a.type === ActionType.GO).map(a => (
                                <li key={a.id} className="flex justify-between items-center text-sm bg-black/20 p-1.5 rounded text-slate-300">
                                    <span>{a.description}</span>
                                    <button onClick={() => removeAction(a.id)} className="text-red-400 hover:text-red-300"><X size={14} /></button>
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-2">
                            <input 
                                value={newGoAction}
                                onChange={e => setNewGoAction(e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                placeholder="Add GO action..."
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAction(ActionType.GO))}
                            />
                            <button onClick={() => addAction(ActionType.GO)} className="bg-emerald-600 hover:bg-emerald-500 text-white p-1 rounded"><Plus size={14} /></button>
                        </div>
                    </div>

                    {/* Edit NO-GO Actions */}
                    <div className="bg-red-900/20 p-3 rounded border border-red-900/30">
                        <h5 className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1">
                            <ShieldAlert size={12} /> ACTIONS TO AVOID
                        </h5>
                        <ul className="space-y-2 mb-2">
                            {editActions.filter(a => a.type === ActionType.NO_GO).map(a => (
                                <li key={a.id} className="flex justify-between items-center text-sm bg-black/20 p-1.5 rounded text-slate-300">
                                    <span>{a.description}</span>
                                    <button onClick={() => removeAction(a.id)} className="text-red-400 hover:text-red-300"><X size={14} /></button>
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-2">
                            <input 
                                value={newNoGoAction}
                                onChange={e => setNewNoGoAction(e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                placeholder="Add NO-GO action..."
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAction(ActionType.NO_GO))}
                            />
                            <button onClick={() => addAction(ActionType.NO_GO)} className="bg-red-600 hover:bg-red-500 text-white p-1 rounded"><Plus size={14} /></button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                     <button 
                        onClick={() => handleDelete()}
                        disabled={isSaving}
                        className="px-3 py-1.5 rounded bg-red-900/20 text-red-400 hover:bg-red-900/40 text-xs font-bold flex items-center gap-1 mr-auto"
                    >
                        <Trash2 size={14} /> DELETE MILESTONE
                    </button>
                    <button 
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving}
                        className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold"
                    >
                        CANCEL
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-3 py-1.5 rounded bg-green-600 hover:bg-green-500 text-white text-xs font-bold flex items-center gap-1"
                    >
                        <Save size={14} /> SAVE CHANGES
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-4 justify-between items-start ${milestone.isCompleted ? 'bg-slate-900/50 border-slate-800 opacity-60' : 'bg-slate-800 border-slate-700'}`}>
            <div className="flex-1 w-full">
                <div className="flex items-center gap-2 mb-2">
                    <h4 className={`font-semibold text-lg ${milestone.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {milestone.title}
                    </h4>
                    {!milestone.isCompleted && (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="text-slate-500 hover:text-indigo-400 p-1 transition-colors"
                            title="Edit Milestone"
                        >
                            <Edit2 size={14} />
                        </button>
                    )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div>
                        <span className="text-emerald-500 font-bold text-xs uppercase mb-1 block">Actions to Take</span>
                        <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                            {milestone.actions.filter(a => a.type === ActionType.GO).map(a => (
                                <li key={a.id}>{a.description}</li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <span className="text-red-500 font-bold text-xs uppercase mb-1 block">Actions to Avoid</span>
                        <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                            {milestone.actions.filter(a => a.type === ActionType.NO_GO).map(a => (
                                <li key={a.id}>{a.description}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="mt-2 sm:mt-0 flex-shrink-0 self-start sm:self-center">
                {milestone.isCompleted ? (
                    <div className="flex items-center gap-2 text-yellow-500 text-sm font-bold bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20">
                        <Trophy size={16} />
                        {milestone.rewardReceived === RewardType.JACKPOT ? 'JACKPOT' : 'Complete'}
                    </div>
                ) : (
                    <button
                        onClick={handleComplete}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition shadow-lg shadow-indigo-900/20"
                    >
                        <Check size={16} />
                        Complete
                    </button>
                )}
            </div>
        </div>
    );
};

export default MilestoneItem;