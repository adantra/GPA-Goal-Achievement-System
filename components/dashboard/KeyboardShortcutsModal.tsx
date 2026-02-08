import React from 'react';
import { Keyboard, X, Target, Brain, Sparkles } from 'lucide-react';

const ShortcutRow: React.FC<{ shortcut: string; description: string }> = ({ shortcut, description }) => (
    <div className="flex items-center justify-between py-2 px-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition">
        <span className="text-slate-300 text-sm">{description}</span>
        <kbd className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-white font-mono text-sm font-bold shadow-sm">
            {shortcut}
        </kbd>
    </div>
);

interface Props {
    onClose: () => void;
}

const KeyboardShortcutsModal: React.FC<Props> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-indigo-900/20 to-purple-900/20">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Keyboard size={28} className="text-indigo-400" />
                            <div>
                                <h2 className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
                                <p className="text-slate-400 text-sm mt-1">Navigate faster with hotkeys</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-500 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Shortcuts List */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div>
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Target size={14} />
                            Navigation
                        </h3>
                        <div className="space-y-2">
                            <ShortcutRow shortcut="/" description="Focus search bar" />
                            <ShortcutRow shortcut="C" description="Create new goal (scroll to form)" />
                            <ShortcutRow shortcut="F" description="Cycle forward through active goals" />
                            <ShortcutRow shortcut="Shift + F" description="Cycle backward through active goals" />
                            <ShortcutRow shortcut="E" description="Edit focused goal (or first active goal)" />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Brain size={14} />
                            Tools & Modals
                        </h3>
                        <div className="space-y-2">
                            <ShortcutRow shortcut="N" description="Open/Close Neural Assistant" />
                            <ShortcutRow shortcut="Esc" description="Close any open modal or focused goal" />
                            <ShortcutRow shortcut="? or H" description="Show this keyboard shortcuts help" />
                        </div>
                    </div>

                    <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-lg p-4">
                        <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Sparkles size={14} />
                            Pro Tips
                        </h3>
                        <ul className="text-sm text-slate-400 space-y-1.5">
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-0.5">•</span>
                                <span>Keyboard shortcuts don't work while typing in input fields</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-0.5">•</span>
                                <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs font-mono">F</kbd> repeatedly to cycle through all your active goals</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-0.5">•</span>
                                <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs font-mono">Esc</kbd> multiple times to close nested modals</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-0.5">•</span>
                                <span>Use <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs font-mono">/</kbd> to quickly search without reaching for your mouse</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KeyboardShortcutsModal;
