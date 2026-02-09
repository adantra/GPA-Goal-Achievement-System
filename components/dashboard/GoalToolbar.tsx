import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Keyboard, Maximize2, Minimize2, LayoutGrid, List, Filter, Tag } from 'lucide-react';
import { getTagColor } from '../../utils/tagColors';
import { SortControl, AdvancedFilterPanel, FilterPresetsBar } from './AdvancedFilters';
import type { AdvancedFilters, GoalSortKey, GoalSortDir, FilterPreset } from '../../hooks/useGoalFilters';

interface Props {
    goalCount: number;
    zoomLevel: number;
    isGridView: boolean;
    searchQuery: string;
    selectedTags: string[];
    allTags: string[];
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
    onShowKeyboardHelp: () => void;
    onExpandAll: () => void;
    onCollapseAll: () => void;
    onToggleGridView: () => void;
    onSearchChange: (query: string) => void;
    onToggleTag: (tag: string) => void;
    onClearTags: () => void;
    // Sort props
    sortKey: GoalSortKey;
    sortDir: GoalSortDir;
    onSortKeyChange: (key: GoalSortKey) => void;
    onSortDirChange: (dir: GoalSortDir) => void;
    // Advanced filter props
    advancedFilters: AdvancedFilters;
    onAdvancedFiltersChange: (filters: AdvancedFilters) => void;
    showAdvancedFilters: boolean;
    onToggleAdvancedFilters: () => void;
    activeFilterCount: number;
    // Preset props
    allPresets: FilterPreset[];
    activePresetId: string | null;
    onApplyPreset: (preset: FilterPreset) => void;
    onSavePreset: (name: string, icon: string) => void;
    onDeletePreset: (id: string) => void;
    onClearAllFilters: () => void;
}

const GoalToolbar: React.FC<Props> = ({
    goalCount,
    zoomLevel,
    isGridView,
    searchQuery,
    selectedTags,
    allTags,
    searchInputRef,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onShowKeyboardHelp,
    onExpandAll,
    onCollapseAll,
    onToggleGridView,
    onSearchChange,
    onToggleTag,
    onClearTags,
    sortKey,
    sortDir,
    onSortKeyChange,
    onSortDirChange,
    advancedFilters,
    onAdvancedFiltersChange,
    showAdvancedFilters,
    onToggleAdvancedFilters,
    activeFilterCount,
    allPresets,
    activePresetId,
    onApplyPreset,
    onSavePreset,
    onDeletePreset,
    onClearAllFilters,
}) => {
    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-white">Active Protocols</h2>
                    <div className="text-slate-500 text-sm border-l border-slate-800 pl-4">{goalCount} {goalCount === 1 ? 'Protocol' : 'Protocols'} Running</div>
                </div>
                 
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Sort Control */}
                    <SortControl
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSortKeyChange={onSortKeyChange}
                        onSortDirChange={onSortDirChange}
                    />

                    <div className="w-px h-6 bg-slate-800 mx-1 hidden sm:block"></div>

                    {/* Zoom Controls */}
                    <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 items-center">
                        <button onClick={onZoomOut} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-md transition" title="Zoom Out">
                            <ZoomOut size={14} />
                        </button>
                        <span className="text-[10px] w-8 text-center text-slate-400 font-mono">{zoomLevel}%</span>
                        <button onClick={onZoomIn} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-md transition" title="Zoom In">
                            <ZoomIn size={14} />
                        </button>
                        <button onClick={onZoomReset} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-md transition ml-1 border-l border-slate-700" title="Reset Zoom">
                            <RotateCcw size={12} />
                        </button>
                    </div>

                    <div className="w-px h-6 bg-slate-800 mx-1 hidden sm:block"></div>
                    
                    {/* Keyboard Shortcuts Help */}
                    <button
                        onClick={onShowKeyboardHelp}
                        className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition"
                        title="Keyboard Shortcuts (Press ? or H)"
                    >
                        <Keyboard size={14} />
                        <span className="hidden sm:inline">Shortcuts</span>
                    </button>

                    <div className="w-px h-6 bg-slate-800 mx-1 hidden sm:block"></div>

                    {/* Batch Actions */}
                    <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                        <button onClick={onExpandAll} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-md transition" title="Expand All Details">
                            <Maximize2 size={14} />
                        </button>
                        <button onClick={onCollapseAll} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-md transition" title="Collapse All (Summary)">
                            <Minimize2 size={14} />
                        </button>
                    </div>

                    <div className="w-px h-6 bg-slate-800 mx-1 hidden sm:block"></div>

                    {/* View Mode Toggle */}
                    <button 
                        onClick={onToggleGridView}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                            isGridView 
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/40' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                    >
                        {isGridView ? <LayoutGrid size={16} /> : <List size={16} />}
                        {isGridView ? 'Compact Grid' : 'Standard View'}
                    </button>
                </div>
            </div>
            
            {/* Filter Presets */}
            <FilterPresetsBar
                presets={allPresets}
                activePresetId={activePresetId}
                onApply={onApplyPreset}
                onSave={onSavePreset}
                onDelete={onDeletePreset}
                onClearAll={onClearAllFilters}
                activeFilterCount={activeFilterCount}
            />

            {/* Search and Filter */}
            <div className="mb-4 space-y-3">
                <div className="flex gap-2">
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={e => onSearchChange(e.target.value)}
                        placeholder="Search goals and milestones... (Press '/' to focus)"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                </div>
                
                {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-slate-500 font-bold uppercase flex items-center gap-1">
                            <Filter size={12} />
                            Tags:
                        </span>
                        {allTags.map(tag => {
                            const isSelected = selectedTags.includes(tag);
                            const colorClass = getTagColor(tag);
                            
                            return (
                                <button
                                    key={tag}
                                    onClick={() => onToggleTag(tag)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer transition-all ${colorClass} ${isSelected ? 'ring-2 ring-white/50' : ''}`}
                                >
                                    <Tag size={10} />
                                    #{tag}
                                </button>
                            );
                        })}
                        {selectedTags.length > 0 && (
                            <button onClick={onClearTags} className="text-xs text-slate-500 hover:text-slate-300 underline">
                                Clear tags
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Advanced Filters */}
            <AdvancedFilterPanel
                filters={advancedFilters}
                onChange={onAdvancedFiltersChange}
                isOpen={showAdvancedFilters}
                onToggle={onToggleAdvancedFilters}
                activeFilterCount={activeFilterCount}
            />
        </>
    );
};

export default GoalToolbar;
