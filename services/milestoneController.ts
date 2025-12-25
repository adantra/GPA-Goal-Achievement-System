import { Milestone, RewardType, Action, Comment, CommentType } from '../types';
import { addMilestoneToGoal, updateMilestoneInGoal, getGoals, removeMilestoneFromGoal } from './goalController';
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
export const createMilestone = async (goalId: string, title: string, deadline: string, actions: Omit<Action, 'id'>[]): Promise<Milestone> => {
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
        deadline,
        isCompleted: false,
        rewardReceived: RewardType.NONE,
        actions: actions.map(a => ({ ...a, id: crypto.randomUUID() })),
        comments: []
    };

    // Save to Goal structure (Storage source of truth)
    await addMilestoneToGoal(goalId, newMilestone);

    return newMilestone;
};

/**
 * Updates an existing milestone.
 */
export const updateMilestone = async (id: string, updates: Partial<Pick<Milestone, 'title' | 'actions' | 'deadline'>>): Promise<Milestone> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    const milestones = await getAllMilestones();
    const milestone = milestones.find(m => m.id === id);

    if (!milestone) {
        throw new Error("Milestone not found");
    }

    const updatedMilestone = {
        ...milestone,
        ...updates
    };

    // Validate GO/NO-GO if actions are updated
    if (updates.actions) {
         const hasGo = updates.actions.some(a => a.type === 'GO');
         const hasNoGo = updates.actions.some(a => a.type === 'NO_GO');
         if (!hasGo || !hasNoGo) {
            throw new Error("Neuro-Protocol Violation: Must have at least one GO and one NO-GO action.");
         }
    }

    // Update storage via Goal controller
    await updateMilestoneInGoal(milestone.goalId, updatedMilestone);

    return updatedMilestone;
};

/**
 * Deletes a milestone.
 */
export const deleteMilestone = async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const milestones = await getAllMilestones();
    const milestone = milestones.find(m => m.id === id);
    
    if (milestone) {
        await removeMilestoneFromGoal(milestone.goalId, id);
    }
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

export const addComment = async (milestoneId: string, text: string, type: CommentType = 'log'): Promise<Comment> => {
    const milestones = await getAllMilestones();
    const milestone = milestones.find(m => m.id === milestoneId);
    if (!milestone) throw new Error("Milestone not found");

    const newComment: Comment = {
        id: crypto.randomUUID(),
        text,
        type,
        createdAt: new Date().toISOString()
    };
    
    const updatedMilestone = {
        ...milestone,
        comments: [...(milestone.comments || []), newComment]
    };
    
    await updateMilestoneInGoal(milestone.goalId, updatedMilestone);
    return newComment;
};

export const deleteComment = async (milestoneId: string, commentId: string): Promise<void> => {
    const milestones = await getAllMilestones();
    const milestone = milestones.find(m => m.id === milestoneId);
    if (!milestone) throw new Error("Milestone not found");

    const updatedMilestone = {
        ...milestone,
        comments: (milestone.comments || []).filter(c => c.id !== commentId)
    };

    await updateMilestoneInGoal(milestone.goalId, updatedMilestone);
};