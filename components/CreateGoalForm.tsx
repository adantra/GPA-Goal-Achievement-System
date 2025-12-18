import React, { useState } from 'react';
import { createGoal } from '../services/goalController';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

interface Props {
    onGoalCreated: () => void;
}

const CreateGoalForm: React.FC<Props> = ({ onGoalCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState(5);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Goldilocks logic helpers
    const isTooEasy = difficulty < 6;
    const isTooHard = difficulty > 8;
    const isValid = !isTooEasy && !isTooHard;

    const getDifficultyColor = () => {
        if (isTooEasy) return 'text-blue-400';
        if (isTooHard) return 'text-red-400';
        return 'text-green-400'; // Optimal
    };

    const getDifficultyLabel = () => {
        if (isTooEasy) return 'Too Easy / Boring';
        if (isTooHard) return 'Too Lofty / Anxiety-Inducing';
        return 'The Goldilocks Zone (Optimal)';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isValid) return;

        setLoading(true);
        try {
            await createGoal({
                title,
                description,
                difficultyRating: difficulty
            });
            onGoalCreated();
            setTitle('');
            setDescription('');
            setDifficulty(5);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                <span className="bg-indigo-500 w-2 h-6 rounded-full block"></span>
                Define New Protocol
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Goal Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                        placeholder="e.g., Run a Marathon"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition h-24"
                        placeholder="Why is this important?"
                        required
                    />
                </div>

                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-sm font-medium text-slate-300">Difficulty Rating (1-10)</label>
                        <span className={`font-mono font-bold ${getDifficultyColor()}`}>
                            {difficulty} - {getDifficultyLabel()}
                        </span>
                    </div>
                    
                    <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={difficulty}
                        onChange={(e) => setDifficulty(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    
                    <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                        <span>1 (Trivial)</span>
                        <span>10 (Impossible)</span>
                    </div>

                    {!isValid && (
                        <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-300">
                                <strong>Neuro-Lock Active:</strong> You cannot proceed. 
                                {isTooEasy ? " This goal is too easy and will not generate sufficient autonomic arousal." : " This goal is too difficult and will trigger amygdala-based avoidance."}
                                <br/>Adjust slider to 6-8.
                            </p>
                        </div>
                    )}
                    
                    {isValid && (
                        <div className="mt-4 p-3 bg-green-900/20 border border-green-900/50 rounded flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <p className="text-sm text-green-300">
                                <strong>Optimal Zone:</strong> Dopamine-Adrenaline balance optimized for pursuit.
                            </p>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="text-red-400 text-sm bg-red-950/30 p-3 rounded">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!isValid || loading}
                    className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all
                        ${isValid 
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                        }`}
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Initialize Goal Protocol'}
                </button>
            </form>
        </div>
    );
};

export default CreateGoalForm;
