/**
 * Date Formatting Utilities
 * Provides human-readable relative date and time formatting
 */

/**
 * Formats a date relative to now (e.g., "2 days ago", "Just now", "In 3 days")
 */
export function formatRelativeDate(dateString: string | undefined): string {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    // Future dates (for deadlines)
    if (diffMs < 0) {
        const absDiffDays = Math.abs(diffDays);
        const absDiffHours = Math.abs(diffHours);
        const absDiffMins = Math.abs(diffMins);
        
        if (absDiffDays === 0 && absDiffHours === 0 && absDiffMins < 60) return 'Soon';
        if (absDiffDays === 0) return 'Today';
        if (absDiffDays === 1) return 'Tomorrow';
        if (absDiffDays <= 7) return `In ${absDiffDays} days`;
        if (absDiffDays <= 30) return `In ${Math.floor(absDiffDays / 7)} weeks`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    // Past dates
    if (diffSecs < 60) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffWeeks === 1) return '1 week ago';
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
    if (diffMonths === 1) return '1 month ago';
    if (diffMonths < 12) return `${diffMonths} months ago`;
    if (diffYears === 1) return '1 year ago';
    return `${diffYears} years ago`;
}

/**
 * Formats a deadline with contextual information
 * Returns object with text, color classes, and urgency indicator
 */
export interface DeadlineStatus {
    text: string;
    color: string;
    bg: string;
    icon: '🔴' | '🟠' | '🟡' | '🟢' | '📅' | '✓';
    urgency: 'overdue' | 'today' | 'urgent' | 'upcoming' | 'future' | 'completed';
}

export function formatDeadline(deadlineString: string | undefined, isCompleted: boolean = false): DeadlineStatus | null {
    if (!deadlineString) return null;
    if (isCompleted) {
        return {
            text: 'Completed',
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/30',
            icon: '✓',
            urgency: 'completed'
        };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(deadlineString);
    deadline.setHours(0, 0, 0, 0);
    
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        const overdueDays = Math.abs(diffDays);
        return {
            text: overdueDays === 1 ? 'Overdue by 1 day' : `Overdue by ${overdueDays} days`,
            color: 'text-red-400',
            bg: 'bg-red-500/10 border-red-500/30',
            icon: '🔴',
            urgency: 'overdue'
        };
    }
    
    if (diffDays === 0) {
        return {
            text: 'Due Today',
            color: 'text-orange-400',
            bg: 'bg-orange-500/10 border-orange-500/30',
            icon: '🟠',
            urgency: 'today'
        };
    }
    
    if (diffDays === 1) {
        return {
            text: 'Due Tomorrow',
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/10 border-yellow-500/30',
            icon: '🟡',
            urgency: 'urgent'
        };
    }
    
    if (diffDays <= 3) {
        return {
            text: `Due in ${diffDays} days`,
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/10 border-yellow-500/30',
            icon: '🟡',
            urgency: 'urgent'
        };
    }
    
    if (diffDays <= 7) {
        return {
            text: `Due in ${diffDays} days`,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10 border-blue-500/30',
            icon: '📅',
            urgency: 'upcoming'
        };
    }
    
    // For dates more than a week away, show the actual date
    const formattedDate = deadline.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric',
        year: deadline.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
    
    return {
        text: `Due ${formattedDate}`,
        color: 'text-slate-400',
        bg: 'bg-slate-700/30 border-slate-700',
        icon: '📅',
        urgency: 'future'
    };
}

/**
 * Gets calendar emoji based on day of week
 */
export function getCalendarEmoji(dateString: string | undefined): string {
    if (!dateString) return '📅';
    
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    
    // Return different calendar emojis based on context
    const emojis = ['📅', '📆', '🗓️'];
    return emojis[dayOfWeek % emojis.length];
}

/**
 * Checks if a date is stale (older than specified days)
 */
export function isDateStale(dateString: string | undefined, staleDays: number = 7): boolean {
    if (!dateString) return true;
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    return diffDays >= staleDays;
}

/**
 * Gets a color intensity based on how old something is
 * Useful for visual aging indicators
 */
export function getAgingColor(dateString: string | undefined, maxDays: number = 30): string {
    if (!dateString) return 'text-slate-600';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'text-emerald-400'; // Fresh - green
    if (diffDays <= 3) return 'text-blue-400'; // Recent - blue
    if (diffDays <= 7) return 'text-slate-400'; // Week old - neutral
    if (diffDays <= 14) return 'text-yellow-400'; // Getting stale - yellow
    if (diffDays <= 30) return 'text-orange-400'; // Stale - orange
    return 'text-red-400'; // Very stale - red
}

/**
 * Formats a date for display with icon
 * Used for timestamps, created dates, etc.
 */
export function formatDateWithIcon(dateString: string | undefined): { text: string; icon: string } {
    if (!dateString) {
        return { text: 'Never', icon: '⏱️' };
    }
    
    const relativeText = formatRelativeDate(dateString);
    const icon = getCalendarEmoji(dateString);
    
    return { text: relativeText, icon };
}

