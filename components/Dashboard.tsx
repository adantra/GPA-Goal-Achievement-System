import React, { useState, useEffect, useRef } from 'react';
import { Goal, Milestone, RewardType } from '../types';
import { getGoals, updateGoal, deleteGoal } from '../services/goalController';
import { getCurrentUser, logout } from '../services/auth';
import { exportUserData, importUserData } from '../services/dataManagement';
import CreateGoalForm from './CreateGoalForm';
import MilestoneInput from './MilestoneInput';
import MilestoneItem from './MilestoneItem';
import { Trophy, Activity, BrainCircuit, LogOut, User as UserIcon, DownloadCloud, CheckCircle, Edit2, Save, X, Trash2, ChevronDown, ChevronUp, UploadCloud, Loader2, Sparkles, Flame, Bot, CalendarClock, Info, PieChart, LayoutGrid, List, Maximize2, Minimize2, Brain, ZoomIn, ZoomOut, RotateCcw, Plus } from 'lucide-react';
import SpaceTimePlayer from './SpaceTimePlayer';
import ForeshadowingFailureModal from './ForeshadowingFailureModal';
import NeuralAssistant from './NeuralAssistant';
import ScheduleGenerator from './ScheduleGenerator';
import GoalAuditModal from './GoalAuditModal';
import UserProfileModal from './UserProfileModal';
import { GoogleGenAI, Type } from "@google/genai";

interface Props {
    onLogout: () => void;
}

const Dashboard: React.FC<Props> = ({ onLogout }) => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSpaceTime, setShowSpaceTime] = useState(false);
    const [showAmygdala, setShowAmygdala] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);
    const [showAudit, setShowAudit] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [focusedGoalId, setFocusedGoalId] = useState<string | null>(null);
    const [rewardMessage, setRewardMessage] = useState<string | null>(null);
    const currentUser = getCurrentUser();

    // File Import Ref
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    // Editing State
    const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editAIReasoning, setEditAIReasoning] = useState('');
    const [editAISuggestion, setEditAISuggestion] = useState('');
    const [editAlternativeActions, setEditAlternativeActions] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isPolishing, setIsPolishing] = useState(false);
    
    // View State
    const [isGridView, setIsGridView] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);

    // Persistent Assistant State
    const [showAssistant, setShowAssistant] = useState(false);
    const [assistantContext, setAssistantContext] = useState<{
        title: string;
        description: string;
        mode: 'creation' | 'edition' | 'idle';
    }>({ title: '', description: '', mode: 'idle' });

    const loadGoals = async () => {
        setLoading(true);
        try {
            const data = await getGoals();
            setGoals(data);
        } catch (e) {
            console.error("Failed to load goals", e);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadGoals();
    }, []);

    // Apply Zoom Level to Root
    useEffect(() => {
        // Tailwind uses rems. Changing root font-size scales the whole UI.
        // Default browser font-size is 16px (100%).
        document.documentElement.style.fontSize = `${zoomLevel}%`;
    }, [zoomLevel]);

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 150));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 80));
    const handleZoomReset = () => setZoomLevel(100);

    // Collapsed State
    const [collapsedGoals, setCollapsedGoals] = useState<Set<string>>(new Set());

    const toggleGoal = (id: string) => {
        const newCollapsed = new Set(collapsedGoals);
        if (newCollapsed.has(id)) {
            newCollapsed.delete(id);
        } else {
            newCollapsed.add(id);
        }
        setCollapsedGoals(newCollapsed);
    };

    const toggleGridView = () => {
        const nextState = !isGridView;
        setIsGridView(nextState);
        
        if (nextState) {
            // Switching TO Grid View: Collapse All
            setCollapsedGoals(new Set(goals.map(g => g.id)));
        } else {
            // Switching TO List View: Expand All for contrast
            setCollapsedGoals(new Set());
        }
    };
    
    const collapseAll = () => {
        setCollapsedGoals(new Set(goals.map(g => g.id)));
    };

    const expandAll = () => {
        setCollapsedGoals(new Set());
    };

    const handleReward = (message: string) => {
        setRewardMessage(message);
        setTimeout(() => setRewardMessage(null), 4000);
    };

    const handleLogout = () => {
        logout();
        onLogout();
    };

    const handleExport = () => {
        if (currentUser) {
            exportUserData(currentUser);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!confirm("WARNING: Restoring a backup will overwrite the current neural protocols for this ID. Are you sure you want to proceed?")) {
             if (fileInputRef.current) fileInputRef.current.value = '';
             return;
        }

        setIsImporting(true);

        try {
            const { user: importedUser } = await importUserData(file);
            
            if (currentUser && importedUser.username.toLowerCase() === currentUser.username.toLowerCase()) {
                localStorage.setItem('gpa_session', JSON.stringify(importedUser));
                
                if (importedUser.id !== currentUser.id) {
                    window.location.reload();
                } else {
                    await loadGoals();
                    setRewardMessage("Neural Link Restored Successfully");
                }
            } else {
                if (confirm(`Data imported for subject: ${importedUser.username}. Switch to this neural link?`)) {
                    localStorage.setItem('gpa_session', JSON.stringify(importedUser));
                    window.location.reload();
                } else {
                    alert(`Import complete. Data stored for ${importedUser.username} but session retained for ${currentUser?.username}.`);
                }
            }
        } catch (error: any) {
            console.error(error);
            alert("Import failed: " + error.message);
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Assistant Handlers
    const openAssistant = (title: string, description: string, mode: 'creation' | 'edition') => {
        setAssistantContext({ title, description, mode });
        setShowAssistant(true);
    };

    // Edit Handlers
    const startEditing = (goal: Goal) => {
        setEditingGoalId(goal.id);
        setEditTitle(goal.title);
        setEditDescription(goal.description);
        setEditAIReasoning(goal.aiAssessment?.reasoning || '');
        setEditAISuggestion(goal.aiAssessment?.suggestion || '');
        setEditAlternativeActions(goal.aiAssessment?.alternativeActions || []);
        // Automatically sync assistant context if it's already open
        if (showAssistant) {
            setAssistantContext({ title: goal.title, description: goal.description, mode: 'edition' });
        }
    };

    const cancelEditing = () => {
        setEditingGoalId(null);
        setEditTitle('');
        setEditDescription('');
        setEditAIReasoning('');
        setEditAISuggestion('');
        setEditAlternativeActions([]);
        setIsPolishing(false);
        setAssistantContext(prev => ({ ...prev, mode: 'idle' }));
    };

    const handleAIPolish = async () => {
        if (!process.env.API_KEY) {
            alert("API Key missing");
            return;
        }
        if (!editTitle && !editDescription) return;

        setIsPolishing(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
                You are a goal optimization expert. Improve this goal for maximum motivation and clarity.
                
                Current Title: "${editTitle}"
                Current Description: "${editDescription}"
                
                Requirements:
                1. Make the title action-oriented, punchy, and under 80 characters
                2. Make the description explicitly clear about WHY this goal matters
                3. Use motivating, energizing language
                4. Output ONLY the JSON with no additional text
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-flash-lite-latest',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING }
                        },
                        required: ["title", "description"]
                    }
                }
            });

            if (response.text) {
                const data = JSON.parse(response.text);
                setEditTitle(data.title || editTitle);
                setEditDescription(data.description || editDescription);
                setAssistantContext(prev => ({ ...prev, title: data.title, description: data.description }));
            }

        } catch (e) {
            console.error("AI Polish failed", e);
        } finally {
            setIsPolishing(false);
        }
    };

    const saveEdit = async (id: string) => {
        if (!editTitle.trim() || !editDescription.trim()) return;
        
        setIsSaving(true);
        try {
            const goals = await getGoals();
            const currentGoal = goals.find(g => g.id === id);
            
            // Prepare the AI assessment update if it exists
            let updatedAIAssessment = currentGoal?.aiAssessment;
            if (updatedAIAssessment && (editAIReasoning || editAISuggestion || editAlternativeActions.length > 0)) {
                updatedAIAssessment = {
                    ...updatedAIAssessment,
                    reasoning: editAIReasoning,
                    suggestion: editAISuggestion,
                    alternativeActions: editAlternativeActions.length > 0 ? editAlternativeActions : undefined
                };
            }
            
            await updateGoal(id, { 
                title: editTitle, 
                description: editDescription,
                aiAssessment: updatedAIAssessment
            });
            await loadGoals();
            cancelEditing();
        } catch (e) {
            console.error("Failed to update goal", e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteGoal = async (id: string) => {
        if (confirm("WARNING: Are you sure you want to delete this neural protocol? This cannot be undone.")) {
            setIsSaving(true);
            try {
                await deleteGoal(id);
                await loadGoals();
                cancelEditing();
            } catch (e) {
                console.error("Failed to delete goal", e);
            } finally {
                setIsSaving(false);
            }
        }
    };

    if (showSpaceTime) {
        return <SpaceTimePlayer onClose={() => setShowSpaceTime(false)} />;
    }

    // Focus Mode - Show only one goal with maximum space
    if (focusedGoalId) {
        const focusedGoal = goals.find(g => g.id === focusedGoalId);
        if (!focusedGoal) {
            setFocusedGoalId(null);
            return null;
        }

        const completedMilestones = focusedGoal.milestones.filter(m => m.isCompleted).length;
        const totalMilestones = focusedGoal.milestones.length;
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
                    {/* Header with Exit Focus Button */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setFocusedGoalId(null)}
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
                                Diff: {focusedGoal.difficultyRating}/10
                            </div>
                            {focusedGoal.estimatedTimeframe && (
                                <div className="bg-emerald-900/20 px-4 py-2 rounded-full text-base font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-2">
                                    <CalendarClock size={16} />
                                    {focusedGoal.estimatedTimeframe}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Focused Goal Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 shadow-2xl">
                        {editingGoalId === focusedGoal.id ? (
                            /* Edit Mode in Focus */
                            <div className="space-y-6">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl text-indigo-400 font-bold uppercase">Editing Protocol</span>
                                        <button 
                                            onClick={() => openAssistant(editTitle, editDescription, 'edition')}
                                            className="text-base flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 px-3 py-2 rounded-lg border border-indigo-500/30 transition-colors"
                                        >
                                            <Bot size={16} /> Neural Assistant
                                        </button>
                                    </div>
                                    
                                    <div className="relative group">
                                        <button 
                                            onClick={handleAIPolish}
                                            disabled={isPolishing}
                                            className="text-base flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 border border-white/10"
                                        >
                                            {isPolishing ? (
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
                                        value={editTitle}
                                        onChange={e => {
                                            setEditTitle(e.target.value);
                                            if (showAssistant) setAssistantContext(prev => ({ ...prev, title: e.target.value }));
                                        }}
                                        className="w-full bg-slate-950 border-2 border-slate-700 rounded-lg p-4 text-white font-bold text-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        placeholder="Goal Title"
                                        autoFocus
                                    />
                                </div>
                                
                                <div>
                                    <label className="text-base text-indigo-300 font-bold uppercase mb-2 block">Description / Why This Matters</label>
                                    <textarea 
                                        value={editDescription}
                                        onChange={e => {
                                            setEditDescription(e.target.value);
                                            if (showAssistant) setAssistantContext(prev => ({ ...prev, description: e.target.value }));
                                        }}
                                        className="w-full bg-slate-950 border-2 border-slate-700 rounded-lg p-4 text-white text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y min-h-[150px]"
                                        placeholder="Explain why this goal is important to you..."
                                        rows={6}
                                    />
                                </div>

                                {/* AI Assessment Editing in Focus Mode */}
                                {focusedGoal.aiAssessment && (
                                    <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-xl p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Brain size={18} className="text-indigo-400" />
                                            <h5 className="text-base font-bold text-indigo-300 uppercase tracking-wider">Neural Analysis Log</h5>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm text-slate-500 uppercase font-bold block mb-2">AI Reasoning:</label>
                                                <textarea
                                                    value={editAIReasoning}
                                                    onChange={(e) => setEditAIReasoning(e.target.value)}
                                                    className="w-full bg-slate-950 border-2 border-slate-700 rounded-lg p-3 text-slate-300 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y min-h-[100px]"
                                                    placeholder="AI's reasoning about this goal..."
                                                    rows={4}
                                                />
                                            </div>
                                            <div className="flex items-center gap-3 text-sm">
                                                <span className="bg-slate-800 px-3 py-1.5 rounded text-slate-300">
                                                    Est. Difficulty: {focusedGoal.aiAssessment.estimatedRating}/10
                                                </span>
                                            </div>
                                            <div>
                                                <label className="text-sm text-slate-500 uppercase font-bold block mb-2">AI Suggestion:</label>
                                                <input
                                                    type="text"
                                                    value={editAISuggestion}
                                                    onChange={(e) => setEditAISuggestion(e.target.value)}
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
                                                        onClick={() => setEditAlternativeActions([...editAlternativeActions, ''])}
                                                        className="text-sm flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30 transition-colors"
                                                    >
                                                        <Plus size={12} />
                                                        Add Action
                                                    </button>
                                                </div>
                                                {editAlternativeActions.length === 0 ? (
                                                    <p className="text-sm text-slate-600 italic">No starting points defined. Click "Add Action" to create one.</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {editAlternativeActions.map((action, i) => (
                                                            <div key={i} className="flex gap-2 items-center">
                                                                <span className="text-slate-500 text-sm shrink-0">{i + 1}.</span>
                                                                <input
                                                                    type="text"
                                                                    value={action}
                                                                    onChange={(e) => {
                                                                        const updated = [...editAlternativeActions];
                                                                        updated[i] = e.target.value;
                                                                        setEditAlternativeActions(updated);
                                                                    }}
                                                                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                                    placeholder="Enter starting action..."
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditAlternativeActions(editAlternativeActions.filter((_, idx) => idx !== i))}
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
                                    <button onClick={() => saveEdit(focusedGoal.id)} disabled={isSaving} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-6 py-3 rounded-lg text-lg font-bold text-white transition-colors shadow-lg shadow-green-900/20">
                                        <Save size={20} /> Save Changes
                                    </button>
                                    <button onClick={cancelEditing} disabled={isSaving} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-6 py-3 rounded-lg text-lg font-medium text-slate-300 hover:text-white transition-colors">
                                        <X size={20} /> Discard
                                    </button>
                                    <div className="flex-1"></div>
                                    <button onClick={() => handleDeleteGoal(focusedGoal.id)} disabled={isSaving} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-3 rounded-lg text-base font-bold transition-colors border border-red-500/20">
                                        <Trash2 size={18} /> Delete
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* View Mode in Focus */
                            <>
                                <div className="mb-8">
                                    <div className="flex items-center justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-4">
                                            <h2 className="text-5xl font-bold text-white leading-tight">{focusedGoal.title}</h2>
                                            {focusedGoal.status === 'completed' && (
                                                <span className="flex items-center gap-2 text-sm bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                                                    <CheckCircle size={16} /> COMPLETED
                                                </span>
                                            )}
                                        </div>
                                        <button onClick={() => startEditing(focusedGoal)} className="text-slate-400 hover:text-indigo-400 transition-colors p-2 hover:bg-slate-800 rounded-lg" title="Edit Goal">
                                            <Edit2 size={24} />
                                        </button>
                                    </div>
                                    <p className="text-slate-300 text-xl leading-relaxed whitespace-pre-wrap">{focusedGoal.description}</p>
                                </div>

                                {/* Progress Bar */}
                                {totalMilestones > 0 && (
                                    <div className="mb-8">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-lg font-medium text-slate-400">Progress</span>
                                            <span className="text-lg font-bold text-indigo-400">{completedMilestones}/{totalMilestones} Milestones ({progress}%)</span>
                                        </div>
                                        <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden">
                                            <div className={`h-full transition-all duration-500 ${focusedGoal.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                )}

                                {/* AI Assessment */}
                                {focusedGoal.aiAssessment && (
                            <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-xl p-6 mb-8">
                                <div className="flex items-center gap-3 mb-3">
                                    <Brain size={18} className="text-indigo-400" />
                                    <h5 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">Neural Analysis Log</h5>
                                </div>
                                <p className="text-base text-slate-400 mb-4 italic leading-relaxed">"{focusedGoal.aiAssessment.reasoning}"</p>
                                <div className="flex items-center gap-4 text-sm mb-4 flex-wrap">
                                    <span className="bg-slate-800 px-3 py-1.5 rounded text-slate-300">
                                        Est. Difficulty: {focusedGoal.aiAssessment.estimatedRating}/10
                                    </span>
                                    {focusedGoal.aiAssessment.estimatedTimeframe && (
                                        <span className="bg-emerald-900/20 px-3 py-1.5 rounded text-emerald-400 border border-emerald-500/30 flex items-center gap-2">
                                            <CalendarClock size={14} />
                                            Est. Time: {focusedGoal.aiAssessment.estimatedTimeframe}
                                        </span>
                                    )}
                                    <span className="text-indigo-400/80">
                                        Suggestion: {focusedGoal.aiAssessment.suggestion}
                                    </span>
                                </div>
                                {focusedGoal.aiAssessment.timeframeReasoning && (
                                    <p className="text-sm text-slate-500 mb-4 italic leading-relaxed">⏱️ {focusedGoal.aiAssessment.timeframeReasoning}</p>
                                )}
                                {focusedGoal.aiAssessment.alternativeActions && focusedGoal.aiAssessment.alternativeActions.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-indigo-500/20">
                                        <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider block mb-2">Suggested Starting Points:</span>
                                        <ul className="list-disc list-inside text-base text-slate-400 space-y-1.5">
                                            {focusedGoal.aiAssessment.alternativeActions.map((action, i) => (
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
                            {focusedGoal.milestones.length === 0 ? (
                                <p className="text-slate-500 italic text-lg">No milestones defined yet. Break this goal down.</p>
                            ) : (
                                <div className="space-y-4">
                                    {focusedGoal.milestones.map(milestone => (
                                        <MilestoneItem 
                                            key={milestone.id} 
                                            milestone={milestone} 
                                            onUpdate={loadGoals}
                                            onReward={handleReward}
                                        />
                                    ))}
                                </div>
                            )}
                            
                            <MilestoneInput 
                                goalId={focusedGoal.id} 
                                goalTitle={focusedGoal.title}
                                goalDescription={focusedGoal.description}
                                onMilestoneCreated={loadGoals} 
                            />
                        </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8 relative overflow-x-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none fixed"></div>

            {/* Persistent Assistant Singleton */}
            <NeuralAssistant 
                isOpen={showAssistant} 
                onClose={() => setShowAssistant(false)}
                contextData={assistantContext}
            />
            
            {showSchedule && (
                <ScheduleGenerator goals={goals} onClose={() => setShowSchedule(false)} />
            )}

            {showAudit && (
                <GoalAuditModal goals={goals} onClose={() => setShowAudit(false)} />
            )}

            {showProfile && (
                <UserProfileModal 
                    isOpen={showProfile} 
                    onClose={() => setShowProfile(false)}
                    onUpdate={() => {
                        // Force re-render to update any profile-dependent UI
                        const user = getCurrentUser();
                        if (user) {
                            setShowProfile(false);
                        }
                    }}
                />
            )}

            {rewardMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-bounce">
                    <div className={`px-6 py-4 rounded-xl font-bold shadow-2xl border ${rewardMessage.includes('JACKPOT') ? 'bg-yellow-500 text-black border-yellow-300' : 'bg-indigo-600 text-white border-indigo-400'}`}>
                        {rewardMessage}
                    </div>
                </div>
            )}

            {showAmygdala && (
                <ForeshadowingFailureModal mode="view" onUnlock={() => setShowAmygdala(false)} />
            )}

            <div className="max-w-[1800px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 transition-all duration-500">
                
                <div className="lg:col-span-4 xl:col-span-3">
                    <div className="lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto custom-scrollbar lg:pr-2 space-y-8 pb-8">
                        <header>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
                                        <BrainCircuit className="text-indigo-500" size={32} />
                                        GPA
                                    </h1>
                                    <p className="text-slate-400 text-sm">Goal Pursuit Accelerator</p>
                                </div>
                                
                                <div className="flex gap-2">
                                    <input type="file" accept=".json" ref={fileInputRef} onClick={(e) => (e.currentTarget.value = '')} onChange={handleImport} className="hidden" />
                                    <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="text-slate-500 hover:text-emerald-400 transition p-2 bg-slate-900/50 rounded-lg border border-slate-800" title="Restore Neural Link">
                                        {isImporting ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                                    </button>
                                    <button onClick={handleExport} className="text-slate-500 hover:text-indigo-400 transition p-2 bg-slate-900/50 rounded-lg border border-slate-800" title="Backup Neural Link">
                                        <DownloadCloud size={18} />
                                    </button>
                                    <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition p-2 bg-slate-900/50 rounded-lg border border-slate-800" title="Disconnect">
                                        <LogOut size={18} />
                                    </button>
                                </div>
                            </div>
                            
                            {currentUser && (
                                <div className="mt-4 flex items-center justify-between gap-2 bg-indigo-950/30 p-3 rounded-lg border border-indigo-900/50">
                                    <div className="flex items-center gap-2">
                                        <UserIcon size={14} className="text-indigo-400" />
                                        <div className="text-xs font-mono">
                                            <span className="text-slate-500">SUBJ:</span>{' '}
                                            <span className="text-indigo-300">{currentUser.username}</span>
                                            {currentUser.profile?.age && (
                                                <span className="text-slate-600 ml-2">• {currentUser.profile.age}y</span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowProfile(true)}
                                        className="text-slate-500 hover:text-indigo-400 transition-colors p-1"
                                        title="Edit Profile"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                            )}
                        </header>

                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                             <h3 className="text-slate-300 font-semibold mb-2 text-sm uppercase tracking-wider">Neuro-Tools</h3>
                             <div className="space-y-2">
                                 <button onClick={() => setShowAudit(true)} className="w-full py-3 bg-indigo-900/20 hover:bg-indigo-900/40 border border-indigo-500/20 text-indigo-300 rounded-lg transition flex items-center justify-center gap-2 text-sm font-medium">
                                     <PieChart size={16} /> Neuro-Balance Audit
                                 </button>
                                 <button onClick={() => setShowSpaceTime(true)} className="w-full py-3 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-500/20 text-purple-300 rounded-lg transition flex items-center justify-center gap-2 text-sm font-medium">
                                     <Activity size={16} /> Space-Time Bridge
                                 </button>
                                 <button onClick={() => setShowAmygdala(true)} className="w-full py-3 bg-red-900/20 hover:bg-red-900/40 border border-red-500/20 text-red-300 rounded-lg transition flex items-center justify-center gap-2 text-sm font-medium">
                                     <Flame size={16} /> Amygdala Protocol
                                 </button>
                                 <button onClick={() => setShowSchedule(true)} className="w-full py-3 bg-sky-900/20 hover:bg-sky-900/40 border border-sky-500/20 text-sky-300 rounded-lg transition flex items-center justify-center gap-2 text-sm font-medium">
                                     <CalendarClock size={16} /> Neuro-Chronology
                                 </button>
                             </div>
                        </div>

                        <CreateGoalForm onGoalCreated={loadGoals} onOpenAssistant={(t, d) => openAssistant(t, d, 'creation')} />
                    </div>
                </div>

                <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                         <div className="flex items-center gap-4">
                             <h2 className="text-xl font-bold text-white">Active Protocols</h2>
                             <div className="text-slate-500 text-sm border-l border-slate-800 pl-4">{goals.length} {goals.length === 1 ? 'Protocol' : 'Protocols'} Running</div>
                         </div>
                         
                         <div className="flex items-center gap-2 flex-wrap">
                             {/* Zoom Controls */}
                             <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 items-center">
                                 <button 
                                     onClick={handleZoomOut}
                                     className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-md transition"
                                     title="Zoom Out"
                                 >
                                     <ZoomOut size={14} />
                                 </button>
                                 <span className="text-[10px] w-8 text-center text-slate-400 font-mono">{zoomLevel}%</span>
                                 <button 
                                     onClick={handleZoomIn}
                                     className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-md transition"
                                     title="Zoom In"
                                 >
                                     <ZoomIn size={14} />
                                 </button>
                                 <button 
                                     onClick={handleZoomReset}
                                     className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-md transition ml-1 border-l border-slate-700"
                                     title="Reset Zoom"
                                 >
                                     <RotateCcw size={12} />
                                 </button>
                             </div>

                             <div className="w-px h-6 bg-slate-800 mx-1 hidden sm:block"></div>

                             {/* Batch Actions */}
                             <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                                 <button 
                                     onClick={expandAll}
                                     className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-md transition"
                                     title="Expand All Details"
                                 >
                                     <Maximize2 size={14} />
                                 </button>
                                 <button 
                                     onClick={collapseAll}
                                     className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-md transition"
                                     title="Collapse All (Summary)"
                                 >
                                     <Minimize2 size={14} />
                                 </button>
                             </div>

                             <div className="w-px h-6 bg-slate-800 mx-1 hidden sm:block"></div>

                             {/* View Mode Toggle */}
                             <button 
                                onClick={toggleGridView}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                                    isGridView 
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/40' 
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                                }`}
                             >
                                {isGridView ? <LayoutGrid size={16} /> : <List size={16} />}
                                {isGridView ? 'Compact Grid' : 'Standard View'}
                             </button>
                         </div>
                    </div>
                    
                    {loading ? (
                        <div className="text-slate-500 animate-pulse flex items-center gap-2"><Loader2 className="animate-spin" /> Loading neural pathways...</div>
                    ) : goals.length === 0 ? (
                        <div className="text-slate-500 italic p-8 border border-dashed border-slate-800 rounded-2xl text-center">
                            No active protocols found. Define a new goal in the left panel to begin.
                        </div>
                    ) : (
                        <div className={`grid gap-6 items-start transition-all duration-300 ease-in-out ${
                            isGridView 
                            ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                            : 'grid-cols-1 2xl:grid-cols-2'
                        }`}>
                            {goals.map(goal => {
                                const isCollapsed = collapsedGoals.has(goal.id);
                                const completedMilestones = goal.milestones.filter(m => m.isCompleted).length;
                                const totalMilestones = goal.milestones.length;
                                const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
                                const isEditing = editingGoalId === goal.id;

                                return (
                                    <div key={goal.id} className={`bg-slate-900 border ${goal.status === 'completed' ? 'border-emerald-500/50 shadow-emerald-900/20 shadow-lg' : 'border-slate-800'} rounded-2xl p-6 hover:border-indigo-900/50 transition-all ${isEditing ? '2xl:col-span-2 shadow-2xl shadow-black ring-1 ring-indigo-500/30 z-20 relative' : ''}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            {isEditing ? (
                                                <div className="flex-1 mr-4 space-y-3">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-indigo-400 font-bold uppercase">Editing Protocol</span>
                                                            <button 
                                                                onClick={() => openAssistant(editTitle, editDescription, 'edition')}
                                                                className="text-xs flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-md border border-indigo-500/30 transition-colors"
                                                            >
                                                                <Bot size={12} /> Assist
                                                            </button>
                                                        </div>
                                                        
                                                        <div className="relative group">
                                                            <button 
                                                                onClick={handleAIPolish}
                                                                disabled={isPolishing}
                                                                className="text-xs flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-3 py-1.5 rounded-md shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 border border-white/10"
                                                            >
                                                                {isPolishing ? (
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
                                                            value={editTitle}
                                                            onChange={e => {
                                                                setEditTitle(e.target.value);
                                                                if (showAssistant) setAssistantContext(prev => ({ ...prev, title: e.target.value }));
                                                            }}
                                                            className="w-full bg-slate-950 border-2 border-slate-700 rounded-lg p-3 text-white font-bold text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                                            placeholder="Goal Title"
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-indigo-300 font-bold uppercase mb-2 block">Description / Why This Matters</label>
                                                        <textarea 
                                                            value={editDescription}
                                                            onChange={e => {
                                                                setEditDescription(e.target.value);
                                                                if (showAssistant) setAssistantContext(prev => ({ ...prev, description: e.target.value }));
                                                            }}
                                                            className="w-full bg-slate-950 border-2 border-slate-700 rounded-lg p-4 text-white text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y min-h-[120px]"
                                                            placeholder="Explain why this goal is important to you..."
                                                            rows={5}
                                                        />
                                                    </div>
                                                    
                                                    {/* AI Assessment in Edit Mode (Editable) */}
                                                    {goal.aiAssessment && (
                                                        <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-xl p-4">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <Brain size={14} className="text-indigo-400" />
                                                                <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Neural Analysis Log</h5>
                                                                <span className="text-[10px] text-slate-600 ml-auto">
                                                                    {new Date(goal.aiAssessment.timestamp).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <label className="text-xs text-slate-500 uppercase font-bold block mb-1">AI Reasoning:</label>
                                                                    <textarea
                                                                        value={editAIReasoning}
                                                                        onChange={(e) => setEditAIReasoning(e.target.value)}
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
                                                                        value={editAISuggestion}
                                                                        onChange={(e) => setEditAISuggestion(e.target.value)}
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
                                                                            onClick={() => setEditAlternativeActions([...editAlternativeActions, ''])}
                                                                            className="text-[10px] flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30 transition-colors"
                                                                        >
                                                                            <Plus size={10} />
                                                                            Add Action
                                                                        </button>
                                                                    </div>
                                                                    {editAlternativeActions.length === 0 ? (
                                                                        <p className="text-xs text-slate-600 italic">No starting points defined. Click "Add Action" to create one.</p>
                                                                    ) : (
                                                                        <div className="space-y-2">
                                                                            {editAlternativeActions.map((action, i) => (
                                                                                <div key={i} className="flex gap-2 items-center">
                                                                                    <span className="text-slate-500 text-xs shrink-0">{i + 1}.</span>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={action}
                                                                                        onChange={(e) => {
                                                                                            const updated = [...editAlternativeActions];
                                                                                            updated[i] = e.target.value;
                                                                                            setEditAlternativeActions(updated);
                                                                                        }}
                                                                                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                                                        placeholder="Enter starting action..."
                                                                                    />
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => setEditAlternativeActions(editAlternativeActions.filter((_, idx) => idx !== i))}
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
                                                        <button onClick={() => saveEdit(goal.id)} disabled={isSaving} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors shadow-lg shadow-green-900/20">
                                                            <Save size={16} /> Save Changes
                                                        </button>
                                                        <button onClick={cancelEditing} disabled={isSaving} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                                            <X size={16} /> Discard
                                                        </button>
                                                        <div className="flex-1"></div>
                                                        <button onClick={() => handleDeleteGoal(goal.id)} disabled={isSaving} className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-lg text-xs font-bold transition-colors border border-red-500/20">
                                                            <Trash2 size={14} /> Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 mr-4 group relative">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                            {goal.title}
                                                            {goal.status === 'completed' && (
                                                                <span className="flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                                    <CheckCircle size={12} /> COMPLETED
                                                                </span>
                                                            )}
                                                        </h3>
                                                        <button onClick={() => startEditing(goal)} className="text-slate-500 hover:text-indigo-400 transition-colors p-1.5 hover:bg-slate-800 rounded-lg" title="Edit Goal">
                                                            <Edit2 size={16} />
                                                        </button>
                                                    </div>
                                                    <p className={`text-slate-400 text-sm mt-1 whitespace-pre-wrap ${isCollapsed ? 'line-clamp-2' : ''}`}>{goal.description}</p>
                                                </div>
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
                                                <div className="flex flex-col gap-2">
                                                    <button 
                                                        onClick={() => setFocusedGoalId(goal.id)} 
                                                        className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors border border-transparent hover:border-indigo-500/30"
                                                        title="Focus on this goal"
                                                    >
                                                        <Maximize2 size={18} />
                                                    </button>
                                                    <button onClick={() => toggleGoal(goal.id)} className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                                                        {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {isCollapsed && (
                                            <div onClick={() => toggleGoal(goal.id)} className="mt-2 flex items-center justify-between text-xs text-slate-500 bg-slate-950/30 p-2 rounded-lg border border-slate-800/50 cursor-pointer hover:bg-slate-950/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono text-indigo-300/70">{completedMilestones}/{totalMilestones} Milestones</span>
                                                    <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className={`h-full ${goal.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }}></div>
                                                    </div>
                                                </div>
                                                <span>Expand details</span>
                                            </div>
                                        )}

                                        {!isCollapsed && !isEditing && (
                                            <div className="mt-6 space-y-4 animate-in fade-in duration-300">
                                                {/* Saved AI Assessment Display */}
                                                {goal.aiAssessment && (
                                                    <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-xl p-4 mb-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Brain size={14} className="text-indigo-400" />
                                                            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Neural Analysis Log</h5>
                                                            <span className="text-[10px] text-slate-600 ml-auto">
                                                                {new Date(goal.aiAssessment.timestamp).toLocaleDateString()}
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

                                                {goal.milestones.length === 0 ? (
                                                    <p className="text-slate-600 italic text-sm">No milestones defined yet. Break this goal down.</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {goal.milestones.map(milestone => (
                                                            <MilestoneItem 
                                                                key={milestone.id} 
                                                                milestone={milestone} 
                                                                onUpdate={loadGoals}
                                                                onReward={handleReward}
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
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;