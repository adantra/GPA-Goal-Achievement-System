import React, { useState, useEffect, useRef } from 'react';
import { Goal, Milestone, RewardType } from '../types';
import { getGoals, updateGoal, deleteGoal } from '../services/goalController';
import { getCurrentUser, logout } from '../services/auth';
import { exportUserData, importUserData } from '../services/dataManagement';
import CreateGoalForm from './CreateGoalForm';
import MilestoneInput from './MilestoneInput';
import MilestoneItem from './MilestoneItem';
import { Trophy, Activity, BrainCircuit, LogOut, User as UserIcon, DownloadCloud, CheckCircle, Edit2, Save, X, Trash2, ChevronDown, ChevronUp, UploadCloud, Loader2, Sparkles, Flame, Bot, CalendarClock, Info, PieChart, LayoutGrid, List, Maximize2, Minimize2, Brain, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import SpaceTimePlayer from './SpaceTimePlayer';
import ForeshadowingFailureModal from './ForeshadowingFailureModal';
import NeuralAssistant from './NeuralAssistant';
import ScheduleGenerator from './ScheduleGenerator';
import GoalAuditModal from './GoalAuditModal';
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
    const [rewardMessage, setRewardMessage] = useState<string | null>(null);
    const currentUser = getCurrentUser();

    // File Import Ref
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    // Editing State
    const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
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
        // Automatically sync assistant context if it's already open
        if (showAssistant) {
            setAssistantContext({ title: goal.title, description: goal.description, mode: 'edition' });
        }
    };

    const cancelEditing = () => {
        setEditingGoalId(null);
        setEditTitle('');
        setEditDescription('');
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
                Optimize this goal protocol for maximum neuro-motivation.
                Title: "${editTitle}"
                Description: "${editDescription}"

                1. Make the Title action-oriented and punchy.
                2. Make the Description strictly explicitly clear about WHY this matters, using motivating language.
                
                Return JSON: { "title": string, "description": string }
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
                        }
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
            await updateGoal(id, { title: editTitle, description: editDescription });
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
                                <div className="mt-4 flex items-center gap-2 text-xs font-mono text-indigo-300 bg-indigo-950/30 p-2 px-3 rounded-full w-fit border border-indigo-900/50">
                                    <UserIcon size={12} />
                                    <span>SUBJ: {currentUser.username}</span>
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
                                                    <input 
                                                        value={editTitle}
                                                        onChange={e => {
                                                            setEditTitle(e.target.value);
                                                            if (showAssistant) setAssistantContext(prev => ({ ...prev, title: e.target.value }));
                                                        }}
                                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        placeholder="Goal Title"
                                                        autoFocus
                                                    />
                                                    <textarea 
                                                        value={editDescription}
                                                        onChange={e => {
                                                            setEditDescription(e.target.value);
                                                            if (showAssistant) setAssistantContext(prev => ({ ...prev, description: e.target.value }));
                                                        }}
                                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                                                        placeholder="Description"
                                                    />
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
                                                        <button onClick={() => startEditing(goal)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-indigo-400 transition-opacity p-1" title="Edit Goal">
                                                            <Edit2 size={16} />
                                                        </button>
                                                    </div>
                                                    <p className={`text-slate-400 text-sm mt-1 whitespace-pre-wrap ${isCollapsed ? 'line-clamp-2' : ''}`}>{goal.description}</p>
                                                </div>
                                            )}

                                            <div className="flex flex-col items-end gap-3 ml-4">
                                                <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-mono text-indigo-400 whitespace-nowrap border border-slate-700">
                                                    Diff: {goal.difficultyRating}/10
                                                </div>
                                                <button onClick={() => toggleGoal(goal.id)} className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                                                    {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                                                </button>
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
                                                        <div className="flex items-center gap-3 text-xs">
                                                            <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                                                                Est. Difficulty: {goal.aiAssessment.estimatedRating}/10
                                                            </span>
                                                            <span className="text-indigo-400/80">
                                                                Suggestion: {goal.aiAssessment.suggestion}
                                                            </span>
                                                        </div>
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