import React from 'react';
import { Goal } from '../../types';
import MilestoneInput from '../MilestoneInput';
import MilestoneItem from '../MilestoneItem';
import TagsManager from '../TagsManager';
import { CheckCircle, Edit2, Save, X, Trash2, Loader2, Sparkles, Bot, CalendarClock, Brain, Minimize2, Plus } from 'lucide-react';

interface GoalEditor {
    editingGoalId: string | null;
    editTitle: string;
    editDescription: string;
    editAIReasoning: string;
    editAISuggestion: string;
    editAlternativeActions: string[];
    editTimeframe: string;
    editTags: string[];
    isSaving: boolean;
    isPolishing: boolean;
    isEstimatingTimeframe: boolean;
    setEditAIReasoning: (v: string) => void;
    setEditAISuggestion: (v: string) => void;
    setEditAlternativeActions: (v: string[]) => void;
    setEditTimeframe: (v: string) => void;
    setEditTags: (v: string[]) => void;
    startEditing: (goal: Goal) => void;
    cancelEditing: () => void;
    handleAIPolish: () => Promise<void>;
    handleEstimateTimeframe: () => Promise<void>;
    saveEdit: (id: string) => Promise<void>;
    handleDeleteGoal: (id: string) => Promise<void>;
    updateEditTitle: (v: string) => void;
    updateEditDescription: (v: string) => void;
}

interface Props {
    goal: Goal;
    editor: GoalEditor;
    rewardMessage: string | null;
    onExit: () => void;
    onOpenAssistant: (title: string, description: string, mode: 'creation' | 'edition') => void;
    onReward: (message: string) => void;
    loadGoals: () => Promise<void>;
}

const FocusMode: React.FC<Props> = ({
    goal,
    editor,
    rewardMessage,
    onExit,
    onOpenAssistant,
    onReward,
    loadGoals,
}) => {
    const completedMilestones = goal.milestones.filter(m => m.isCompleted).length;
    const totalMilestones = goal.milestones.length;
    const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    return (
        <div className="min-h-screen bg-slate-950 p-6 md:p-12 relative overflow-x-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none fixed"></div>
            
            {rewardMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-bounce">
                    <div className={`px-8 py-5 rounded-xl text-xl font-bold shadow-2xl border ${rewardMessage.includes('JACKPOT') ? 'bg-yellow-500 text-black border-yellow-300' : 'bg-indigo-600 text-white border-indigo-400'}`}>
                        {rewardMessage}
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={onExit}
                            className="p-3 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors border border-slate-800"
                            title="Exit focus mode"
                        >
                            <Minimize2 size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Focus Mode</h1>
                            <p className="text-slate-400 text-base">Working on one goal at a time</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-800 px-4 py-2 rounded-full text-base font-mono text-indigo-400 border border-slate-700">
                            Diff: {goal.difficultyRating}/10
                        </div>
                        {goal.estimatedTimeframe && (
                            <div className="bg-emerald-900/20 px-4 py-2 rounded-full text-base font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-2">
                                <CalendarClock size={16} />
                                {goal.estimatedTimeframe}
                            </div>
                        )}
                    </div>
                </div>

                {/* Focused Goal Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 shadow-2xl">
                    {editor.editingGoalId === goal.id ? (
                        <FocusEditMode goal={goal} editor={editor} onOpenAssistant={onOpenAssistant} />
                    ) : (
                        <FocusViewMode 
                            goal={goal} 
                            editor={editor}
                            completedMilestones={completedMilestones}
                            totalMilestones={totalMilestones}
                            progress={progress}
                            onReward={onReward}
                            loadGoals={loadGoals}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

// ---- Focus Mode Sub-components ----

const FocusEditMode: React.FC<{
    goal: Goal;
    editor: GoalEditor;
    onOpenAssistant: (title: string, description: string, mode: 'creation' | 'edition') => void;
}> = ({ goal, editor, onOpenAssistant }) => (
    <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
                <span className="text-xl text-indigo-400 font-bold uppercase">Editing Protocol</span>
                <button 
                    onClick={() => onOpenAssistant(editor.editTitle, editor.editDescription, 'edition')}
                    className="text-base flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 px-3 py-2 rounded-lg border border-indigo-500/30 transition-colors"
                >
                    <Bot size={16} /> Neural Assistant
                </button>
            </div>
            
            <div className="relative group">
                <button 
                    onClick={editor.handleAIPolish}
                    disabled={editor.isPolishing}
                    className="text-base flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 border border-white/10"
                >
                    {editor.isPolishing ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Optimizing...
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} />
                            AI Polish
                        </>
                    )}
                </button>
            </div>
        </div>
        
        <div>
            <label className="text-base text-indigo-300 font-bold uppercase mb-2 block">Goal Title</label>
            <input 
                value={editor.editTitle}
                onChange={e => editor.updateEditTitle(e.target.value)}
                className="w-full bg-slate-950 border-2 border-slate-700 rounded-lg p-4 text-white font-bold text-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="Goal Title"
                autoFocus
            />
        </div>
        
        <div>
            <label className="text-base text-indigo-300 font-bold uppercase mb-2 block">Description / Why This Matters</label>
            <textarea 
                value={editor.editDescription}
                onChange={e => editor.updateEditDescription(e.target.value)}
                className="w-full bg-slate-950 border-2 border-slate-700 rounded-lg p-4 text-white text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y min-h-[150px]"
                placeholder="Explain why this goal is important to you..."
                rows={6}
            />
        </div>

        {/* Estimated Timeframe */}
        <div>
            <div className="flex items-center justify-between mb-2">
                <label className="text-base text-indigo-300 font-bold uppercase">Estimated Timeframe</label>
                <button 
                    onClick={editor.handleEstimateTimeframe}
                    disabled={editor.isEstimatingTimeframe}
                    className="text-sm flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
                >
                    {editor.isEstimatingTimeframe ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            Estimating...
                        </>
                    ) : (
                        <>
                            <CalendarClock size={14} />
                            AI Estimate
                        </>
                    )}
                </button>
            </div>
            <input 
                type="text"
                value={editor.editTimeframe}
                onChange={e => editor.setEditTimeframe(e.target.value)}
                className="w-full bg-slate-950 border-2 border-slate-700 rounded-lg p-3 text-white text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="e.g., 2-3 weeks, 6 months, 1 year..."
            />
            <p className="text-sm text-slate-500 mt-1 italic">How long do you think this goal will take?</p>
        </div>

        {/* Tags Manager */}
        <TagsManager tags={editor.editTags} onChange={editor.setEditTags} />

        {/* AI Assessment Editing in Focus Mode */}
        {goal.aiAssessment && (
            <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Brain size={18} className="text-indigo-400" />
                    <h5 className="text-base font-bold text-indigo-300 uppercase tracking-wider">Neural Analysis Log</h5>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-slate-500 uppercase font-bold block mb-2">AI Reasoning:</label>
                        <textarea
                            value={editor.editAIReasoning}
                            onChange={(e) => editor.setEditAIReasoning(e.target.value)}
                            className="w-full bg-slate-950 border-2 border-slate-700 rounded-lg p-3 text-slate-300 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y min-h-[100px]"
                            placeholder="AI's reasoning about this goal..."
                            rows={4}
                        />
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <span className="bg-slate-800 px-3 py-1.5 rounded text-slate-300">
                            Est. Difficulty: {goal.aiAssessment.estimatedRating}/10
                        </span>
                    </div>
                    <div>
                        <label className="text-sm text-slate-500 uppercase font-bold block mb-2">AI Suggestion:</label>
                        <input
                            type="text"
                            value={editor.editAISuggestion}
                            onChange={(e) => editor.setEditAISuggestion(e.target.value)}
                            className="w-full bg-slate-950 border-2 border-slate-700 rounded-lg p-3 text-indigo-300 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            placeholder="AI's suggestion..."
                        />
                    </div>
                    
                    {/* Editable Alternative Actions */}
                    <div className="pt-3 border-t border-indigo-500/20">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-indigo-400 font-bold uppercase tracking-wider">Suggested Starting Points:</span>
                            <button
                                type="button"
                                onClick={() => editor.setEditAlternativeActions([...editor.editAlternativeActions, ''])}
                                className="text-sm flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30 transition-colors"
                            >
                                <Plus size={12} />
                                Add Action
                            </button>
                        </div>
                        {editor.editAlternativeActions.length === 0 ? (
                            <p className="text-sm text-slate-600 italic">No starting points defined. Click "Add Action" to create one.</p>
                        ) : (
                            <div className="space-y-2">
                                {editor.editAlternativeActions.map((action, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <span className="text-slate-500 text-sm shrink-0">{i + 1}.</span>
                                        <input
                                            type="text"
                                            value={action}
                                            onChange={(e) => {
                                                const updated = [...editor.editAlternativeActions];
                                                updated[i] = e.target.value;
                                                editor.setEditAlternativeActions(updated);
                                            }}
                                            className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none"
                                            placeholder="Enter starting action..."
                                        />
                                        <button
                                            type="button"
                                            onClick={() => editor.setEditAlternativeActions(editor.editAlternativeActions.filter((_, idx) => idx !== i))}
                                            className="text-red-400 hover:text-red-300 p-1 transition-colors"
                                            title="Remove"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        <div className="flex gap-3 flex-wrap pt-4">
            <button onClick={() => editor.saveEdit(goal.id)} disabled={editor.isSaving} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-6 py-3 rounded-lg text-lg font-bold text-white transition-colors shadow-lg shadow-green-900/20">
                <Save size={20} /> Save Changes
            </button>
            <button onClick={editor.cancelEditing} disabled={editor.isSaving} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-6 py-3 rounded-lg text-lg font-medium text-slate-300 hover:text-white transition-colors">
                <X size={20} /> Discard
            </button>
            <div className="flex-1"></div>
            <button onClick={() => editor.handleDeleteGoal(goal.id)} disabled={editor.isSaving} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-3 rounded-lg text-base font-bold transition-colors border border-red-500/20">
                <Trash2 size={18} /> Delete
            </button>
        </div>
    </div>
);

const FocusViewMode: React.FC<{
    goal: Goal;
    editor: GoalEditor;
    completedMilestones: number;
    totalMilestones: number;
    progress: number;
    onReward: (message: string) => void;
    loadGoals: () => Promise<void>;
}> = ({ goal, editor, completedMilestones, totalMilestones, progress, onReward, loadGoals }) => (
    <>
        <div className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-5xl font-bold text-white leading-tight">{goal.title}</h2>
                    {goal.status === 'completed' && (
                        <span className="flex items-center gap-2 text-sm bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                            <CheckCircle size={16} /> COMPLETED
                        </span>
                    )}
                </div>
                <button onClick={() => editor.startEditing(goal)} className="text-slate-400 hover:text-indigo-400 transition-colors p-2 hover:bg-slate-800 rounded-lg" title="Edit Goal">
                    <Edit2 size={24} />
                </button>
            </div>
            <p className="text-slate-300 text-xl leading-relaxed whitespace-pre-wrap">{goal.description}</p>
        </div>

        {/* Progress Bar */}
        {totalMilestones > 0 && (
            <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-medium text-slate-400">Progress</span>
                    <span className="text-lg font-bold text-indigo-400">{completedMilestones}/{totalMilestones} Milestones ({progress}%)</span>
                </div>
                <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${goal.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        )}

        {/* AI Assessment */}
        {goal.aiAssessment && (
            <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-3 mb-3">
                    <Brain size={18} className="text-indigo-400" />
                    <h5 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">Neural Analysis Log</h5>
                </div>
                <p className="text-base text-slate-400 mb-4 italic leading-relaxed">"{goal.aiAssessment.reasoning}"</p>
                <div className="flex items-center gap-4 text-sm mb-4 flex-wrap">
                    <span className="bg-slate-800 px-3 py-1.5 rounded text-slate-300">
                        Est. Difficulty: {goal.aiAssessment.estimatedRating}/10
                    </span>
                    {goal.aiAssessment.estimatedTimeframe && (
                        <span className="bg-emerald-900/20 px-3 py-1.5 rounded text-emerald-400 border border-emerald-500/30 flex items-center gap-2">
                            <CalendarClock size={14} />
                            Est. Time: {goal.aiAssessment.estimatedTimeframe}
                        </span>
                    )}
                    <span className="text-indigo-400/80">
                        Suggestion: {goal.aiAssessment.suggestion}
                    </span>
                </div>
                {goal.aiAssessment.timeframeReasoning && (
                    <p className="text-sm text-slate-500 mb-4 italic leading-relaxed">⏱️ {goal.aiAssessment.timeframeReasoning}</p>
                )}
                {goal.aiAssessment.alternativeActions && goal.aiAssessment.alternativeActions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-indigo-500/20">
                        <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider block mb-2">Suggested Starting Points:</span>
                        <ul className="list-disc list-inside text-base text-slate-400 space-y-1.5">
                            {goal.aiAssessment.alternativeActions.map((action, i) => (
                                <li key={i}>{action}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        )}

        {/* Milestones */}
        <div className="space-y-5">
            <h3 className="text-2xl font-bold text-white mb-6">Milestones</h3>
            {goal.milestones.length === 0 ? (
                <p className="text-slate-500 italic text-lg">No milestones defined yet. Break this goal down.</p>
            ) : (
                <div className="space-y-4">
                    {goal.milestones.map(milestone => (
                        <MilestoneItem 
                            key={milestone.id} 
                            milestone={milestone} 
                            onUpdate={loadGoals}
                            onReward={onReward}
                        />
                    ))}
                </div>
            )}
            
            <MilestoneInput 
                goalId={goal.id} 
                goalTitle={goal.title}
                goalDescription={goal.description}
                onMilestoneCreated={loadGoals} 
            />
        </div>
    </>
);

export default FocusMode;
