import React, { useState, useEffect, useRef } from 'react';
import { Goal, Milestone, RewardType } from '../types';
import { getGoals, updateGoal, deleteGoal } from '../services/goalController';
import { getCurrentUser, logout, login } from '../services/auth';
import { exportUserData, importUserData } from '../services/dataManagement';
import CreateGoalForm from './CreateGoalForm';
import MilestoneInput from './MilestoneInput';
import MilestoneItem from './MilestoneItem';
import { Trophy, Activity, BrainCircuit, LogOut, User as UserIcon, DownloadCloud, CheckCircle, Edit2, Save, X, Trash2, ChevronDown, ChevronUp, UploadCloud, Loader2, Sparkles, Flame, Bot } from 'lucide-react';
import SpaceTimePlayer from './SpaceTimePlayer';
import ForeshadowingFailureModal from './ForeshadowingFailureModal';
import NeuralAssistant from './NeuralAssistant';
import { GoogleGenAI, Type } from "@google/genai";

interface Props {
    onLogout: () => void;
}

const Dashboard: React.FC<Props> = ({ onLogout }) => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSpaceTime, setShowSpaceTime] = useState(false);
    const [showAmygdala, setShowAmygdala] = useState(false);
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
    const [showAssistant, setShowAssistant] = useState(false);

    // Collapsed State
    const [collapsedGoals, setCollapsedGoals] = useState<Set<string>>(new Set());

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

    const toggleGoal = (id: string) => {
        const newCollapsed = new Set(collapsedGoals);
        if (newCollapsed.has(id)) {
            newCollapsed.delete(id);
        } else {
            newCollapsed.add(id);
        }
        setCollapsedGoals(newCollapsed);
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
            
            // If the backup belongs to the current user, refresh immediately
            if (currentUser && importedUser.id === currentUser.id) {
                await loadGoals();
                setRewardMessage("Neural Link Restored Successfully");
            } else {
                // If it's a different user, ask to switch
                if (confirm(`Data imported for subject: ${importedUser.username}. Switch to this neural link?`)) {
                    await login(importedUser.username, importedUser.password);
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

    // Edit Handlers
    const startEditing = (goal: Goal) => {
        setEditingGoalId(goal.id);
        setEditTitle(goal.title);
        setEditDescription(goal.description);
    };

    const cancelEditing = () => {
        setEditingGoalId(null);
        setEditTitle('');
        setEditDescription('');
        setIsPolishing(false);
        setShowAssistant(false);
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
                model: 'gemini-3-flash-preview',
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
            await loadGoals(); // Reload to get fresh data
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
        <div className="min-h-screen bg-slate-950 p-6 md:p-12 relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

            {/* Neural Assistant Drawer */}
            <NeuralAssistant 
                isOpen={showAssistant} 
                onClose={() => setShowAssistant(false)}
                contextData={{ 
                    title: editTitle, 
                    description: editDescription, 
                    mode: 'edition' 
                }}
            />

            {/* Reward Toast */}
            {rewardMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-bounce">
                    <div className={`px-6 py-4 rounded-xl font-bold shadow-2xl border ${rewardMessage.includes('JACKPOT') ? 'bg-yellow-500 text-black border-yellow-300' : 'bg-indigo-600 text-white border-indigo-400'}`}>
                        {rewardMessage}
                    </div>
                </div>
            )}

            {showAmygdala && (
                <ForeshadowingFailureModal mode="view" onUnlock={() => setShowAmygdala(false)} />
            )}

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                
                {/* Left Column: Create & Stats */}
                <div className="space-y-8">
                    <header>
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
                                    <BrainCircuit className="text-indigo-500" size={32} />
                                    GPA
                                </h1>
                                <p className="text-slate-400">Goal Pursuit Accelerator</p>
                            </div>
                            
                            <div className="flex gap-2">
                                <input 
                                    type="file" 
                                    accept=".json" 
                                    ref={fileInputRef} 
                                    onClick={(e) => (e.currentTarget.value = '')}
                                    onChange={handleImport} 
                                    className="hidden" 
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isImporting}
                                    className="text-slate-500 hover:text-emerald-400 transition p-2 bg-slate-900/50 rounded-lg border border-slate-800 disabled:opacity-50"
                                    title="Restore Neural Link (Import Data)"
                                >
                                    {isImporting ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                                </button>
                                <button 
                                    onClick={handleExport}
                                    className="text-slate-500 hover:text-indigo-400 transition p-2 bg-slate-900/50 rounded-lg border border-slate-800"
                                    title="Backup Neural Link (Export Data)"
                                >
                                    <DownloadCloud size={20} />
                                </button>
                                <button 
                                    onClick={handleLogout}
                                    className="text-slate-500 hover:text-red-400 transition p-2 bg-slate-900/50 rounded-lg border border-slate-800"
                                    title="Disconnect (Logout)"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        </div>
                        
                        {currentUser && (
                            <div className="mt-4 flex items-center gap-2 text-sm text-indigo-300 bg-indigo-950/30 p-2 px-3 rounded-full w-fit border border-indigo-900/50">
                                <UserIcon size={14} />
                                <span>Subject: {currentUser.username}</span>
                            </div>
                        )}
                    </header>

                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                         <h3 className="text-slate-300 font-semibold mb-2">Neuro-Tools</h3>
                         <div className="space-y-2">
                             <button 
                                onClick={() => setShowSpaceTime(true)}
                                className="w-full py-3 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 rounded-lg transition flex items-center justify-center gap-2"
                             >
                                 <Activity size={18} />
                                 Space-Time Bridge
                             </button>
                             <button 
                                onClick={() => setShowAmygdala(true)}
                                className="w-full py-3 bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 text-red-300 rounded-lg transition flex items-center justify-center gap-2"
                             >
                                 <Flame size={18} />
                                 Amygdala Protocol
                             </button>
                         </div>
                    </div>

                    <CreateGoalForm onGoalCreated={loadGoals} />
                </div>

                {/* Right Column: Goal List */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-white">Active Protocols</h2>
                    
                    {loading ? (
                        <div className="text-slate-500 animate-pulse">Loading neural pathways...</div>
                    ) : goals.length === 0 ? (
                        <div className="text-slate-500 italic">No active protocols found. Define a new goal to begin.</div>
                    ) : (
                        goals.map(goal => {
                            const isCollapsed = collapsedGoals.has(goal.id);
                            const completedMilestones = goal.milestones.filter(m => m.isCompleted).length;
                            const totalMilestones = goal.milestones.length;
                            const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

                            return (
                                <div key={goal.id} className={`bg-slate-900 border ${goal.status === 'completed' ? 'border-emerald-500/50 shadow-emerald-900/20 shadow-lg' : 'border-slate-800'} rounded-2xl p-6 hover:border-indigo-900/50 transition-all`}>
                                    <div className="flex justify-between items-start mb-4">
                                        {editingGoalId === goal.id ? (
                                            <div className="flex-1 mr-4 space-y-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs text-indigo-400 font-bold uppercase">Editing Protocol</span>
                                                    <button 
                                                        onClick={() => setShowAssistant(!showAssistant)}
                                                        className="text-xs flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-md border border-indigo-500/30 transition-colors"
                                                    >
                                                        <Bot size={12} /> Assist
                                                    </button>
                                                    <button 
                                                        onClick={handleAIPolish}
                                                        disabled={isPolishing}
                                                        className="ml-auto text-xs flex items-center gap-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-2 py-1 rounded-md border border-indigo-500/30 transition-colors"
                                                    >
                                                        {isPolishing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                        AI Polish
                                                    </button>
                                                </div>
                                                <input 
                                                    value={editTitle}
                                                    onChange={e => setEditTitle(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    placeholder="Goal Title"
                                                    autoFocus
                                                />
                                                <textarea 
                                                    value={editDescription}
                                                    onChange={e => setEditDescription(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                                                    placeholder="Description"
                                                />
                                                <div className="flex gap-2 flex-wrap">
                                                    <button 
                                                        onClick={() => saveEdit(goal.id)} 
                                                        disabled={isSaving} 
                                                        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors"
                                                    >
                                                        <Save size={16} /> Save
                                                    </button>
                                                    <button 
                                                        onClick={cancelEditing} 
                                                        disabled={isSaving} 
                                                        className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors"
                                                    >
                                                        <X size={16} /> Cancel
                                                    </button>
                                                    <div className="flex-1"></div>
                                                    <button 
                                                        onClick={() => handleDeleteGoal(goal.id)} 
                                                        disabled={isSaving} 
                                                        className="flex items-center gap-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-500 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-red-900/30"
                                                    >
                                                        <Trash2 size={16} /> Delete Protocol
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
                                                                <CheckCircle size={12} />
                                                                COMPLETED
                                                            </span>
                                                        )}
                                                    </h3>
                                                    <button 
                                                        onClick={() => startEditing(goal)} 
                                                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-indigo-400 transition-opacity p-1"
                                                        title="Edit Goal"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                </div>
                                                <p className="text-slate-400 text-sm mt-1 whitespace-pre-wrap">{goal.description}</p>
                                            </div>
                                        )}

                                        <div className="flex flex-col items-end gap-3 ml-4">
                                            <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-mono text-indigo-400 whitespace-nowrap border border-slate-700">
                                                Diff: {goal.difficultyRating}/10
                                            </div>
                                            <button 
                                                onClick={() => toggleGoal(goal.id)}
                                                className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                                title={isCollapsed ? "Expand Protocol" : "Collapse Protocol"}
                                            >
                                                {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Progress Summary (Visible when collapsed) */}
                                    {isCollapsed && (
                                        <div 
                                            onClick={() => toggleGoal(goal.id)}
                                            className="mt-2 flex items-center justify-between text-xs text-slate-500 bg-slate-950/30 p-2 rounded-lg border border-slate-800/50 cursor-pointer hover:bg-slate-950/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-indigo-300/70">{completedMilestones}/{totalMilestones} Milestones</span>
                                                <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${goal.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <span className="text-slate-600 group-hover:text-slate-400 transition-colors">Show details</span>
                                        </div>
                                    )}

                                    {/* Milestones & Input */}
                                    {!isCollapsed && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-3 mt-6 border-t border-slate-800 pt-6">
                                                {goal.milestones.length === 0 && <p className="text-slate-600 text-sm">No milestones defined yet.</p>}
                                                
                                                {goal.milestones.map(milestone => (
                                                    <MilestoneItem 
                                                        key={milestone.id} 
                                                        milestone={milestone} 
                                                        onUpdate={loadGoals}
                                                        onReward={handleReward}
                                                    />
                                                ))}
                                            </div>

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
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;