import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Goal } from '../types';
import { getGoals } from '../services/goalController';
import { getCurrentUser, logout } from '../services/auth';
import { exportUserData, importUserData } from '../services/dataManagement';
import CreateGoalForm from './CreateGoalForm';
import { Loader2, Keyboard } from 'lucide-react';
import SpaceTimePlayer from './SpaceTimePlayer';
import ForeshadowingFailureModal from './ForeshadowingFailureModal';
import NeuralAssistant from './NeuralAssistant';
import ScheduleGenerator from './ScheduleGenerator';
import GoalAuditModal from './GoalAuditModal';
import UserProfileModal from './UserProfileModal';
import WeeklyReviewModal from './WeeklyReviewModal';

// Sub-components
import DashboardHeader from './dashboard/DashboardHeader';
import NeuroToolsSidebar from './dashboard/NeuroToolsSidebar';
import GoalToolbar from './dashboard/GoalToolbar';
import GoalCard from './dashboard/GoalCard';
import FocusMode from './dashboard/FocusMode';
import KeyboardShortcutsModal from './dashboard/KeyboardShortcutsModal';

// Custom hooks
import { useZoom } from '../hooks/useZoom';
import { useGoalEditor } from '../hooks/useGoalEditor';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface Props {
    onLogout: () => void;
}

const Dashboard: React.FC<Props> = ({ onLogout }) => {
    // ── Core Data ──────────────────────────────────────────────
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const currentUser = getCurrentUser();

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

    useEffect(() => { loadGoals(); }, []);

    // ── Modal State ────────────────────────────────────────────
    const [showSpaceTime, setShowSpaceTime] = useState(false);
    const [showAmygdala, setShowAmygdala] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);
    const [showAudit, setShowAudit] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showWeeklyReview, setShowWeeklyReview] = useState(false);
    const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

    // ── Focus & Search ─────────────────────────────────────────
    const [focusedGoalId, setFocusedGoalId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // ── View State ─────────────────────────────────────────────
    const [isGridView, setIsGridView] = useState(false);
    const [collapsedGoals, setCollapsedGoals] = useState<Set<string>>(new Set());
    const [rewardMessage, setRewardMessage] = useState<string | null>(null);

    // ── Assistant State ────────────────────────────────────────
    const [showAssistant, setShowAssistant] = useState(false);
    const [assistantContext, setAssistantContext] = useState<{
        title: string;
        description: string;
        mode: 'creation' | 'edition' | 'idle';
    }>({ title: '', description: '', mode: 'idle' });

    // ── Import State ───────────────────────────────────────────
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    // ── Refs for keyboard shortcuts ────────────────────────────
    const searchInputRef = useRef<HTMLInputElement>(null);
    const createGoalRef = useRef<HTMLDivElement>(null);

    // ── Custom Hooks ───────────────────────────────────────────
    const { zoomLevel, handleZoomIn, handleZoomOut, handleZoomReset } = useZoom();

    const editor = useGoalEditor({
        loadGoals,
        showAssistant,
        setAssistantContext,
    });

    useKeyboardShortcuts({
        goals,
        focusedGoalId,
        editingGoalId: editor.editingGoalId,
        modals: {
            showSpaceTime,
            showAmygdala,
            showSchedule,
            showAudit,
            showProfile,
            showWeeklyReview,
            showAssistant,
            showKeyboardHelp,
        },
        setShowSpaceTime,
        setShowAmygdala,
        setShowSchedule,
        setShowAudit,
        setShowProfile,
        setShowWeeklyReview,
        setShowAssistant,
        setShowKeyboardHelp,
        setFocusedGoalId,
        setAssistantContext,
        cancelEditing: editor.cancelEditing,
        startEditing: editor.startEditing,
        searchInputRef,
        createGoalRef,
    });

    // ── Derived Data ───────────────────────────────────────────
    const allTags = useMemo(
        () => Array.from(new Set(goals.flatMap(g => g.tags || []))),
        [goals]
    );

    const filteredGoals = useMemo(() => {
        return goals.filter(goal => {
            const matchesSearch = !searchQuery || 
                goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                goal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                goal.milestones.some(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()));
            
            const matchesTags = selectedTags.length === 0 ||
                selectedTags.every(selectedTag => goal.tags?.includes(selectedTag));
            
            return matchesSearch && matchesTags;
        });
    }, [goals, searchQuery, selectedTags]);

    // ── Handlers ───────────────────────────────────────────────
    const handleReward = (message: string) => {
        setRewardMessage(message);
        setTimeout(() => setRewardMessage(null), 4000);
    };

    const handleLogout = () => { logout(); onLogout(); };

    const handleExport = () => {
        if (currentUser) exportUserData(currentUser);
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

    const openAssistant = (title: string, description: string, mode: 'creation' | 'edition') => {
        setAssistantContext({ title, description, mode });
        setShowAssistant(true);
    };

    const toggleGoal = (id: string) => {
        const next = new Set(collapsedGoals);
        next.has(id) ? next.delete(id) : next.add(id);
        setCollapsedGoals(next);
    };

    const toggleGridView = () => {
        const nextState = !isGridView;
        setIsGridView(nextState);
        setCollapsedGoals(nextState ? new Set(goals.map(g => g.id)) : new Set());
    };

    const collapseAll = () => setCollapsedGoals(new Set(goals.map(g => g.id)));
    const expandAll = () => setCollapsedGoals(new Set());

    const handleToggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    // ── Full-screen modes ──────────────────────────────────────
    if (showSpaceTime) {
        return <SpaceTimePlayer onClose={() => setShowSpaceTime(false)} />;
    }

    if (focusedGoalId) {
        const focusedGoal = goals.find(g => g.id === focusedGoalId);
        if (!focusedGoal) { setFocusedGoalId(null); return null; }

        return (
            <FocusMode
                goal={focusedGoal}
                editor={editor}
                rewardMessage={rewardMessage}
                onExit={() => setFocusedGoalId(null)}
                onOpenAssistant={openAssistant}
                onReward={handleReward}
                loadGoals={loadGoals}
            />
        );
    }

    // ── Main Dashboard Layout ──────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8 relative overflow-x-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none fixed"></div>

            {/* Persistent Assistant */}
            <NeuralAssistant 
                isOpen={showAssistant} 
                onClose={() => setShowAssistant(false)}
                contextData={assistantContext}
            />
            
            {/* Modal Layer */}
            {showSchedule && <ScheduleGenerator goals={goals} onClose={() => setShowSchedule(false)} />}
            {showAudit && <GoalAuditModal goals={goals} onClose={() => setShowAudit(false)} />}
            {showWeeklyReview && <WeeklyReviewModal goals={goals} onClose={() => setShowWeeklyReview(false)} />}
            {showProfile && (
                <UserProfileModal 
                    isOpen={showProfile} 
                    onClose={() => setShowProfile(false)}
                    onUpdate={() => {
                        const user = getCurrentUser();
                        if (user) setShowProfile(false);
                    }}
                />
            )}

            {/* Reward Banner */}
            {rewardMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-bounce">
                    <div className={`px-6 py-4 rounded-xl font-bold shadow-2xl border ${rewardMessage.includes('JACKPOT') ? 'bg-yellow-500 text-black border-yellow-300' : 'bg-indigo-600 text-white border-indigo-400'}`}>
                        {rewardMessage}
                    </div>
                </div>
            )}

            {showAmygdala && <ForeshadowingFailureModal mode="view" onUnlock={() => setShowAmygdala(false)} />}
            {showKeyboardHelp && <KeyboardShortcutsModal onClose={() => setShowKeyboardHelp(false)} />}

            {/* Grid Layout */}
            <div className="max-w-[1800px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 transition-all duration-500">
                
                {/* ── Left Sidebar ── */}
                <div className="lg:col-span-4 xl:col-span-3">
                    <div className="lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto custom-scrollbar lg:pr-2 space-y-8 pb-8">
                        <DashboardHeader
                            currentUser={currentUser}
                            isImporting={isImporting}
                            fileInputRef={fileInputRef}
                            onImport={handleImport}
                            onExport={handleExport}
                            onLogout={handleLogout}
                            onEditProfile={() => setShowProfile(true)}
                        />

                        <NeuroToolsSidebar
                            onShowAudit={() => setShowAudit(true)}
                            onShowWeeklyReview={() => setShowWeeklyReview(true)}
                            onShowSpaceTime={() => setShowSpaceTime(true)}
                            onShowAmygdala={() => setShowAmygdala(true)}
                            onShowSchedule={() => setShowSchedule(true)}
                        />

                        <div ref={createGoalRef}>
                            <CreateGoalForm onGoalCreated={loadGoals} onOpenAssistant={(t, d) => openAssistant(t, d, 'creation')} />
                        </div>
                    </div>
                </div>

                {/* ── Main Content ── */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                    <GoalToolbar
                        goalCount={goals.length}
                        zoomLevel={zoomLevel}
                        isGridView={isGridView}
                        searchQuery={searchQuery}
                        selectedTags={selectedTags}
                        allTags={allTags}
                        searchInputRef={searchInputRef}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        onZoomReset={handleZoomReset}
                        onShowKeyboardHelp={() => setShowKeyboardHelp(true)}
                        onExpandAll={expandAll}
                        onCollapseAll={collapseAll}
                        onToggleGridView={toggleGridView}
                        onSearchChange={setSearchQuery}
                        onToggleTag={handleToggleTag}
                        onClearTags={() => setSelectedTags([])}
                    />
                    
                    {loading ? (
                        <div className="text-slate-500 animate-pulse flex items-center gap-2"><Loader2 className="animate-spin" /> Loading neural pathways...</div>
                    ) : goals.length === 0 ? (
                        <div className="text-slate-500 italic p-8 border border-dashed border-slate-800 rounded-2xl text-center">
                            No active protocols found. Define a new goal in the left panel to begin.
                        </div>
                    ) : filteredGoals.length === 0 ? (
                        <div className="text-slate-500 italic p-8 border border-dashed border-slate-800 rounded-2xl text-center">
                            No goals match your filters. Try adjusting your search or filters.
                        </div>
                    ) : (
                        <div className={`grid gap-6 items-start transition-all duration-300 ease-in-out ${
                            isGridView 
                            ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                            : 'grid-cols-1 2xl:grid-cols-2'
                        }`}>
                            {filteredGoals.map(goal => (
                                <GoalCard
                                    key={goal.id}
                                    goal={goal}
                                    isCollapsed={collapsedGoals.has(goal.id)}
                                    editor={editor}
                                    onToggleCollapse={toggleGoal}
                                    onFocus={setFocusedGoalId}
                                    onOpenAssistant={openAssistant}
                                    onReward={handleReward}
                                    loadGoals={loadGoals}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Floating Keyboard Hint */}
            <div className="fixed bottom-6 right-6 z-30">
                <button
                    onClick={() => setShowKeyboardHelp(true)}
                    className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-sm hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/50 px-4 py-2.5 rounded-xl shadow-lg transition-all hover:scale-105 group"
                    title="View Keyboard Shortcuts"
                >
                    <Keyboard size={16} className="text-slate-400 group-hover:text-indigo-400 transition" />
                    <span className="text-xs font-medium text-slate-400 group-hover:text-white transition">
                        Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs font-mono ml-1">?</kbd> for shortcuts
                    </span>
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
