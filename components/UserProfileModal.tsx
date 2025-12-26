import React, { useState, useEffect } from 'react';
import { X, Save, User as UserIcon, Sparkles, Loader2 } from 'lucide-react';
import { getCurrentUser, updateUserProfile, UserProfile } from '../services/auth';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

const UserProfileModal: React.FC<Props> = ({ isOpen, onClose, onUpdate }) => {
    const currentUser = getCurrentUser();
    const [profile, setProfile] = useState<UserProfile>({
        age: undefined,
        gender: '',
        occupation: '',
        goals: '',
        challenges: '',
        bio: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (currentUser?.profile) {
            setProfile(currentUser.profile);
        }
    }, [currentUser]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateUserProfile(profile);
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Failed to update profile', error);
            alert('Failed to save profile');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-500/20 rounded-full">
                        <UserIcon size={24} className="text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">User Profile</h2>
                        <p className="text-slate-400 text-sm">Provide context to help the AI Assistant personalize your experience</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Age
                            </label>
                            <input
                                type="number"
                                value={profile.age || ''}
                                onChange={(e) => setProfile({ ...profile, age: e.target.value ? parseInt(e.target.value) : undefined })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="e.g., 35"
                                min="0"
                                max="120"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Gender
                            </label>
                            <input
                                type="text"
                                value={profile.gender || ''}
                                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="e.g., Male, Female, Non-binary"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Occupation / Role
                        </label>
                        <input
                            type="text"
                            value={profile.occupation || ''}
                            onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g., Software Engineer, Student, Entrepreneur"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Life Goals & Aspirations
                        </label>
                        <textarea
                            value={profile.goals || ''}
                            onChange={(e) => setProfile({ ...profile, goals: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-y min-h-[80px]"
                            placeholder="What are your main life goals? What do you want to achieve in the next 1-5 years?"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Current Challenges
                        </label>
                        <textarea
                            value={profile.challenges || ''}
                            onChange={(e) => setProfile({ ...profile, challenges: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-y min-h-[80px]"
                            placeholder="What obstacles or struggles are you currently facing? Time management? Motivation? Health?"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Additional Context
                        </label>
                        <textarea
                            value={profile.bio || ''}
                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-y min-h-[100px]"
                            placeholder="Any other relevant information: lifestyle, constraints, preferences, health conditions, etc."
                            rows={4}
                        />
                    </div>

                    <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-lg p-4 flex items-start gap-3">
                        <Sparkles size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-slate-300">
                            <p className="font-semibold text-indigo-300 mb-1">How this helps:</p>
                            <p>The Neural Assistant will use this information to provide more personalized goal suggestions, difficulty assessments, and actionable advice tailored to your specific situation.</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-8 pt-6 border-t border-slate-800">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-lg shadow-indigo-900/20"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Save Profile
                            </>
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;

