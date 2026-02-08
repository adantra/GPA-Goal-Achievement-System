import React from 'react';
import { BrainCircuit, LogOut, User as UserIcon, DownloadCloud, UploadCloud, Loader2, Edit2 } from 'lucide-react';

interface User {
    username: string;
    profile?: { age?: number };
}

interface Props {
    currentUser: User | null;
    isImporting: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onExport: () => void;
    onLogout: () => void;
    onEditProfile: () => void;
}

const DashboardHeader: React.FC<Props> = ({
    currentUser,
    isImporting,
    fileInputRef,
    onImport,
    onExport,
    onLogout,
    onEditProfile,
}) => {
    return (
        <header>
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
                        <BrainCircuit className="text-indigo-500" size={32} />
                        GPA
                    </h1>
                    <p className="text-slate-400 text-sm">Goal Pursuit Accelerator</p>
                </div>
                
                <div className="flex gap-2">
                    <input type="file" accept=".json" ref={fileInputRef} onClick={(e) => (e.currentTarget.value = '')} onChange={onImport} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="text-slate-500 hover:text-emerald-400 transition p-2 bg-slate-900/50 rounded-lg border border-slate-800" title="Restore Neural Link">
                        {isImporting ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                    </button>
                    <button onClick={onExport} className="text-slate-500 hover:text-indigo-400 transition p-2 bg-slate-900/50 rounded-lg border border-slate-800" title="Backup Neural Link">
                        <DownloadCloud size={18} />
                    </button>
                    <button onClick={onLogout} className="text-slate-500 hover:text-red-400 transition p-2 bg-slate-900/50 rounded-lg border border-slate-800" title="Disconnect">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
            
            {currentUser && (
                <div className="mt-4 flex items-center justify-between gap-2 bg-indigo-950/30 p-3 rounded-lg border border-indigo-900/50">
                    <div className="flex items-center gap-2">
                        <UserIcon size={14} className="text-indigo-400" />
                        <div className="text-xs font-mono">
                            <span className="text-slate-500">SUBJ:</span>{' '}
                            <span className="text-indigo-300">{currentUser.username}</span>
                            {currentUser.profile?.age && (
                                <span className="text-slate-600 ml-2">• {currentUser.profile.age}y</span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onEditProfile}
                        className="text-slate-500 hover:text-indigo-400 transition-colors p-1"
                        title="Edit Profile"
                    >
                        <Edit2 size={14} />
                    </button>
                </div>
            )}
        </header>
    );
};

export default DashboardHeader;
