import { User } from './auth';
import { Goal } from '../types';

export const exportUserData = (user: User) => {
    const goalsKey = `gpa_data_${user.id}_goals`;
    const goalsData = localStorage.getItem(goalsKey);
    const goals = goalsData ? JSON.parse(goalsData) : [];

    const backup = {
        user,
        goals,
        timestamp: new Date().toISOString(),
        version: 1
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `gpa_neural_link_${user.username}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const importUserData = async (file: File): Promise<{ user: User; goalCount: number }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const json = e.target?.result as string;
                if (!json) throw new Error("File is empty or unreadable.");
                
                let data;
                try {
                    data = JSON.parse(json);
                } catch (parseError) {
                    throw new Error("Invalid JSON format. The backup file is corrupted.");
                }

                // Validation
                if (!data.user || !data.user.id || !data.user.username) {
                    throw new Error("Invalid backup structure: Missing user credentials.");
                }
                
                // Ensure goals is an array
                const goalsToRestore = Array.isArray(data.goals) ? data.goals : [];

                // 1. Restore/Merge User
                let users: User[] = [];
                try {
                    const usersStr = localStorage.getItem('gpa_users');
                    users = usersStr ? JSON.parse(usersStr) : [];
                    if (!Array.isArray(users)) users = [];
                } catch (storageError) {
                    console.warn("Local user registry corrupted. Resetting.");
                    users = [];
                }
                
                // Check if user exists to avoid duplicates
                const existingUserIndex = users.findIndex(u => u.id === data.user.id);
                if (existingUserIndex === -1) {
                    users.push(data.user);
                } else {
                    // Update credentials in case they changed in the backup
                    users[existingUserIndex] = data.user;
                }
                
                // Synchronous writes
                localStorage.setItem('gpa_users', JSON.stringify(users));

                // 2. Restore Goals
                const goalsKey = `gpa_data_${data.user.id}_goals`;
                localStorage.setItem(goalsKey, JSON.stringify(goalsToRestore));
                
                // Verify write
                const verifiedGoals = localStorage.getItem(goalsKey);
                if (!verifiedGoals) {
                    throw new Error("Failed to write goals to storage.");
                }

                // Return both user and stats for verification
                resolve({ user: data.user, goalCount: goalsToRestore.length });

            } catch (err: any) {
                console.error("Import Error:", err);
                reject(new Error(err.message || "Unknown import error"));
            }
        };

        reader.onerror = () => reject(new Error("Failed to read file from disk."));
        reader.readAsText(file);
    });
};