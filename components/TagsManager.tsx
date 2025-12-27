import React, { useState } from 'react';
import { Tag, X, Plus } from 'lucide-react';

interface Props {
    tags: string[];
    onChange: (tags: string[]) => void;
    suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
    'career', 'health', 'fitness', 'learning', 'finance',
    'relationships', 'creativity', 'mindfulness', 'business',
    'personal', 'family', 'hobby', 'skill', 'habit'
];

const TagsManager: React.FC<Props> = ({ tags, onChange, suggestions = DEFAULT_SUGGESTIONS }) => {
    const [newTag, setNewTag] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const addTag = (tag: string) => {
        const normalizedTag = tag.toLowerCase().trim();
        if (normalizedTag && !tags.includes(normalizedTag)) {
            onChange([...tags, normalizedTag]);
            setNewTag('');
            setShowSuggestions(false);
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(tags.filter(t => t !== tagToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newTag.trim()) {
            e.preventDefault();
            addTag(newTag);
        }
    };

    const unusedSuggestions = suggestions.filter(s => !tags.includes(s));

    const TAG_COLORS = [
        'bg-blue-500/20 text-blue-300 border-blue-500/30',
        'bg-purple-500/20 text-purple-300 border-purple-500/30',
        'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        'bg-pink-500/20 text-pink-300 border-pink-500/30',
        'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        'bg-rose-500/20 text-rose-300 border-rose-500/30',
        'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    ];

    const getTagColor = (tag: string) => {
        const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return TAG_COLORS[hash % TAG_COLORS.length];
    };

    return (
        <div>
            <label className="flex items-center gap-2 text-xs text-slate-400 uppercase font-bold mb-2">
                <Tag size={12} />
                Tags
            </label>
            
            {/* Display Tags */}
            <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                    <span
                        key={tag}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getTagColor(tag)}`}
                    >
                        #{tag}
                        <button
                            onClick={() => removeTag(tag)}
                            className="hover:bg-white/10 rounded-full p-0.5 transition-colors"
                            type="button"
                        >
                            <X size={12} />
                        </button>
                    </span>
                ))}
            </div>

            {/* Add Tag Input */}
            <div className="relative">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setShowSuggestions(true)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        placeholder="Add tag..."
                    />
                    <button
                        onClick={() => addTag(newTag)}
                        disabled={!newTag.trim()}
                        type="button"
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && unusedSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-10 max-h-40 overflow-y-auto">
                        {unusedSuggestions.slice(0, 8).map(suggestion => (
                            <button
                                key={suggestion}
                                onClick={() => addTag(suggestion)}
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-2"
                            >
                                <Tag size={12} className="text-slate-500" />
                                #{suggestion}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {tags.length === 0 && (
                <p className="text-xs text-slate-600 italic mt-2">
                    Add tags to organize your goals (e.g., #career, #health)
                </p>
            )}
        </div>
    );
};

export default TagsManager;

