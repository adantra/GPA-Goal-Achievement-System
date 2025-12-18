import React, { useState } from 'react';
import { AlertOctagon } from 'lucide-react';

interface Props {
    onUnlock: () => void;
}

const ForeshadowingFailureModal: React.FC<Props> = ({ onUnlock }) => {
    const [text, setText] = useState('');
    const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const isEnough = wordCount >= 50;

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-slate-900 border border-red-900/50 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-red-900/20 rounded-full text-red-500">
                        <AlertOctagon size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Access Blocked: Foreshadowing Failure</h1>
                        <p className="text-red-400 text-sm">Protocol 3: Amygdala Activation Required</p>
                    </div>
                </div>

                <div className="prose prose-invert mb-6 text-slate-300">
                    <p>
                        To ensure you remain committed, you must vividly describe the 
                        <strong> negative consequences</strong> of failing to achieve your current goals. 
                        What will your life look like in 5 years if you stay exactly as you are? 
                        Who will you disappoint? What pain will you feel?
                    </p>
                </div>

                <textarea
                    className="w-full h-48 bg-black/50 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-red-500 outline-none transition resize-none"
                    placeholder="If I fail, I will..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />

                <div className="flex justify-between items-center mt-4">
                    <div className={`text-sm font-mono ${isEnough ? 'text-green-400' : 'text-slate-500'}`}>
                        Word Count: {wordCount} / 50
                    </div>

                    <button
                        onClick={onUnlock}
                        disabled={!isEnough}
                        className={`px-6 py-3 rounded-lg font-bold transition-all
                            ${isEnough 
                                ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/40' 
                                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                            }`}
                    >
                        {isEnough ? 'Unlock Dashboard' : 'Write More to Unlock'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForeshadowingFailureModal;
