import React, { useEffect } from 'react';
import { Goal } from '../types';

interface ModalStates {
    showSpaceTime: boolean;
    showAmygdala: boolean;
    showSchedule: boolean;
    showAudit: boolean;
    showProfile: boolean;
    showWeeklyReview: boolean;
    showAssistant: boolean;
    showKeyboardHelp: boolean;
}

interface UseKeyboardShortcutsOptions {
    goals: Goal[];
    focusedGoalId: string | null;
    editingGoalId: string | null;
    modals: ModalStates;
    setShowSpaceTime: (v: boolean) => void;
    setShowAmygdala: (v: boolean) => void;
    setShowSchedule: (v: boolean) => void;
    setShowAudit: (v: boolean) => void;
    setShowProfile: (v: boolean) => void;
    setShowWeeklyReview: (v: boolean) => void;
    setShowAssistant: (v: boolean) => void;
    setShowKeyboardHelp: (v: boolean) => void;
    setFocusedGoalId: (id: string | null) => void;
    setAssistantContext: (ctx: { title: string; description: string; mode: 'creation' | 'edition' | 'idle' }) => void;
    cancelEditing: () => void;
    startEditing: (goal: Goal) => void;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    createGoalRef: React.RefObject<HTMLDivElement | null>;
}

export function useKeyboardShortcuts({
    goals,
    focusedGoalId,
    editingGoalId,
    modals,
    setShowSpaceTime,
    setShowAmygdala,
    setShowSchedule,
    setShowAudit,
    setShowProfile,
    setShowWeeklyReview,
    setShowAssistant,
    setShowKeyboardHelp,
    setFocusedGoalId,
    setAssistantContext,
    cancelEditing,
    startEditing,
    searchInputRef,
    createGoalRef,
}: UseKeyboardShortcutsOptions) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isTyping = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.isContentEditable;
            
            // Escape always works
            if (e.key === 'Escape') {
                e.preventDefault();
                if (modals.showSpaceTime) setShowSpaceTime(false);
                else if (modals.showAmygdala) setShowAmygdala(false);
                else if (modals.showSchedule) setShowSchedule(false);
                else if (modals.showAudit) setShowAudit(false);
                else if (modals.showProfile) setShowProfile(false);
                else if (modals.showWeeklyReview) setShowWeeklyReview(false);
                else if (modals.showAssistant) setShowAssistant(false);
                else if (modals.showKeyboardHelp) setShowKeyboardHelp(false);
                else if (focusedGoalId) setFocusedGoalId(null);
                else if (editingGoalId) cancelEditing();
                return;
            }
            
            // Help shortcut
            if ((e.key === '?' || (e.key === 'h' && !isTyping)) && !modals.showKeyboardHelp) {
                e.preventDefault();
                setShowKeyboardHelp(true);
                return;
            }
            
            if (isTyping) return;
            
            const shortcutKeys = ['c', 'f', 'n', '/', 'e'];
            if (shortcutKeys.includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
            
            switch (e.key.toLowerCase()) {
                case 'c':
                    createGoalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => {
                        const firstInput = createGoalRef.current?.querySelector('input');
                        firstInput?.focus();
                    }, 300);
                    break;
                    
                case 'f': {
                    const activeGoals = goals.filter(g => g.status === 'active');
                    if (activeGoals.length === 0) break;
                    
                    if (!focusedGoalId) {
                        setFocusedGoalId(e.shiftKey ? activeGoals[activeGoals.length - 1].id : activeGoals[0].id);
                    } else {
                        const currentIndex = activeGoals.findIndex(g => g.id === focusedGoalId);
                        if (currentIndex === -1) {
                            setFocusedGoalId(activeGoals[0].id);
                        } else if (e.shiftKey) {
                            setFocusedGoalId(currentIndex === 0 ? null : activeGoals[currentIndex - 1].id);
                        } else {
                            setFocusedGoalId(currentIndex === activeGoals.length - 1 ? null : activeGoals[currentIndex + 1].id);
                        }
                    }
                    break;
                }
                    
                case 'n':
                    if (!modals.showAssistant) {
                        setShowAssistant(true);
                        setAssistantContext({ title: '', description: '', mode: 'idle' });
                    } else {
                        setShowAssistant(false);
                    }
                    break;
                    
                case '/':
                    searchInputRef.current?.focus();
                    break;
                    
                case 'e': {
                    const goalToEdit = focusedGoalId 
                        ? goals.find(g => g.id === focusedGoalId)
                        : goals.find(g => g.status === 'active');
                    if (goalToEdit && !editingGoalId) {
                        startEditing(goalToEdit);
                    }
                    break;
                }
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goals, focusedGoalId, editingGoalId, modals, setShowSpaceTime, setShowAmygdala, setShowSchedule, setShowAudit, setShowProfile, setShowWeeklyReview, setShowAssistant, setShowKeyboardHelp, setFocusedGoalId, setAssistantContext, cancelEditing, startEditing, searchInputRef, createGoalRef]);
}
