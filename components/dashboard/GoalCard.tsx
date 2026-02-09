import React, { useState } from 'react';
import { Goal } from '../../types';
import MilestoneInput from '../MilestoneInput';
import MilestoneItem from '../MilestoneItem';
import TagsManager from '../TagsManager';
import { CheckCircle, Edit2, Save, X, Trash2, ChevronDown, ChevronUp, Loader2, Sparkles, Bot, CalendarClock, Brain, Maximize2, Plus, Tag, Archive, Star, Skull, UserCircle } from 'lucide-react';
import { formatRelativeDate, formatDateWithIcon, getAgingColor, isDateStale } from '../../utils/dateFormatting';
import { getTagColor } from '../../utils/tagColors';
import IdentityStatement from '../neuro/IdentityStatement';

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
    isCollapsed: boolean;
    editor: GoalEditor;
    onToggleCollapse: (id: string) => void;
    onFocus: (id: string) => void;
    onOpenAssistant: (title: string, description: string, mode: 'creation' | 'edition') => void;
    onReward: (message: string) => void;
    onTagClick: (tag: string) => void;
    loadGoals: () => Promise<void>;
    onOpenWOOP?: (goal: Goal) => void;
    onOpenPreMortem?: (goal: Goal) => void;
}

const GoalCard: React.FC<Props> = ({
    goal,
    isCollapsed,
    editor,
    onToggleCollapse,
    onFocus,
    onOpenAssistant,
    onReward,
    onTagClick,
    loadGoals,
    onOpenWOOP,
    onOpenPreMortem,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const completedMilestones = goal.milestones.filter(m => m.isCompleted).length;
    const totalMilestones = goal.milestones.length;
    const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
    const isEditing = editor.editingGoalId === goal.id;

    return (
        <div
            className={`bg-slate-900 border rounded-2xl p-6 transition-all duration-200 group/card
                ${goal.status === 'completed' ? 'border-emerald-500/50 shadow-emerald-900/20 shadow-lg' : 'border-slate-800'}
                ${isEditing ? '2xl:col-span-2 shadow-2xl shadow-black ring-1 ring-indigo-500/30 z-20 relative' : ''}
                ${!isEditing ? 'hover:border-indigo-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-950/30' : ''}
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex justify-between items-start mb-4">
                {isEditing ? (
                    <EditMode goal={goal} editor={editor} onOpenAssistant={onOpenAssistant} />
                ) : (
                    <ViewModeHeader goal={goal} isCollapsed={isCollapsed} editor={editor} onTagClick={onTagClick} isHovered={isHovered} />
                )}

                <div className="flex flex-col items-end gap-3 ml-4">
                    <div className="flex flex-col gap-2">
                        <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-mono text-indigo-400 whitespace-nowrap border border-slate-700">
                            Diff: {goal.difficultyRating}/10
                        </div>
                        {goal.estimatedTimeframe && (
                            <div className="bg-emerald-900/20 px-3 py-1 rounded-full text-xs font-mono text-emerald-400 whitespace-nowrap border border-emerald-500/30 flex items-center gap-1">
                                <CalendarClock size={12} />
                                {goal.estimatedTimeframe}
                            </div>
                        )}
                    </div>
                    {/* Quick actions — visible on hover */}
                    <div className={`flex flex-col gap-1.5 transition-opacity duration-200 ${isHovered || isEditing ? 'opacity-100' : 'opacity-0'}`}>
                        <button 
                            onClick={() => editor.startEditing(goal)} 
                            className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors border border-transparent hover:border-indigo-500/30"
                            title="Edit goal"
                        >
                            <Edit2 size={15} />
                        </button>
                        <button 
                            onClick={() => onFocus(goal.id)} 
                            className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors border border-transparent hover:border-indigo-500/30"
                            title="Focus on this goal"
                        >
                            <Maximize2 size={15} />
                        </button>
                        <button onClick={() => onToggleCollapse(goal.id)} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title={isCollapsed ? 'Expand' : 'Collapse'}>
                            {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Collapsed Summary */}
            {isCollapsed && (
                <div onClick={() => onToggleCollapse(goal.id)} className="mt-2 flex items-center justify-between text-xs text-slate-500 bg-slate-950/30 p-2 rounded-lg border border-slate-800/50 cursor-pointer hover:bg-slate-950/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-indigo-300/70">{completedMilestones}/{totalMilestones} Milestones</span>
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${goal.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                    <span>Expand details</span>
                </div>
            )}

            {/* Expanded Details */}
            {!isCollapsed && !isEditing && (
                <div className="mt-6 space-y-4 animate-in fade-in duration-300">
                    {/* AI Assessment */}
                    {goal.aiAssessment && (
                        <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-xl p-4 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Brain size={14} className="text-indigo-400" />
                                <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Neural Analysis Log</h5>
                                <span className={`text-[10px] ml-auto flex items-center gap-1 ${getAgingColor(goal.aiAssessment.timestamp)}`}>
                                    {formatDateWithIcon(goal.aiAssessment.timestamp).icon}
                                    {formatRelativeDate(goal.aiAssessment.timestamp)}
                                </span>
                            </div>
                            <p className="text-sm text-slate-400 mb-2 italic">"{goal.aiAssessment.reasoning}"</p>
                            <div className="flex items-center gap-3 text-xs mb-3 flex-wrap">
                                <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                                    Est. Difficulty: {goal.aiAssessment.estimatedRating}/10
                                </span>
                                {goal.aiAssessment.estimatedTimeframe && (
                                    <span className="bg-emerald-900/20 px-2 py-0.5 rounded text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                        <CalendarClock size={12} />
                                        Est. Time: {goal.aiAssessment.estimatedTimeframe}
                                    </span>
                                )}
                                <span className="text-indigo-400/80">
                                    Suggestion: {goal.aiAssessment.suggestion}
                                </span>
                            </div>
                            
                            {goal.aiAssessment.timeframeReasoning && (
                                <p className="text-xs text-slate-500 mb-3 italic">⏱️ {goal.aiAssessment.timeframeReasoning}</p>
                            )}
                            {goal.aiAssessment.alternativeActions && goal.aiAssessment.alternativeActions.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-indigo-500/20">
                                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-1">Suggested Starting Points:</span>
                                    <ul className="list-disc list-inside text-xs text-slate-400 space-y-0.5">
                                        {goal.aiAssessment.alternativeActions.map((action, i) => (
                                            <li key={i}>{action}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Neuroscience Protocols Section */}
                    <NeuroscienceProtocols
                        goal={goal}
                        onOpenWOOP={onOpenWOOP}
                        onOpenPreMortem={onOpenPreMortem}
                        loadGoals={loadGoals}
                    />

                    {/* Milestones */}
                    {goal.milestones.length === 0 ? (
                        <p className="text-slate-600 italic text-sm">No milestones defined yet. Break this goal down.</p>
                    ) : (
                        <div className="space-y-3">
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
            )}
        </div>
    );
};

// ---- Sub-components for GoalCard ----

const ViewModeHeader: React.FC<{
    goal: Goal;
    isCollapsed: boolean;
    editor: GoalEditor;
    onTagClick: (tag: string) => void;
    isHovered: boolean;
}> = ({ goal, isCollapsed, editor, onTagClick, isHovered }) => {
    const tags = goal.tags || [];
    const visibleTags = tags.slice(0, 3);
    const hiddenCount = tags.length - visibleTags.length;
    const isStale = isDateStale(goal.lastWorkedOn);

    return (
        <div className="flex-1 mr-4 relative">
            <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {goal.title}
                    {goal.status === 'completed' && (
                        <span className="flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle size={12} /> COMPLETED
                        </span>
                    )}
                </h3>
            </div>
            <p className={`text-slate-400 text-sm mt-1 whitespace-pre-wrap ${isCollapsed ? 'line-clamp-2' : ''}`}>{goal.description}</p>
            
            {/* Tag Pills */}
            {tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {visibleTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => onTagClick(tag)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border cursor-pointer transition-all ${getTagColor(tag)}`}
                            title={`Filter by #${tag}`}
                        >
                            <Tag size={9} />
                            #{tag}
                        </button>
                    ))}
                    {hiddenCount > 0 && (
                        <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800/60 text-slate-400 border border-slate-700/50 cursor-default"
                            title={tags.slice(3).map(t => `#${t}`).join(', ')}
                        >
                            +{hiddenCount} more
                        </span>
                    )}
                </div>
            )}

            {/* Last worked on — always visible if stale, otherwise only on hover */}
            {goal.lastWorkedOn && (
                <div className={`flex items-center gap-1.5 mt-2 text-xs transition-opacity duration-200 ${getAgingColor(goal.lastWorkedOn)} ${isStale ? 'font-semibold opacity-100' : isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    {formatDateWithIcon(goal.lastWorkedOn).icon}
                    <span>Last worked on {formatRelativeDate(goal.lastWorkedOn)}</span>
                    {isStale && (
                        <span className="ml-1 px-1.5 py-0.5 bg-orange-500/10 border border-orange-500/30 rounded text-orange-400 animate-pulse">
                            Stale
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

const EditMode: React.FC<{
    goal: Goal;
    editor: GoalEditor;
    onOpenAssistant: (title: string, description: string, mode: 'creation' | 'edition') => void;
}> = ({ goal, editor, onOpenAssistant }) => (
    <div className="flex-1 mr-4 space-y-3">
        <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
                <span className="text-xs text-indigo-400 font-bold uppercase">Editing Protocol</span>
                <button 
                    onClick={() => onOpenAssistant(editor.editTitle, editor.editDescription, 'edition')}
                    className="text-xs flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-md border border-indigo-500/30 transition-colors"
                >
                    <Bot size={12} /> Assist
                </button>
            </div>
            
            <div className="relative group">
                <button 
                    onClick={editor.handleAIPolish}
                    disabled={editor.isPolishing}
                    className="text-xs flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-3 py-1.5 rounded-md shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 border border-white/10"
                >
                    {editor.isPolishing ? (
                        <>
                            <Loader2 size={12} className="animate-spin" />
                            Optimizing...
                        </>
                    ) : (
                        <>
                            <Sparkles size={12} />
                            AI Polish
                        </>
                    )}
                </button>
                <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black/90 text-xs text-slate-300 rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 text-center shadow-xl">
                    Optimizes title & description for maximum neuro-motivation using Gemini.
                    <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-black/90"></div>
                </div>
            </div>
        </div>
        <div>
            <label className="text-xs text-indigo-300 font-bold uppercase mb-2 block">Goal Title</label>
            <input 
                value={editor.editTitle}
                onChange={e => editor.updateEditTitle(e.target.value)}
                className="w-full bg-slate-950 border-2 border-slate-700 rounded-lg p-3 text-white font-bold text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="Goal Title"
                autoFocus
            />
        </div>
        <div>
            <label className="text-xs text-indigo-300 font-bold uppercase mb-2 block">Description / Why This Matters</label>
            <textarea 
                value={editor.editDescription}
                onChange={e => editor.updateEditDescription(e.target.value)}
                className="w-full bg-slate-950 border-2 border-slate-700 rounded-lg p-4 text-white text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y min-h-[120px]"
                placeholder="Explain why this goal is important to you..."
                rows={5}
            />
        </div>

        {/* Estimated Timeframe */}
        <div>
            <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-indigo-300 font-bold uppercase">Estimated Timeframe</label>
                <button 
                    onClick={editor.handleEstimateTimeframe}
                    disabled={editor.isEstimatingTimeframe}
                    className="text-xs flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded transition-colors disabled:opacity-50"
                >
                    {editor.isEstimatingTimeframe ? (
                        <>
                            <Loader2 size={12} className="animate-spin" />
                            Estimating...
                        </>
                    ) : (
                        <>
                            <CalendarClock size={12} />
                            AI Estimate
                        </>
                    )}
                </button>
            </div>
            <input 
                type="text"
                value={editor.editTimeframe}
                onChange={e => editor.setEditTimeframe(e.target.value)}
                className="w-full bg-slate-950 border-2 border-slate-700 rounded-lg p-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="e.g., 2-3 weeks, 6 months, 1 year..."
            />
            <p className="text-xs text-slate-500 mt-1 italic">How long will this goal take?</p>
        </div>
        
        {/* AI Assessment in Edit Mode */}
        {goal.aiAssessment && (
            <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Brain size={14} className="text-indigo-400" />
                    <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Neural Analysis Log</h5>
                    <span className={`text-[10px] ml-auto flex items-center gap-1 ${getAgingColor(goal.aiAssessment.timestamp)}`}>
                        {formatDateWithIcon(goal.aiAssessment.timestamp).icon}
                        {formatRelativeDate(goal.aiAssessment.timestamp)}
                    </span>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold block mb-1">AI Reasoning:</label>
                        <textarea
                            value={editor.editAIReasoning}
                            onChange={(e) => editor.setEditAIReasoning(e.target.value)}
                            className="w-full bg-slate-950 border-2 border-slate-700 rounded-lg p-3 text-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y min-h-[80px]"
                            placeholder="AI's reasoning about this goal..."
                            rows={3}
                        />
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <span className="bg-slate-800 px-2 py-1 rounded text-slate-300">
                            Est. Difficulty: {goal.aiAssessment.estimatedRating}/10
                        </span>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold block mb-1">AI Suggestion:</label>
                        <input
                            type="text"
                            value={editor.editAISuggestion}
                            onChange={(e) => editor.setEditAISuggestion(e.target.value)}
                            className="w-full bg-slate-950 border-2 border-slate-700 rounded-lg p-3 text-indigo-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            placeholder="AI's suggestion..."
                        />
                    </div>
                    {/* Editable Alternative Actions */}
                    <div className="pt-2 border-t border-indigo-500/20">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Suggested Starting Points:</span>
                            <button
                                type="button"
                                onClick={() => editor.setEditAlternativeActions([...editor.editAlternativeActions, ''])}
                                className="text-[10px] flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30 transition-colors"
                            >
                                <Plus size={10} />
                                Add Action
                            </button>
                        </div>
                        {editor.editAlternativeActions.length === 0 ? (
                            <p className="text-xs text-slate-600 italic">No starting points defined. Click "Add Action" to create one.</p>
                        ) : (
                            <div className="space-y-2">
                                {editor.editAlternativeActions.map((action, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <span className="text-slate-500 text-xs shrink-0">{i + 1}.</span>
                                        <input
                                            type="text"
                                            value={action}
                                            onChange={(e) => {
                                                const updated = [...editor.editAlternativeActions];
                                                updated[i] = e.target.value;
                                                editor.setEditAlternativeActions(updated);
                                            }}
                                            className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none"
                                            placeholder="Enter starting action..."
                                        />
                                        <button
                                            type="button"
                                            onClick={() => editor.setEditAlternativeActions(editor.editAlternativeActions.filter((_, idx) => idx !== i))}
                                            className="text-red-400 hover:text-red-300 p-1 transition-colors"
                                            title="Remove"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
        
        <div className="flex gap-2 flex-wrap pt-2">
            <button onClick={() => editor.saveEdit(goal.id)} disabled={editor.isSaving} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors shadow-lg shadow-green-900/20">
                <Save size={16} /> Save Changes
            </button>
            <button onClick={editor.cancelEditing} disabled={editor.isSaving} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white transition-colors">
                <X size={16} /> Discard
            </button>
            <div className="flex-1"></div>
            <button onClick={() => editor.handleDeleteGoal(goal.id)} disabled={editor.isSaving} className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-lg text-xs font-bold transition-colors border border-red-500/20">
                <Trash2 size={14} /> Delete
            </button>
        </div>
    </div>
);

// ---- Neuroscience Protocols Section ----

const NeuroscienceProtocols: React.FC<{
    goal: Goal;
    onOpenWOOP?: (goal: Goal) => void;
    onOpenPreMortem?: (goal: Goal) => void;
    loadGoals: () => Promise<void>;
}> = ({ goal, onOpenWOOP, onOpenPreMortem, loadGoals }) => {
    const hasWOOP = !!goal.woop?.completedAt;
    const hasPreMortem = (goal.preMortem?.items?.length || 0) > 0;
    const hasIdentity = !!goal.identityStatement;
    const hasAnyProtocol = hasWOOP || hasPreMortem || hasIdentity;
    const flaggedCount = goal.preMortem?.items?.filter(i => i.isHappening)?.length || 0;

    return (
        <div className="space-y-3">
            {/* Identity Statement — always show if set */}
            <IdentityStatement goal={goal} onSaved={loadGoals} compact />

            {/* Protocol buttons / badges */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Protocols:</span>

                {/* WOOP Button */}
                <button
                    onClick={() => onOpenWOOP?.(goal)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        hasWOOP
                            ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'
                            : 'bg-slate-800/50 border-slate-700/50 text-slate-500 hover:text-yellow-400 hover:border-yellow-500/30'
                    }`}
                    title="Mental Contrasting (WOOP Framework)"
                >
                    <Star size={12} />
                    WOOP
                    {hasWOOP && <span className="text-[9px] text-yellow-500/60">✓</span>}
                </button>

                {/* Pre-Mortem Button */}
                <button
                    onClick={() => onOpenPreMortem?.(goal)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        hasPreMortem
                            ? flaggedCount > 0
                                ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-slate-800/50 border-slate-700/50 text-slate-500 hover:text-red-400 hover:border-red-500/30'
                    }`}
                    title="Obstacle Pre-Mortem"
                >
                    <Skull size={12} />
                    Pre-Mortem
                    {hasPreMortem && (
                        <span className="text-[9px]">
                            {flaggedCount > 0 ? `⚠️ ${flaggedCount}` : `✓ ${goal.preMortem!.items.length}`}
                        </span>
                    )}
                </button>

                {/* Identity Statement Button (if not yet set) */}
                {!hasIdentity && (
                    <IdentityStatement goal={goal} onSaved={loadGoals} />
                )}
            </div>

            {/* WOOP Summary (if completed) */}
            {hasWOOP && goal.woop && (
                <div className="bg-yellow-900/5 border border-yellow-500/10 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">WOOP Summary</span>
                        <button
                            onClick={() => onOpenWOOP?.(goal)}
                            className="text-[10px] text-slate-600 hover:text-yellow-400 transition"
                        >
                            Edit
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <span className="text-yellow-500/60 text-[10px] uppercase font-bold">Wish</span>
                            <p className="text-slate-400 line-clamp-2">{goal.woop.wish}</p>
                        </div>
                        <div>
                            <span className="text-emerald-500/60 text-[10px] uppercase font-bold">Outcome</span>
                            <p className="text-slate-400 line-clamp-2">{goal.woop.outcome}</p>
                        </div>
                        <div>
                            <span className="text-red-500/60 text-[10px] uppercase font-bold">Obstacle</span>
                            <p className="text-slate-400 line-clamp-2">{goal.woop.obstacle}</p>
                        </div>
                        <div>
                            <span className="text-indigo-500/60 text-[10px] uppercase font-bold">Plan</span>
                            <p className="text-slate-400 line-clamp-2">{goal.woop.plan}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Pre-Mortem Flagged Items Warning */}
            {flaggedCount > 0 && (
                <div className="bg-red-900/10 border border-red-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-xs text-red-400 font-bold">
                        <Skull size={14} />
                        <span>{flaggedCount} predicted failure{flaggedCount !== 1 ? 's' : ''} flagged as happening!</span>
                        <button
                            onClick={() => onOpenPreMortem?.(goal)}
                            className="ml-auto text-[10px] bg-red-500/20 border border-red-500/30 px-2 py-0.5 rounded hover:bg-red-500/30 transition"
                        >
                            Review
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoalCard;
