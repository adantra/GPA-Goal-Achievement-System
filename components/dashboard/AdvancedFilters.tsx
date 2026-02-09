import React, { useState } from 'react';
import {
    AdvancedFilters as AdvancedFiltersType,
    GoalSortKey,
    GoalSortDir,
    GoalStatusFilter,
    FilterPreset,
} from '../../hooks/useGoalFilters';
import {
    SlidersHorizontal, ArrowUpDown, ChevronDown, ChevronUp,
    Bookmark, Plus, X, Trash2, ArrowUp, ArrowDown, Save,
} from 'lucide-react';

// ── Sort Dropdown ─────────────────────────────────────────────

interface SortControlProps {
    sortKey: GoalSortKey;
    sortDir: GoalSortDir;
    onSortKeyChange: (key: GoalSortKey) => void;
    onSortDirChange: (dir: GoalSortDir) => void;
}

const SORT_OPTIONS: { key: GoalSortKey; label: string }[] = [
    { key: 'recent', label: 'Recently Worked On' },
    { key: 'difficulty', label: 'Difficulty' },
    { key: 'progress', label: 'Progress %' },
    { key: 'created', label: 'Creation Date' },
    { key: 'alpha', label: 'Alphabetical' },
    { key: 'timeframe', label: 'Timeframe' },
];

export const SortControl: React.FC<SortControlProps> = ({ sortKey, sortDir, onSortKeyChange, onSortDirChange }) => {
    const [open, setOpen] = useState(false);
    const currentLabel = SORT_OPTIONS.find(o => o.key === sortKey)?.label || 'Sort';

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition"
            >
                <ArrowUpDown size={14} />
                <span className="hidden sm:inline">{currentLabel}</span>
                {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-30 py-1">
                    {SORT_OPTIONS.map(opt => (
                        <button
                            key={opt.key}
                            onClick={() => { onSortKeyChange(opt.key); setOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-xs transition ${
                                sortKey === opt.key
                                    ? 'bg-indigo-600/20 text-indigo-300'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                    <div className="border-t border-slate-800 mt-1 pt-1 px-3 py-2 flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Direction:</span>
                        <button
                            onClick={() => onSortDirChange('asc')}
                            className={`p-1 rounded transition ${sortDir === 'asc' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-500 hover:text-white'}`}
                            title="Ascending"
                        >
                            <ArrowUp size={14} />
                        </button>
                        <button
                            onClick={() => onSortDirChange('desc')}
                            className={`p-1 rounded transition ${sortDir === 'desc' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-500 hover:text-white'}`}
                            title="Descending"
                        >
                            <ArrowDown size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Filter Presets Bar ────────────────────────────────────────

interface PresetBarProps {
    presets: FilterPreset[];
    activePresetId: string | null;
    onApply: (preset: FilterPreset) => void;
    onSave: (name: string, icon: string) => void;
    onDelete: (id: string) => void;
    onClearAll: () => void;
    activeFilterCount: number;
}

export const FilterPresetsBar: React.FC<PresetBarProps> = ({
    presets,
    activePresetId,
    onApply,
    onSave,
    onDelete,
    onClearAll,
    activeFilterCount,
}) => {
    const [showSaveInput, setShowSaveInput] = useState(false);
    const [saveName, setSaveName] = useState('');

    const handleSave = () => {
        if (!saveName.trim()) return;
        onSave(saveName.trim(), '📌');
        setSaveName('');
        setShowSaveInput(false);
    };

    return (
        <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                <Bookmark size={10} />
                Presets:
            </span>
            {presets.map(preset => (
                <div key={preset.id} className="relative group">
                    <button
                        onClick={() => onApply(preset)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                            activePresetId === preset.id
                                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 ring-1 ring-indigo-500/30'
                                : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        <span>{preset.icon}</span>
                        {preset.name}
                    </button>
                    {/* Delete button for custom presets (not builtins) */}
                    {!preset.id.startsWith('__') && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(preset.id); }}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500/80 text-white rounded-full items-center justify-center text-[8px] hidden group-hover:flex transition"
                            title="Delete preset"
                        >
                            <X size={8} />
                        </button>
                    )}
                </div>
            ))}

            {/* Save current as preset */}
            {showSaveInput ? (
                <div className="flex items-center gap-1">
                    <input
                        type="text"
                        value={saveName}
                        onChange={e => setSaveName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                        placeholder="Preset name..."
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white w-28 focus:ring-1 focus:ring-indigo-500 outline-none"
                        autoFocus
                    />
                    <button onClick={handleSave} className="p-1 text-emerald-400 hover:text-emerald-300"><Save size={12} /></button>
                    <button onClick={() => setShowSaveInput(false)} className="p-1 text-slate-500 hover:text-white"><X size={12} /></button>
                </div>
            ) : (
                <button
                    onClick={() => setShowSaveInput(true)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-indigo-400 border border-dashed border-slate-700 hover:border-indigo-500/40 transition"
                    title="Save current filters as preset"
                >
                    <Plus size={10} />
                    Save
                </button>
            )}

            {/* Clear all */}
            {activeFilterCount > 0 && (
                <button
                    onClick={onClearAll}
                    className="ml-auto text-xs text-slate-500 hover:text-red-400 underline transition flex items-center gap-1"
                >
                    <Trash2 size={10} />
                    Clear all ({activeFilterCount})
                </button>
            )}
        </div>
    );
};

// ── Advanced Filters Panel ────────────────────────────────────

interface AdvancedFilterPanelProps {
    filters: AdvancedFiltersType;
    onChange: (filters: AdvancedFiltersType) => void;
    isOpen: boolean;
    onToggle: () => void;
    activeFilterCount: number;
}

const STATUS_OPTIONS: { value: GoalStatusFilter; label: string; color: string }[] = [
    { value: 'all', label: 'All', color: 'text-slate-300' },
    { value: 'active', label: 'Active', color: 'text-indigo-400' },
    { value: 'completed', label: 'Completed', color: 'text-emerald-400' },
    { value: 'archived', label: 'Archived', color: 'text-slate-500' },
];

export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
    filters,
    onChange,
    isOpen,
    onToggle,
    activeFilterCount,
}) => {
    return (
        <div className="mb-4">
            <button
                onClick={onToggle}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isOpen || activeFilterCount > 0
                        ? 'bg-indigo-600/10 text-indigo-300 border-indigo-500/30'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
            >
                <SlidersHorizontal size={14} />
                Advanced Filters
                {activeFilterCount > 0 && (
                    <span className="bg-indigo-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {activeFilterCount}
                    </span>
                )}
                {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {isOpen && (
                <div className="mt-3 bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    {/* Status */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Status</label>
                        <div className="flex gap-2">
                            {STATUS_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => onChange({ ...filters, status: opt.value })}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                        filters.status === opt.value
                                            ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                                            : `bg-slate-800/50 border-slate-700/50 ${opt.color} hover:bg-slate-800`
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Difficulty Range */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">
                            Difficulty Range: {filters.difficultyMin} – {filters.difficultyMax}
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min={1}
                                max={10}
                                value={filters.difficultyMin}
                                onChange={e => onChange({ ...filters, difficultyMin: Math.min(Number(e.target.value), filters.difficultyMax) })}
                                className="flex-1 accent-indigo-500 h-1.5"
                            />
                            <span className="text-xs text-slate-400 font-mono w-6 text-center">{filters.difficultyMin}</span>
                            <span className="text-xs text-slate-600">to</span>
                            <span className="text-xs text-slate-400 font-mono w-6 text-center">{filters.difficultyMax}</span>
                            <input
                                type="range"
                                min={1}
                                max={10}
                                value={filters.difficultyMax}
                                onChange={e => onChange({ ...filters, difficultyMax: Math.max(Number(e.target.value), filters.difficultyMin) })}
                                className="flex-1 accent-indigo-500 h-1.5"
                            />
                        </div>
                    </div>

                    {/* Timeframe filter */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Timeframe</label>
                        <div className="flex gap-2">
                            {([
                                { v: null, label: 'Any' },
                                { v: true, label: 'Has Timeframe' },
                                { v: false, label: 'No Timeframe' },
                            ] as { v: boolean | null; label: string }[]).map(opt => (
                                <button
                                    key={String(opt.v)}
                                    onClick={() => onChange({ ...filters, hasTimeframe: opt.v })}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                        filters.hasTimeframe === opt.v
                                            ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                                            : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Created date range */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Created After</label>
                            <input
                                type="date"
                                value={filters.createdAfter}
                                onChange={e => onChange({ ...filters, createdAfter: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Created Before</label>
                            <input
                                type="date"
                                value={filters.createdBefore}
                                onChange={e => onChange({ ...filters, createdBefore: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
