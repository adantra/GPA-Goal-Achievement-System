import React, { useState, useEffect } from 'react';
import { Goal, Milestone, RewardType } from '../types';
import { getGoals } from '../services/goalController';
import { completeMilestone } from '../services/milestoneController';
import { getCurrentUser, logout } from '../services/auth';
import { exportUserData } from '../services/dataManagement';
import CreateGoalForm from './CreateGoalForm';
import MilestoneInput from './MilestoneInput';
import { Trophy, Activity, BrainCircuit, LogOut, User as UserIcon, DownloadCloud, CheckCircle } from 'lucide-react';
import SpaceTimePlayer from './SpaceTimePlayer';

interface Props {
    onLogout: () => void;
}

const Dashboard: React.FC<Props> = ({ onLogout }) => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
    const [showSpaceTime, setShowSpaceTime] = useState(false);
    const [rewardMessage, setRewardMessage] = useState<string | null>(null);
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

    useEffect(() => {
        loadGoals();
    }, []);

    const handleCompleteMilestone = async (id: string) => {
        try {
            const { message, milestone } = await completeMilestone(id);
            // Show reward message (RPE)
            setRewardMessage(message);
            setTimeout(() => setRewardMessage(null), 4000);
            
            // Refresh goals to show update
            loadGoals();
        } catch (error) {
            console.error(error);
        }
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

    if (showSpaceTime) {
        return <SpaceTimePlayer onClose={() => setShowSpaceTime(false)} />;
    }

    return (
        <div className="min-h-screen bg-slate-950 p-6 md:p-12 relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

            {/* Reward Toast */}
            {rewardMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-bounce">
                    <div className={`px-6 py-4 rounded-xl font-bold shadow-2xl border ${rewardMessage.includes('JACKPOT') ? 'bg-yellow-500 text-black border-yellow-300' : 'bg-indigo-600 text-white border-indigo-400'}`}>
                        {rewardMessage}
                    </div>
                </div>
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
                         <button 
                            onClick={() => setShowSpaceTime(true)}
                            className="w-full py-3 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 rounded-lg transition flex items-center justify-center gap-2"
                         >
                             <Activity size={18} />
                             Launch Space-Time Bridge
                         </button>
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
                        goals.map(goal => (
                            <div key={goal.id} className={`bg-slate-900 border ${goal.status === 'completed' ? 'border-emerald-500/50 shadow-emerald-900/20 shadow-lg' : 'border-slate-800'} rounded-2xl p-6 hover:border-indigo-900/50 transition-all`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                            {goal.title}
                                            {goal.status === 'completed' && (
                                                <span className="flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                    <CheckCircle size={12} />
                                                    COMPLETED
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-slate-400 text-sm mt-1">{goal.description}</p>
                                    </div>
                                    <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-mono text-indigo-400">
                                        Rating: {goal.difficultyRating}/10
                                    </div>
                                </div>

                                {/* Milestones */}
                                <div className="space-y-3 mt-6">
                                    {goal.milestones.length === 0 && <p className="text-slate-600 text-sm">No milestones defined yet.</p>}
                                    
                                    {goal.milestones.map(milestone => (
                                        <div key={milestone.id} className={`p-4 rounded-xl border flex justify-between items-center ${milestone.isCompleted ? 'bg-slate-900/50 border-slate-800 opacity-50' : 'bg-slate-800 border-slate-700'}`}>
                                            <div>
                                                <h4 className={`font-semibold ${milestone.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                                    {milestone.title}
                                                </h4>
                                                <div className="flex gap-2 text-xs mt-1">
                                                    <span className="text-emerald-400">GO: {milestone.actions.filter(a => a.type === 'GO').length}</span>
                                                    <span className="text-red-400">NO-GO: {milestone.actions.filter(a => a.type === 'NO_GO').length}</span>
                                                </div>
                                            </div>

                                            {milestone.isCompleted ? (
                                                <div className="flex items-center gap-2 text-yellow-500 text-sm font-bold">
                                                    <Trophy size={16} />
                                                    {milestone.rewardReceived === RewardType.JACKPOT ? 'JACKPOT' : 'Complete'}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleCompleteMilestone(milestone.id)}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition"
                                                >
                                                    Complete
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <MilestoneInput 
                                    goalId={goal.id} 
                                    goalTitle={goal.title}
                                    goalDescription={goal.description}
                                    onMilestoneCreated={loadGoals} 
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;