import { useState, useMemo, useCallback, useEffect } from 'react';
import { Goal } from '../types';

// ── Filter Types ──────────────────────────────────────────────

export type GoalSortKey = 'recent' | 'difficulty' | 'progress' | 'alpha' | 'created' | 'timeframe';
export type GoalSortDir = 'asc' | 'desc';
export type GoalStatusFilter = 'all' | 'active' | 'completed' | 'archived' | 'parked';

export interface AdvancedFilters {
    status: GoalStatusFilter;
    difficultyMin: number;
    difficultyMax: number;
    hasTimeframe: boolean | null;  // null = don't filter
    createdAfter: string;          // ISO date string or ''
    createdBefore: string;         // ISO date string or ''
}

export interface FilterPreset {
    id: string;
    name: string;
    icon: string;
    filters: AdvancedFilters;
    searchQuery: string;
    selectedTags: string[];
    sortKey: GoalSortKey;
    sortDir: GoalSortDir;
}

const DEFAULT_FILTERS: AdvancedFilters = {
    status: 'all',
    difficultyMin: 1,
    difficultyMax: 10,
    hasTimeframe: null,
    createdAfter: '',
    createdBefore: '',
};

// ── Built-in Presets ──────────────────────────────────────────

const BUILTIN_PRESETS: FilterPreset[] = [
    {
        id: '__needs_attention',
        name: 'Needs Attention',
        icon: '🔥',
        filters: { ...DEFAULT_FILTERS, status: 'active' },
        searchQuery: '',
        selectedTags: [],
        sortKey: 'recent',
        sortDir: 'asc', // oldest first = least recently worked on
    },
    {
        id: '__quick_wins',
        name: 'Quick Wins',
        icon: '⚡',
        filters: { ...DEFAULT_FILTERS, status: 'active', difficultyMin: 1, difficultyMax: 7 },
        searchQuery: '',
        selectedTags: [],
        sortKey: 'progress',
        sortDir: 'desc', // closest to done first
    },
    {
        id: '__hard_mode',
        name: 'Hard Mode',
        icon: '💪',
        filters: { ...DEFAULT_FILTERS, status: 'active', difficultyMin: 8, difficultyMax: 10 },
        searchQuery: '',
        selectedTags: [],
        sortKey: 'difficulty',
        sortDir: 'desc',
    },
];

const PRESETS_STORAGE_KEY = 'gpa_filter_presets';

// ── Hook ──────────────────────────────────────────────────────

export function useGoalFilters(goals: Goal[]) {
    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(DEFAULT_FILTERS);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Sort state
    const [sortKey, setSortKey] = useState<GoalSortKey>('recent');
    const [sortDir, setSortDir] = useState<GoalSortDir>('desc');

    // Preset state
    const [customPresets, setCustomPresets] = useState<FilterPreset[]>(() => {
        try {
            const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    // Persist custom presets
    useEffect(() => {
        localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(customPresets));
    }, [customPresets]);

    // All presets = builtin + custom
    const allPresets = useMemo(() => [...BUILTIN_PRESETS, ...customPresets], [customPresets]);

    // ── Derived data ──────────────────────────────────────────

    const allTags = useMemo(
        () => Array.from(new Set(goals.flatMap(g => g.tags || []))),
        [goals]
    );

    // ── Filter logic ──────────────────────────────────────────

    const filteredAndSortedGoals = useMemo(() => {
        // 1. Filter
        let result = goals.filter(goal => {
            // Exclude parked goals from main list (they have their own section)
            if (goal.status === 'parked') return false;

            // Text search
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchesSearch = 
                    goal.title.toLowerCase().includes(q) ||
                    goal.description.toLowerCase().includes(q) ||
                    goal.milestones.some(m => m.title.toLowerCase().includes(q));
                if (!matchesSearch) return false;
            }

            // Tags
            if (selectedTags.length > 0) {
                if (!selectedTags.every(tag => goal.tags?.includes(tag))) return false;
            }

            // Status
            if (advancedFilters.status !== 'all' && goal.status !== advancedFilters.status) return false;

            // Difficulty range
            if (goal.difficultyRating < advancedFilters.difficultyMin ||
                goal.difficultyRating > advancedFilters.difficultyMax) return false;

            // Timeframe
            if (advancedFilters.hasTimeframe === true && !goal.estimatedTimeframe) return false;
            if (advancedFilters.hasTimeframe === false && goal.estimatedTimeframe) return false;

            // Created after
            if (advancedFilters.createdAfter && goal.createdAt) {
                if (new Date(goal.createdAt) < new Date(advancedFilters.createdAfter)) return false;
            }

            // Created before
            if (advancedFilters.createdBefore && goal.createdAt) {
                if (new Date(goal.createdAt) > new Date(advancedFilters.createdBefore)) return false;
            }

            return true;
        });

        // 2. Sort
        result.sort((a, b) => {
            let cmp = 0;
            switch (sortKey) {
                case 'recent': {
                    const aTime = a.lastWorkedOn ? new Date(a.lastWorkedOn).getTime() : 0;
                    const bTime = b.lastWorkedOn ? new Date(b.lastWorkedOn).getTime() : 0;
                    cmp = aTime - bTime;
                    break;
                }
                case 'difficulty':
                    cmp = a.difficultyRating - b.difficultyRating;
                    break;
                case 'progress': {
                    const aProgress = a.milestones.length > 0
                        ? a.milestones.filter(m => m.isCompleted).length / a.milestones.length
                        : 0;
                    const bProgress = b.milestones.length > 0
                        ? b.milestones.filter(m => m.isCompleted).length / b.milestones.length
                        : 0;
                    cmp = aProgress - bProgress;
                    break;
                }
                case 'alpha':
                    cmp = a.title.localeCompare(b.title);
                    break;
                case 'created': {
                    const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    cmp = aCreated - bCreated;
                    break;
                }
                case 'timeframe':
                    cmp = (a.estimatedTimeframe || '').localeCompare(b.estimatedTimeframe || '');
                    break;
            }
            return sortDir === 'desc' ? -cmp : cmp;
        });

        return result;
    }, [goals, searchQuery, selectedTags, advancedFilters, sortKey, sortDir]);

    // Parked goals (separate list)
    const parkedGoals = useMemo(() => goals.filter(g => g.status === 'parked'), [goals]);

    // ── Active filter count (for badge) ───────────────────────
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (searchQuery) count++;
        if (selectedTags.length > 0) count++;
        if (advancedFilters.status !== 'all') count++;
        if (advancedFilters.difficultyMin > 1 || advancedFilters.difficultyMax < 10) count++;
        if (advancedFilters.hasTimeframe !== null) count++;
        if (advancedFilters.createdAfter) count++;
        if (advancedFilters.createdBefore) count++;
        return count;
    }, [searchQuery, selectedTags, advancedFilters]);

    // ── Handlers ──────────────────────────────────────────────

    const handleToggleTag = useCallback((tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
        setActivePresetId(null);
    }, []);

    const clearAllFilters = useCallback(() => {
        setSearchQuery('');
        setSelectedTags([]);
        setAdvancedFilters(DEFAULT_FILTERS);
        setSortKey('recent');
        setSortDir('desc');
        setActivePresetId(null);
    }, []);

    const applyPreset = useCallback((preset: FilterPreset) => {
        setAdvancedFilters(preset.filters);
        setSearchQuery(preset.searchQuery);
        setSelectedTags(preset.selectedTags);
        setSortKey(preset.sortKey);
        setSortDir(preset.sortDir);
        setActivePresetId(preset.id);
    }, []);

    const saveCurrentAsPreset = useCallback((name: string, icon: string) => {
        const newPreset: FilterPreset = {
            id: crypto.randomUUID(),
            name,
            icon,
            filters: { ...advancedFilters },
            searchQuery,
            selectedTags: [...selectedTags],
            sortKey,
            sortDir,
        };
        setCustomPresets(prev => [...prev, newPreset]);
        setActivePresetId(newPreset.id);
    }, [advancedFilters, searchQuery, selectedTags, sortKey, sortDir]);

    const deletePreset = useCallback((id: string) => {
        setCustomPresets(prev => prev.filter(p => p.id !== id));
        if (activePresetId === id) setActivePresetId(null);
    }, [activePresetId]);

    return {
        // Search
        searchQuery,
        setSearchQuery: (q: string) => { setSearchQuery(q); setActivePresetId(null); },

        // Tags
        selectedTags,
        allTags,
        handleToggleTag,
        clearTags: () => { setSelectedTags([]); setActivePresetId(null); },

        // Advanced filters
        advancedFilters,
        setAdvancedFilters: (f: AdvancedFilters) => { setAdvancedFilters(f); setActivePresetId(null); },
        showAdvancedFilters,
        setShowAdvancedFilters,
        activeFilterCount,

        // Sort
        sortKey,
        setSortKey: (k: GoalSortKey) => { setSortKey(k); setActivePresetId(null); },
        sortDir,
        setSortDir: (d: GoalSortDir) => { setSortDir(d); setActivePresetId(null); },

        // Presets
        allPresets,
        activePresetId,
        applyPreset,
        saveCurrentAsPreset,
        deletePreset,

        // Results
        filteredGoals: filteredAndSortedGoals,
        parkedGoals,

        // Actions
        clearAllFilters,
    };
}
