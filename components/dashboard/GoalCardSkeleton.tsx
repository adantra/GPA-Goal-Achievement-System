import React from 'react';

/**
 * Content-shaped skeleton placeholder for a GoalCard.
 * Shows while goals are loading to improve perceived performance.
 */
const GoalCardSkeleton: React.FC = () => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse">
        {/* Header row */}
        <div className="flex justify-between items-start mb-4">
            <div className="flex-1 mr-4">
                {/* Title skeleton */}
                <div className="h-6 bg-slate-800 rounded-lg w-3/4 mb-3"></div>
                {/* Description skeleton — 2 lines */}
                <div className="h-3.5 bg-slate-800/70 rounded w-full mb-2"></div>
                <div className="h-3.5 bg-slate-800/70 rounded w-5/6 mb-3"></div>
                {/* Tag pill skeletons */}
                <div className="flex gap-2 mt-2">
                    <div className="h-5 w-16 bg-slate-800/50 rounded-full"></div>
                    <div className="h-5 w-20 bg-slate-800/50 rounded-full"></div>
                </div>
            </div>
            {/* Right side badges */}
            <div className="flex flex-col items-end gap-2">
                <div className="h-6 w-20 bg-slate-800 rounded-full"></div>
                <div className="h-6 w-24 bg-slate-800/50 rounded-full"></div>
            </div>
        </div>

        {/* Milestone skeletons */}
        <div className="space-y-3 mt-6 pt-4 border-t border-slate-800/50">
            <MilestoneSkeleton />
            <MilestoneSkeleton />
            <MilestoneSkeleton />
        </div>
    </div>
);

const MilestoneSkeleton: React.FC = () => (
    <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded-md bg-slate-800 shrink-0"></div>
        <div className="h-4 bg-slate-800/60 rounded flex-1"></div>
        <div className="h-5 w-16 bg-slate-800/40 rounded-full shrink-0"></div>
    </div>
);

interface LoadingSkeletonsProps {
    count?: number;
    isGridView?: boolean;
}

const LoadingSkeletons: React.FC<LoadingSkeletonsProps> = ({ count = 3, isGridView = false }) => (
    <div className={`grid gap-6 items-start transition-all duration-300 ease-in-out ${
        isGridView 
        ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
        : 'grid-cols-1 2xl:grid-cols-2'
    }`}>
        {Array.from({ length: count }).map((_, i) => (
            <GoalCardSkeleton key={i} />
        ))}
    </div>
);

export { GoalCardSkeleton, LoadingSkeletons };
export default GoalCardSkeleton;
