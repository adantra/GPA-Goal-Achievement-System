import { Goal, DifficultyRating, RewardType, ActionType, Milestone } from '../types';

export interface UserProfile {
    age?: number;
    gender?: string;
    occupation?: string;
    goals?: string; // General life goals/aspirations
    challenges?: string; // Current challenges or struggles
    bio?: string; // Additional context
}

export interface User {
    id: string;
    username: string;
    // In a real app, never store passwords in plain text!
    password: string;
    profile?: UserProfile;
}

const USERS_KEY = 'gpa_users';
const SESSION_KEY = 'gpa_session';

export const getCurrentUser = (): User | null => {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
};

export const login = async (username: string, password: string): Promise<User> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const usersStr = localStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];

    // Case-insensitive username match
    const user = users.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.password === password
    );
    
    if (!user) {
        throw new Error("Invalid neural signature (username or password incorrect).");
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
};

export const register = async (username: string, password: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const usersStr = localStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];

    // Case-insensitive check for existing user
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        throw new Error("Neural ID already occupied.");
    }

    const newUser: User = {
        id: crypto.randomUUID(),
        username,
        password
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));

    return newUser;
};

export const loginAsDemo = async (): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    const demoUser: User = {
        id: 'demo-neural-architect',
        username: 'Neural_Architect_Demo',
        password: 'demo'
    };

    // Helper to generate dynamic dates
    const daysFromNow = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
    };
    
    // Helper to generate comments
    const createComment = (text: string, daysAgo: number = 0) => {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        return {
            id: crypto.randomUUID(),
            text,
            createdAt: d.toISOString()
        };
    };

    // Construct Demo Data with comprehensive life aspects
    const demoGoals: Goal[] = [
        // 1. PHYSICAL (EXERCISE)
        {
            id: 'demo-goal-1',
            title: 'Somatic Architecture: Hypertrophy Phase 1',
            description: 'Systematic reconstruction of muscle tissue through progressive overload. Goal is to increase lean mass by 2kg while maintaining mobility.',
            difficultyRating: 7,
            status: 'active',
            milestones: [
                {
                    id: 'm1-1',
                    goalId: 'demo-goal-1',
                    title: 'Week 1: Neuromuscular Wake-up',
                    isCompleted: true,
                    rewardReceived: RewardType.STANDARD,
                    deadline: daysFromNow(-7), // Completed last week
                    actions: [
                        { id: 'a1-1', description: 'Train 4 days per week (Upper/Lower split)', type: ActionType.GO },
                        { id: 'a1-2', description: 'No missed protein targets (180g daily)', type: ActionType.NO_GO }
                    ],
                    comments: [
                        createComment("Felt surprisingly strong on the squats.", 8),
                        createComment("Missed protein on Tuesday but made up for it Wed.", 7)
                    ]
                },
                {
                    id: 'm1-2',
                    goalId: 'demo-goal-1',
                    title: 'Week 2: Volume Accumulation',
                    isCompleted: true,
                    rewardReceived: RewardType.NONE, // RPE didn't hit
                    deadline: daysFromNow(-1), // Completed yesterday
                    actions: [
                        { id: 'a1-3', description: 'Increase reps by 1-2 on compound lifts', type: ActionType.GO },
                        { id: 'a1-4', description: 'Do not scroll phone during rest periods', type: ActionType.NO_GO }
                    ],
                    comments: []
                },
                {
                    id: 'm1-3',
                    goalId: 'demo-goal-1',
                    title: 'Week 3: Intensity Peak',
                    isCompleted: false,
                    rewardReceived: RewardType.NONE,
                    deadline: daysFromNow(6), // Due next week
                    actions: [
                        { id: 'a1-5', description: 'Hit failure on final set of isolation exercises', type: ActionType.GO },
                        { id: 'a1-6', description: 'Avoid alcohol completely to maximize recovery', type: ActionType.NO_GO }
                    ],
                    comments: []
                }
            ]
        },
        // 2. MEDITATION / MINDFULNESS
        {
            id: 'demo-goal-5',
            title: 'Cortical Thickening: Mindfulness Protocol',
            description: 'Daily training of the anterior cingulate cortex to improve focus, reduce amygdala reactivity, and enhance emotional regulation.',
            difficultyRating: 6,
            status: 'active',
            milestones: [
                {
                    id: 'm5-1',
                    goalId: 'demo-goal-5',
                    title: 'The 10-Minute Baseline',
                    isCompleted: false,
                    rewardReceived: RewardType.NONE,
                    deadline: daysFromNow(0), // Due today
                    actions: [
                        { id: 'a5-1', description: 'Practice 10m of NSDR (Non-Sleep Deep Rest) or breath focus daily', type: ActionType.GO },
                        { id: 'a5-2', description: 'No guided apps with background music (silence/voice only)', type: ActionType.NO_GO }
                    ],
                    comments: [
                        createComment("Struggled to sit still today. Too much caffeine.", 0)
                    ]
                }
            ]
        },
        // 3. COGNITIVE / CAREER
        {
            id: 'demo-goal-2',
            title: 'Deep Work: Cognitive Optimization',
            description: 'Retraining the dopamine baseline to sustain 4 hours of high-focus output daily. Eliminating "snacking" on low-value information.',
            difficultyRating: 8,
            status: 'active',
            milestones: [
                {
                    id: 'm2-1',
                    goalId: 'demo-goal-2',
                    title: 'The Digital Detox Weekend',
                    isCompleted: true,
                    rewardReceived: RewardType.JACKPOT,
                    deadline: daysFromNow(-14),
                    actions: [
                        { id: 'a2-1', description: '24 hours without screens (Saturday)', type: ActionType.GO },
                        { id: 'a2-2', description: 'No checking email before noon', type: ActionType.NO_GO }
                    ],
                    comments: []
                },
                {
                    id: 'm2-2',
                    goalId: 'demo-goal-2',
                    title: 'Protocol: Monk Mode Mornings',
                    isCompleted: false,
                    rewardReceived: RewardType.NONE,
                    deadline: daysFromNow(-2), // Overdue!
                    actions: [
                        { id: 'a2-3', description: 'Write 1000 words before breakfast', type: ActionType.GO },
                        { id: 'a2-4', description: 'Phone must remain in another room until 10 AM', type: ActionType.NO_GO }
                    ],
                    comments: []
                }
            ]
        },
        // 4. RESTORATIVE / BIOLOGICAL
        {
            id: 'demo-goal-3',
            title: 'Circadian Rhythm Synchronization',
            description: 'Optimizing sleep architecture to regulate cortisol and melatonin. Sleep is the foundation of neuroplasticity.',
            difficultyRating: 6,
            status: 'active',
            milestones: [
                {
                    id: 'm3-1',
                    goalId: 'demo-goal-3',
                    title: 'Phase 1: Solar Calibration',
                    isCompleted: true,
                    rewardReceived: RewardType.STANDARD,
                    deadline: daysFromNow(-20),
                    actions: [
                        { id: 'a3-1', description: 'View 10m of direct sunlight within 30m of waking', type: ActionType.GO },
                        { id: 'a3-2', description: 'No sunglasses during morning walk', type: ActionType.NO_GO }
                    ],
                    comments: []
                },
                {
                    id: 'm3-2',
                    goalId: 'demo-goal-3',
                    title: 'Phase 2: The Sunset Rule',
                    isCompleted: false,
                    rewardReceived: RewardType.NONE,
                    deadline: daysFromNow(5),
                    actions: [
                        { id: 'a3-3', description: 'Wear blue-light blocking glasses after 8 PM', type: ActionType.GO },
                        { id: 'a3-4', description: 'No overhead lights on after sunset', type: ActionType.NO_GO }
                    ],
                    comments: []
                }
            ]
        },
        // 5. LEARNING / SKILL
        {
            id: 'demo-goal-4',
            title: 'Neural Linguistic Programming: Spanish',
            description: 'Acquisition of a second language to enhance cognitive flexibility and executive function. Focusing on high-frequency vocabulary.',
            difficultyRating: 7,
            status: 'active',
            milestones: [
                {
                    id: 'm4-1',
                    goalId: 'demo-goal-4',
                    title: 'Vocab Upload: The First 500',
                    isCompleted: true,
                    rewardReceived: RewardType.NONE,
                    deadline: daysFromNow(-3),
                    actions: [
                        { id: 'a4-1', description: 'Review Anki deck for 20 mins daily', type: ActionType.GO },
                        { id: 'a4-2', description: 'No skipping days (maintain streak)', type: ActionType.NO_GO }
                    ],
                    comments: []
                }
            ]
        }
    ];

    // Inject Demo Data
    localStorage.setItem(SESSION_KEY, JSON.stringify(demoUser));
    localStorage.setItem(`gpa_data_${demoUser.id}_goals`, JSON.stringify(demoGoals));
    
    // Add a demo amygdala text
    localStorage.setItem(`gpa_data_${demoUser.id}_amygdala`, "If I continue to drift, I will wake up in five years to a stranger in the mirror—softer, slower, and filled with the quiet desperation of unfulfilled potential. The comfort I seek now is the architect of my future misery.");

    return demoUser;
};

export const updateUserProfile = async (profile: UserProfile): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
        throw new Error("No user logged in");
    }
    
    // Update user in users list
    const usersStr = localStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex !== -1) {
        users[userIndex].profile = profile;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
    
    // Update session
    const updatedUser = { ...currentUser, profile };
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
    
    return updatedUser;
};

export const logout = () => {
    localStorage.removeItem(SESSION_KEY);
};