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
        estimatedTimeframe: data.estimatedTimeframe,
        status: 'active',
        milestones: [],
        aiAssessment: data.aiAssessment
    };

    const goals = readGoals();
    goals.push(newGoal);
    saveGoals(goals);

    return newGoal;
};

/**
 * Updates an existing goal's title, description, or AI assessment.
 */
export const updateGoal = async (id: string, updates: Partial<Pick<Goal, 'title' | 'description' | 'aiAssessment'>>): Promise<Goal> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));

    const goals = readGoals();
    const index = goals.findIndex(g => g.id === id);

    if (index === -1) {
        throw new Error("Goal not found");
    }

    const goal = goals[index];
    const updatedGoal = {
        ...goal,
        ...updates
    };

    goals[index] = updatedGoal;
    saveGoals(goals);

    return updatedGoal;
};

/**
 * Deletes a goal and its associated data.
 */
export const deleteGoal = async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const goals = readGoals();
    const updatedGoals = goals.filter(g => g.id !== id);
    saveGoals(updatedGoals);
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

export const removeMilestoneFromGoal = async (goalId: string, milestoneId: string) => {
    const goals = readGoals();
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
        goal.milestones = goal.milestones.filter(m => m.id !== milestoneId);
        
        // If all remaining milestones are completed (and there are some), it stays completed
        // If there are no milestones, it's technically active awaiting milestones
        const allCompleted = goal.milestones.length > 0 && goal.milestones.every(m => m.isCompleted);
        
        goal.status = allCompleted ? 'completed' : 'active';
        
        saveGoals(goals);
    }
}