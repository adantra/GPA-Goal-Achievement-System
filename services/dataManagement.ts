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

export const importUserData = async (file: File): Promise<User> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = e.target?.result as string;
                const data = JSON.parse(json);

                if (!data.user || !data.user.id || !Array.isArray(data.goals)) {
                    throw new Error("Invalid neural backup file structure.");
                }

                // 1. Restore/Merge User
                const usersStr = localStorage.getItem('gpa_users');
                const users: User[] = usersStr ? JSON.parse(usersStr) : [];
                
                // Check if user exists to avoid duplicates
                const existingUserIndex = users.findIndex(u => u.id === data.user.id);
                if (existingUserIndex === -1) {
                    users.push(data.user);
                } else {
                    // Update credentials in case they changed in the backup
                    users[existingUserIndex] = data.user;
                }
                localStorage.setItem('gpa_users', JSON.stringify(users));

                // 2. Restore Goals
                const goalsKey = `gpa_data_${data.user.id}_goals`;
                localStorage.setItem(goalsKey, JSON.stringify(data.goals));

                resolve(data.user);
            } catch (err) {
                console.error(err);
                reject(new Error("Corrupted neural data sequence. Unable to parse file."));
            }
        };
        reader.onerror = () => reject(new Error("Failed to read file."));
        reader.readAsText(file);
    });
};