import React, { useState, useRef } from 'react';
import { login, register, loginAsDemo } from '../services/auth';
import { importUserData } from '../services/dataManagement';
import { BrainCircuit, Loader2, ArrowRight, UploadCloud, FileJson, AlertTriangle, CheckCircle, TestTube } from 'lucide-react';

interface Props {
    onLoginSuccess: () => void;
}

const LoginForm: React.FC<Props> = ({ onLoginSuccess }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isRegistering) {
                await register(username, password);
            } else {
                await login(username, password);
            }
            onLoginSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = async () => {
        setError(null);
        setLoading(true);
        try {
            await loginAsDemo();
            onLoginSuccess();
        } catch (err: any) {
            setError("Demo initialization failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setError(null);
        setSuccessMsg(null);

        try {
            console.log("Starting import for:", file.name);
            const { user: restoredUser, goalCount } = await importUserData(file);
            console.log("Import successful", restoredUser.username, goalCount);
            
            // FORCE SESSION WRITE: Bypass the login() simulation to ensure immediate access
            // This prevents issues where 'login' reads stale data or fails silently
            localStorage.setItem('gpa_session', JSON.stringify(restoredUser));
            
            setSuccessMsg(`Restored ${goalCount} protocols for ${restoredUser.username}. Accessing...`);
            
            // Short delay to let the user see the success message, then force update
            setTimeout(() => {
                onLoginSuccess();
            }, 800);
            
        } catch (err: any) {
            console.error("Import/Login failed:", err);
            setError("Restore failed: " + err.message);
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-4 bg-indigo-500/10 rounded-full mb-4">
                        <BrainCircuit className="text-indigo-500 w-12 h-12" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">GPA</h1>
                    <p className="text-slate-400">Goal Pursuit Accelerator</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Neural ID (Username)</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                            placeholder="Enter username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Access Key (Password)</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                            placeholder="Enter password"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-950/30 border border-red-900/30 text-red-400 text-sm rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}
                    
                    {successMsg && (
                        <div className="p-3 bg-emerald-950/30 border border-emerald-900/30 text-emerald-400 text-sm rounded-lg animate-pulse flex items-center gap-2">
                            <CheckCircle size={16} />
                            {successMsg}
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            type="submit"
                            disabled={loading || isImporting}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (
                                <>
                                    {isRegistering ? 'Initialize Neural Link' : 'Access Dashboard'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                        
                        {!isRegistering && (
                            <button
                                type="button"
                                onClick={handleDemoLogin}
                                disabled={loading || isImporting}
                                className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <TestTube size={18} />
                                Initialize Demo Protocol
                            </button>
                        )}
                    </div>
                </form>

                <div className="mt-6 text-center space-y-4">
                    <button
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setError(null);
                            setSuccessMsg(null);
                        }}
                        disabled={isImporting}
                        className="text-slate-500 hover:text-indigo-400 text-sm transition"
                    >
                        {isRegistering 
                            ? 'Already have an ID? Login here.' 
                            : 'First time? Create a Neural ID.'}
                    </button>

                    <div className="border-t border-slate-800 pt-4 mt-4">
                        <input 
                            type="file" 
                            accept=".json" 
                            ref={fileInputRef} 
                            onClick={(e) => (e.currentTarget.value = '')}
                            onChange={handleFileImport} 
                            className="hidden" 
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading || isImporting}
                            className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition disabled:opacity-50"
                        >
                            {isImporting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Restoring Neural Link...
                                </>
                            ) : (
                                <>
                                    <UploadCloud size={16} />
                                    Restore Neural Link (Import JSON)
                                </>
                            )}
                        </button>
                        <p className="text-xs text-slate-600 mt-2">
                            Upload a backup file to recover your data from another device.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;