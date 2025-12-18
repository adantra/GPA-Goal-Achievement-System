import React, { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import ForeshadowingFailureModal from './components/ForeshadowingFailureModal';
import LoginForm from './components/LoginForm';
import { getCurrentUser } from './services/auth';

const App: React.FC = () => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [user, setUser] = useState(getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);

  // Check initial state
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Effect for Foreshadowing Failure Logic (only runs if logged in)
  useEffect(() => {
    if (user) {
      // Random chance (e.g., 30%) on dashboard load to block user
      const shouldBlock = Math.random() < 0.3; 
      if (shouldBlock) {
        console.log("Neuro-Protocol: Foreshadowing Failure Triggered");
        setIsBlocked(true);
      } else {
        setIsBlocked(false);
      }
    }
  }, [user]);

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading Neuro-OS...</div>;

  // If not logged in, show Login Form
  if (!user) {
    return <LoginForm onLoginSuccess={() => setUser(getCurrentUser())} />;
  }

  return (
    <>
      {isBlocked && (
        <ForeshadowingFailureModal onUnlock={() => setIsBlocked(false)} />
      )}
      {!isBlocked && (
        <Dashboard onLogout={() => setUser(null)} />
      )}
    </>
  );
};

export default App;
