import React, { useState } from 'react';
import { Goal } from '../../types';
import { updateGoal } from '../../services/goalController';
import { UserCircle, Save, Pencil, X, Sparkles } from 'lucide-react';

interface Props {
    goal: Goal;
    onSaved: () => void;
    compact?: boolean;
}

/**
 * Identity-Based Goal Framing
 * Research: James Clear (Atomic Habits) — "I am a writer" > "I want to write"
 * 
 * "The person I'm becoming: ___"
 */
const IdentityStatement: React.FC<Props> = ({ goal, onSaved, compact = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [statement, setStatement] = useState(goal.identityStatement || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!statement.trim()) return;
        setIsSaving(true);
        try {
            await updateGoal(goal.id, { identityStatement: statement.trim() });
            onSaved();
            setIsEditing(false);
        } catch (e) {
            console.error('Failed to save identity statement', e);
        } finally {
            setIsSaving(false);
        }
    };

    // Compact: just inline text
    if (compact && goal.identityStatement && !isEditing) {
        return (
            <div className="flex items-center gap-2 group">
                <UserCircle size={12} className="text-violet-400 shrink-0" />
                <p className="text-xs text-violet-300/80 italic truncate">
                    "{goal.identityStatement}"
                </p>
                <button
                    onClick={() => setIsEditing(true)}
                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-violet-400 transition-opacity p-0.5"
                >
                    <Pencil size={10} />
                </button>
            </div>
        );
    }

    if (!isEditing && !goal.identityStatement) {
        return (
            <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-xs text-slate-500 hover:text-violet-400 transition py-1"
            >
                <UserCircle size={14} />
                <span>Set identity statement...</span>
            </button>
        );
    }

    if (isEditing) {
        return (
            <div className="bg-violet-900/10 border border-violet-500/20 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                    <UserCircle size={14} className="text-violet-400" />
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">
                        The person I'm becoming
                    </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                    Frame your goal as an identity, not a behavior. Instead of "I want to write", say "I am a writer". 
                    This shifts your self-image to support the goal.
                </p>
                <input
                    value={statement}
                    onChange={e => setStatement(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                    placeholder="e.g., I am someone who takes care of their body"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:ring-1 focus:ring-violet-500 outline-none"
                    autoFocus
                />
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <p className="text-[10px] text-slate-600 flex items-center gap-1">
                            <Sparkles size={8} />
                            Tip: Reframe "I want to [behavior]" → "I am [identity]"
                        </p>
                    </div>
                    <button
                        onClick={() => { setIsEditing(false); setStatement(goal.identityStatement || ''); }}
                        className="px-2.5 py-1 text-xs text-slate-400 hover:text-white transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!statement.trim() || isSaving}
                        className="flex items-center gap-1 px-3 py-1 bg-violet-600/20 text-violet-400 border border-violet-500/30 rounded text-xs font-medium hover:bg-violet-600/30 transition disabled:opacity-40"
                    >
                        <Save size={12} />
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        );
    }

    // Display mode (not compact, has statement)
    return (
        <div className="bg-violet-900/10 border border-violet-500/20 rounded-lg p-3 group">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <UserCircle size={14} className="text-violet-400" />
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">
                        Identity
                    </span>
                </div>
                <button
                    onClick={() => setIsEditing(true)}
                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-violet-400 transition-opacity p-0.5"
                >
                    <Pencil size={12} />
                </button>
            </div>
            <p className="text-sm text-violet-200/90 mt-1.5 italic">
                "{goal.identityStatement}"
            </p>
        </div>
    );
};

export default IdentityStatement;
