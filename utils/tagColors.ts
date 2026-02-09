/**
 * Shared tag color palette and hashing logic.
 * Used by GoalToolbar (filter pills) and GoalCard/FocusMode (display pills).
 */

export const TAG_COLORS = [
    'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30',
    'bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30',
    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30',
    'bg-pink-500/20 text-pink-300 border-pink-500/30 hover:bg-pink-500/30',
    'bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/30',
];

export function getTagColor(tag: string): string {
    const hash = String(tag).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return TAG_COLORS[hash % TAG_COLORS.length];
}
