import { Goal, DifficultyRating } from '../types';
import { getCurrentUser } from './auth';

const getStorageKey = () => {
    const user = getCurrentUser();
    if (!user) throw new Error("Unauthorized: No neural link established.");
    return `gpa_data_${user.id}_goals`;
};

// Helper to read from storage
const readGoals = (): Goal[] => {
    try {
        const data = localStorage.getItem(getStorageKey());
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
};

// Helper to write to storage
const saveGoals = (goals: Goal[]) => {
    localStorage.setItem(getStorageKey(), JSON.stringify(goals));
};

/**
 * Simulates POST /goals
 * Enforces The Goldilocks Rule: Rating must be between 6 and 8.
 */
export const createGoal = async (data: Omit<Goal, 'id' | 'status' | 'milestones'>): Promise<Goal> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // --- GOLDILOCKS RULE VALIDATION ---
    // Reject 1-5 (Too Easy/Boring) and 9-10 (Too Lofty/Anxiety)
    if (data.difficultyRating < 6 || data.difficultyRating > 8) {
        throw new Error("Neuro-Protocol Violation: The Goldilocks Rule. Goals must be moderately difficult (6-8) to sustain dopamine pursuit.");
    }

    const newGoal: Goal = {
        id: crypto.randomUUID(),
        title: data.title,
        description: data.description,
        difficultyRating: data.difficultyRating,
        status: 'active',
        milestones: []
    };

    const goals = readGoals();
    goals.push(newGoal);
    saveGoals(goals);

    return newGoal;
};

/**
 * Simulates GET /goals
 */
export const getGoals = async (): Promise<Goal[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return readGoals();
};

export const addMilestoneToGoal = async (goalId: string, milestone: any) => {
     const goals = readGoals();
     const goal = goals.find(g => g.id === goalId);
     if (goal) {
         goal.milestones.push(milestone);
         
         // If a new incomplete milestone is added, the goal is active again
         if (!milestone.isCompleted) {
             goal.status = 'active';
         }
         
         saveGoals(goals);
     }
}

export const updateMilestoneInGoal = async (goalId: string, milestone: any) => {
    const goals = readGoals();
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
        const mIndex = goal.milestones.findIndex(m => m.id === milestone.id);
        if (mIndex !== -1) {
            goal.milestones[mIndex] = milestone;

            // Check if all milestones are completed
            const allCompleted = goal.milestones.length > 0 && goal.milestones.every(m => m.isCompleted);
            
            if (allCompleted) {
                goal.status = 'completed';
            } else {
                goal.status = 'active';
            }

            saveGoals(goals);
        }
    }
}