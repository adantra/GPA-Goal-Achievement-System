export enum DifficultyRating {
  EASY = 1,
  MODERATE = 5,
  OPTIMAL_LOW = 6,
  OPTIMAL_HIGH = 8,
  IMPOSSIBLE = 10
}

export enum RewardType {
  NONE = 'none',
  STANDARD = 'standard',
  JACKPOT = 'jackpot'
}

export enum ActionType {
  GO = 'GO',
  NO_GO = 'NO_GO'
}

export interface Action {
  id: string;
  description: string;
  type: ActionType;
}

export type CommentType = 'log' | 'insight' | 'blocker' | 'win';

export interface Comment {
  id: string;
  text: string;
  type?: CommentType; // Optional for backward compatibility
  createdAt: string; // ISO Date String
}

export interface AIAssessment {
  estimatedRating: number;
  reasoning: string;
  suggestion: string;
  alternativeActions?: string[];
  estimatedTimeframe?: string; // e.g., "3-6 months", "2 weeks", "1 year"
  timeframeReasoning?: string; // Why this timeframe is realistic
  timestamp: string;
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  isCompleted: boolean;
  rewardReceived: RewardType;
  deadline?: string; // ISO Date String YYYY-MM-DD
  actions: Action[];
  comments: Comment[];
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  difficultyRating: number;
  estimatedTimeframe?: string; // User-defined or AI-suggested timeframe
  status: 'active' | 'completed' | 'archived';
  milestones: Milestone[];
  aiAssessment?: AIAssessment;
}

export interface SpaceTimePhase {
  name: string;
  duration: number; // in seconds
  description: string;
  color: string;
}

export const SPACE_TIME_PHASES: SpaceTimePhase[] = [
  { name: 'Internal', duration: 5, description: 'Focus on your internal sensations (breath, heart).', color: '#6366f1' }, // Indigo
  { name: 'Body', duration: 5, description: 'Focus on the surface of your skin and contact points.', color: '#3b82f6' }, // Blue
  { name: 'Near', duration: 5, description: 'Focus on the immediate space around you.', color: '#10b981' }, // Emerald
  { name: 'Far', duration: 5, description: 'Focus on the horizon or a distant object.', color: '#eab308' }, // Yellow
  { name: 'Broad', duration: 5, description: 'Focus on the entire globe/cosmos (bird\'s eye view).', color: '#a855f7' }, // Purple
  { name: 'Return', duration: 5, description: 'Return focus to your specific goal and self.', color: '#ef4444' } // Red
];