import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { X, Send, Bot, User, Loader2, Sparkles, Copy, Check } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    contextData: {
        title: string;
        description: string;
        mode: 'creation' | 'edition';
    };
}

interface Message {
    role: 'user' | 'model';
    text: string;
}

const NeuralAssistant: React.FC<Props> = ({ isOpen, onClose, contextData }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize Chat Session when opened
    useEffect(() => {
        if (isOpen && process.env.API_KEY) {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const systemPrompt = `
                You are the "Neural Assistant," a specialized neuroscience-based goal achievement coach embedded in the GPA (Goal Pursuit Accelerator) app.
                
                Your Goal: Help the user craft high-quality neural protocols (goals) that maximize dopamine engagement and minimize amygdala resistance.
                
                Context:
                The user is currently ${contextData.mode} a goal.
                Current Title: "${contextData.title}"
                Current Description: "${contextData.description}"

                Guidelines:
                1. Be concise, punchy, and motivating.
                2. Use neuroscience terminology correctly but accessibly (e.g., "autonomic arousal", "friction", "dopamine reward prediction error", "habit stacking").
                3. If the user asks for ideas, provide concrete, actionable examples.
                4. If the goal is vague, ask clarifying questions to make it specific.
            `;

            const chat = ai.chats.create({
                model: 'gemini-3-flash-preview',
                config: {
                    systemInstruction: systemPrompt,
                },
            });

            setChatSession(chat);
            setMessages([{ 
                role: 'model', 
                text: `Neural Link established. I see you are working on "${contextData.title || 'a new protocol'}". How can I assist in optimizing this for maximum execution?` 
            }]);
        }
    }, [isOpen, contextData.mode]); // Re-init if mode changes, but mostly on open

    const handleSend = async () => {
        if (!inputValue.trim() || !chatSession) return;

        const userMsg = inputValue;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInputValue('');
        setIsLoading(true);

        try {
            const resultStream = await chatSession.sendMessageStream({ message: userMsg });
            
            let fullResponse = "";
            setMessages(prev => [...prev, { role: 'model', text: "" }]); // Placeholder

            for await (const chunk of resultStream) {
                 const c = chunk as GenerateContentResponse;
                 const text = c.text;
                 if (text) {
                     fullResponse += text;
                     setMessages(prev => {
                         const newArr = [...prev];
                         newArr[newArr.length - 1].text = fullResponse;
                         return newArr;
                     });
                 }
            }

        } catch (error) {
            console.error("Chat Error", error);
            setMessages(prev => [...prev, { role: 'model', text: "Neural connection interrupted. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900 border-l border-slate-700 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
                <div className="flex items-center gap-2 text-indigo-400">
                    <Bot size={20} />
                    <h3 className="font-bold text-lg">Neural Assistant</h3>
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && (
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                                <Sparkles size={14} className="text-indigo-400" />
                            </div>
                        )}
                        
                        <div className={`relative group max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
                            msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-tr-none' 
                                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                        }`}>
                            <div className="whitespace-pre-wrap">{msg.text}</div>
                            
                            {msg.role === 'model' && (
                                <button 
                                    onClick={() => copyToClipboard(msg.text, idx)}
                                    className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-500 hover:text-indigo-400 flex items-center gap-1"
                                >
                                    {copiedIndex === idx ? <Check size={12} /> : <Copy size={12} />}
                                    {copiedIndex === idx ? 'Copied' : 'Copy'}
                                </button>
                            )}
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                                <User size={14} className="text-slate-400" />
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                     <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                            <Sparkles size={14} className="text-indigo-400" />
                        </div>
                        <div className="bg-slate-800 rounded-2xl p-3 rounded-tl-none border border-slate-700 flex items-center gap-2">
                             <Loader2 size={14} className="animate-spin text-indigo-400" />
                             <span className="text-xs text-slate-400">Processing...</span>
                        </div>
                     </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-700 bg-slate-900">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask for suggestions..."
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !inputValue.trim()}
                        className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NeuralAssistant;