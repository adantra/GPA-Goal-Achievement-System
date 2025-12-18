export interface User {
    id: string;
    username: string;
    // In a real app, never store passwords in plain text!
    password: string; 
}

const USERS_KEY = 'gpa_users';
const SESSION_KEY = 'gpa_session';

export const getCurrentUser = (): User | null => {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
};

export const login = async (username: string, password: string): Promise<User> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const usersStr = localStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];

    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        throw new Error("Invalid neural signature (username or password incorrect).");
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
};

export const register = async (username: string, password: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const usersStr = localStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];

    if (users.some(u => u.username === username)) {
        throw new Error("Neural ID already occupied.");
    }

    const newUser: User = {
        id: crypto.randomUUID(),
        username,
        password
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));

    return newUser;
};

export const logout = () => {
    localStorage.removeItem(SESSION_KEY);
};
