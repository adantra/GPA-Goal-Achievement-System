import React, { useState } from 'react';
import { Goal } from '../types';
import { getGoals, updateGoal, deleteGoal } from '../services/goalController';
import { GoogleGenAI, Type } from "@google/genai";

interface AssistantContext {
    title: string;
    description: string;
    mode: 'creation' | 'edition' | 'idle';
}

interface UseGoalEditorOptions {
    loadGoals: () => Promise<void>;
    showAssistant: boolean;
    setAssistantContext: React.Dispatch<React.SetStateAction<AssistantContext>>;
}

export function useGoalEditor({ loadGoals, showAssistant, setAssistantContext }: UseGoalEditorOptions) {
    const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editAIReasoning, setEditAIReasoning] = useState('');
    const [editAISuggestion, setEditAISuggestion] = useState('');
    const [editAlternativeActions, setEditAlternativeActions] = useState<string[]>([]);
    const [editTimeframe, setEditTimeframe] = useState('');
    const [editTags, setEditTags] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isPolishing, setIsPolishing] = useState(false);
    const [isEstimatingTimeframe, setIsEstimatingTimeframe] = useState(false);

    const startEditing = (goal: Goal) => {
        setEditingGoalId(goal.id);
        setEditTitle(goal.title);
        setEditDescription(goal.description);
        setEditAIReasoning(goal.aiAssessment?.reasoning || '');
        setEditAISuggestion(goal.aiAssessment?.suggestion || '');
        setEditAlternativeActions(goal.aiAssessment?.alternativeActions || []);
        setEditTimeframe(goal.estimatedTimeframe || '');
        setEditTags(goal.tags || []);
        if (showAssistant) {
            setAssistantContext({ title: goal.title, description: goal.description, mode: 'edition' });
        }
    };

    const cancelEditing = () => {
        setEditingGoalId(null);
        setEditTitle('');
        setEditDescription('');
        setEditAIReasoning('');
        setEditAISuggestion('');
        setEditAlternativeActions([]);
        setEditTimeframe('');
        setEditTags([]);
        setIsPolishing(false);
        setAssistantContext(prev => ({ ...prev, mode: 'idle' }));
    };

    const handleAIPolish = async () => {
        if (!process.env.API_KEY) {
            alert("API Key missing");
            return;
        }
        if (!editTitle && !editDescription) return;

        setIsPolishing(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
                You are a goal optimization expert. Improve this goal for maximum motivation and clarity.
                
                Current Title: "${editTitle}"
                Current Description: "${editDescription}"
                
                Requirements:
                1. Make the title action-oriented, punchy, and under 80 characters
                2. Make the description explicitly clear about WHY this goal matters
                3. Use motivating, energizing language
                4. Output ONLY the JSON with no additional text
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-flash-lite-latest',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING }
                        },
                        required: ["title", "description"]
                    }
                }
            });

            if (response.text) {
                const data = JSON.parse(response.text);
                setEditTitle(data.title || editTitle);
                setEditDescription(data.description || editDescription);
                setAssistantContext(prev => ({ ...prev, title: data.title, description: data.description }));
            }
        } catch (e) {
            console.error("AI Polish failed", e);
        } finally {
            setIsPolishing(false);
        }
    };

    const handleEstimateTimeframe = async () => {
        if (!process.env.API_KEY) {
            alert("API Key missing");
            return;
        }
        if (!editTitle && !editDescription) return;

        setIsEstimatingTimeframe(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
                You are a goal planning expert. Estimate a realistic timeframe for achieving this goal.
                
                Goal Title: "${editTitle}"
                Goal Description: "${editDescription}"
                ${editAIReasoning ? `AI Analysis: "${editAIReasoning}"` : ''}
                
                Consider:
                1. The complexity and scope of the goal
                2. Typical time needed for similar achievements
                3. Realistic expectations accounting for part-time effort
                4. Buffer time for obstacles and learning curves
                
                Provide a timeframe estimate (e.g., "2-3 weeks", "6 months", "1-2 years").
                Be realistic and specific. Output ONLY the JSON with no additional text.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-flash-lite-latest',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            timeframe: { type: Type.STRING }
                        },
                        required: ["timeframe"]
                    }
                }
            });

            const text = response.text?.trim();
            if (text) {
                const data = JSON.parse(text);
                if (data.timeframe) {
                    setEditTimeframe(data.timeframe);
                }
            }
        } catch (e) {
            console.error("AI Timeframe estimation failed", e);
            alert("Failed to estimate timeframe. Please try again.");
        } finally {
            setIsEstimatingTimeframe(false);
        }
    };

    const saveEdit = async (id: string) => {
        if (!editTitle.trim() || !editDescription.trim()) return;
        
        setIsSaving(true);
        try {
            const goals = await getGoals();
            const currentGoal = goals.find(g => g.id === id);
            
            let updatedAIAssessment = currentGoal?.aiAssessment;
            if (updatedAIAssessment && (editAIReasoning || editAISuggestion || editAlternativeActions.length > 0)) {
                updatedAIAssessment = {
                    ...updatedAIAssessment,
                    reasoning: editAIReasoning,
                    suggestion: editAISuggestion,
                    alternativeActions: editAlternativeActions.length > 0 ? editAlternativeActions : undefined
                };
            }
            
            await updateGoal(id, { 
                title: editTitle, 
                description: editDescription,
                aiAssessment: updatedAIAssessment,
                estimatedTimeframe: editTimeframe || undefined,
                tags: editTags,
                lastWorkedOn: new Date().toISOString()
            });
            await loadGoals();
            cancelEditing();
        } catch (e) {
            console.error("Failed to update goal", e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteGoal = async (id: string) => {
        if (confirm("WARNING: Are you sure you want to delete this neural protocol? This cannot be undone.")) {
            setIsSaving(true);
            try {
                await deleteGoal(id);
                await loadGoals();
                cancelEditing();
            } catch (e) {
                console.error("Failed to delete goal", e);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const updateEditTitle = (value: string) => {
        setEditTitle(value);
        if (showAssistant) setAssistantContext(prev => ({ ...prev, title: value }));
    };

    const updateEditDescription = (value: string) => {
        setEditDescription(value);
        if (showAssistant) setAssistantContext(prev => ({ ...prev, description: value }));
    };

    return {
        editingGoalId,
        editTitle,
        editDescription,
        editAIReasoning,
        editAISuggestion,
        editAlternativeActions,
        editTimeframe,
        editTags,
        isSaving,
        isPolishing,
        isEstimatingTimeframe,
        setEditAIReasoning,
        setEditAISuggestion,
        setEditAlternativeActions,
        setEditTimeframe,
        setEditTags,
        startEditing,
        cancelEditing,
        handleAIPolish,
        handleEstimateTimeframe,
        saveEdit,
        handleDeleteGoal,
        updateEditTitle,
        updateEditDescription,
    };
}
