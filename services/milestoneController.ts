import { Milestone, RewardType, Action } from '../types';
import { addMilestoneToGoal, updateMilestoneInGoal, getGoals } from './goalController';
import { getCurrentUser } from './auth';

// Helper to get all milestones from all goals (since we nested them in goals for storage simplicity)
// In a relational DB, these would be separate tables. Here we just query the goals structure.
const getAllMilestones = async (): Promise<Milestone[]> => {
    const goals = await getGoals();
    return goals.flatMap(g => g.milestones);
};

/**
 * Simulates POST /milestones
 */
export const createMilestone = async (goalId: string, title: string, actions: Omit<Action, 'id'>[]): Promise<Milestone> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    // --- GO/NO-GO OBLIGATION VALIDATION ---
    const hasGo = actions.some(a => a.type === 'GO');
    const hasNoGo = actions.some(a => a.type === 'NO_GO');

    if (!hasGo || !hasNoGo) {
        throw new Error("Neuro-Protocol Violation: Go/No-Go Obligation. Every milestone must have at least one Action to Take (Go) and one Action to Avoid (No-Go).");
    }

    const newMilestone: Milestone = {
        id: crypto.randomUUID(),
        goalId,
        title,
        isCompleted: false,
        rewardReceived: RewardType.NONE,
        actions: actions.map(a => ({ ...a, id: crypto.randomUUID() }))
    };

    // Save to Goal structure (Storage source of truth)
    await addMilestoneToGoal(goalId, newMilestone);

    return newMilestone;
};

/**
 * Simulates PUT /milestones/:id/complete
 * Implements Reward Prediction Error (RPE) - Variable Ratio Schedule
 */
export const completeMilestone = async (id: string): Promise<{ milestone: Milestone, message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    const milestones = await getAllMilestones();
    const milestone = milestones.find(m => m.id === id);

    if (!milestone) {
        throw new Error("Milestone not found");
    }
    
    if (milestone.isCompleted) {
         return { milestone, message: "Already completed." };
    }

    // --- REWARD PREDICTION ERROR (RPE) ---
    // Variable Ratio Schedule: ~15% chance of Jackpot
    const isJackpot = Math.random() < 0.15;
    const reward = isJackpot ? RewardType.JACKPOT : RewardType.STANDARD;

    const updatedMilestone = {
        ...milestone,
        isCompleted: true,
        rewardReceived: reward
    };

    // Update storage via Goal controller
    await updateMilestoneInGoal(milestone.goalId, updatedMilestone);

    return {
        milestone: updatedMilestone,
        message: isJackpot 
            ? "JACKPOT REWARD TRIGGERED! Unexpected dopamine release maximized." 
            : "Standard completion recorded. Keep pushing."
    };
};
