import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { X, Send, Bot, User, Loader2, Sparkles, Copy, Check, Trash2, Zap } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    contextData: {
        title: string;
        description: string;
        mode: 'creation' | 'edition' | 'idle';
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
    }, [messages, isOpen]);

    // Initialize or Update Chat Session
    useEffect(() => {
        if (!chatSession && process.env.API_KEY) {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const systemPrompt = `
                You are the "Neural Assistant," a specialized neuroscience-based goal achievement coach for the GPA platform.
                
                Goal: Help users craft protocols that maximize dopamine and minimize amygdala resistance.
                
                Protocols:
                - Goldilocks Rule: Challenges must be difficulty 6-8.
                - Go/No-Go: Every milestone needs actions to take and actions to avoid.
                - RPE: Dopamine works on prediction errors; unpredictable rewards are best.

                Guidelines:
                1. Be concise and punchy.
                2. Use neuro-terminology (autonomic arousal, cortisol, friction, dopamine).
                3. Strictly output PLAIN TEXT. No Markdown. No bold. No bullet points with *. Use dashes (-) if needed.
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
                text: "Neural Link Online. I am ready to optimize your pursuit protocols." 
            }]);
        }
    }, []);

    // Effect to handle context updates without clearing chat
    useEffect(() => {
        if (chatSession && contextData.mode !== 'idle' && (contextData.title || contextData.description)) {
            // We don't necessarily want to send a message automatically every time, 
            // but we can log that the "focus" has shifted.
            console.log("Neural Assistant Context Shift:", contextData);
        }
    }, [contextData, chatSession]);

    const handleSend = async (overrideMsg?: string) => {
        const msgToSend = overrideMsg || inputValue;
        if (!msgToSend.trim() || !chatSession) return;

        setMessages(prev => [...prev, { role: 'user', text: msgToSend }]);
        setInputValue('');
        setIsLoading(true);

        try {
            // Add current context to the message to ensure AI knows what we are talking about
            const contextualPrompt = contextData.mode !== 'idle' 
                ? `[Context: Current Goal Title: "${contextData.title}", Description: "${contextData.description}"]\n\nUser Query: ${msgToSend}`
                : msgToSend;

            const resultStream = await chatSession.sendMessageStream({ message: contextualPrompt });
            
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
            setMessages(prev => [...prev, { role: 'model', text: "Neural connection interrupted. Please check your link." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        if (confirm("Reset conversation memory?")) {
            setMessages([{ role: 'model', text: "Memory cleared. Standing by for new input." }]);
            // Re-creating chat session would be better for a full reset
            if (process.env.API_KEY) {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const chat = ai.chats.create({
                    model: 'gemini-3-flash-preview',
                    config: {
                        systemInstruction: "You are the Neural Assistant coach. Output PLAIN TEXT only."
                    },
                });
                setChatSession(chat);
            }
        }
    };

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return createPortal(
        <div className={`fixed inset-y-0 right-0 z-[100] w-full sm:w-[400px] transform transition-transform duration-500 ease-in-out shadow-2xl flex flex-col bg-slate-900 border-l border-slate-700 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            {/* Glassmorphism Header */}
            <div className="p-4 border-b border-slate-700 bg-slate-900/80 backdrop-blur-md flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                        <Bot size={18} className="text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">Neural Assistant</h3>
                        <div className="flex items-center gap-1.5">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                             <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Active Link</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={clearChat}
                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                        title="Clear Memory"
                    >
                        <Trash2 size={16} />
                    </button>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-slate-500 hover:text-white transition-colors"
                        title="Minimize"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Context Indicator */}
            {contextData.mode !== 'idle' && (
                <div className="bg-indigo-950/30 px-4 py-2 border-b border-indigo-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Zap size={12} className="text-indigo-400 shrink-0" />
                        <span className="text-[11px] text-indigo-300 font-medium truncate">
                            Focus: {contextData.title || 'New Protocol'}
                        </span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold uppercase shrink-0">
                        {contextData.mode}
                    </span>
                </div>
            )}

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-950/40 custom-scrollbar">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        {msg.role === 'model' && (
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20 mt-1">
                                <Sparkles size={14} className="text-indigo-400" />
                            </div>
                        )}
                        
                        <div className={`relative group max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                            msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-900/20' 
                                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/50'
                        }`}>
                            <div className="whitespace-pre-wrap font-sans selection:bg-indigo-400/30">{msg.text}</div>
                            
                            {msg.role === 'model' && msg.text && (
                                <button 
                                    onClick={() => copyToClipboard(msg.text, idx)}
                                    className="absolute -bottom-7 left-0 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-slate-500 hover:text-indigo-400 flex items-center gap-1.5 py-1"
                                >
                                    {copiedIndex === idx ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                    {copiedIndex === idx ? 'PROTOCOL COPIED' : 'COPY TO PROTOCOL'}
                                </button>
                            )}
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-1 border border-slate-700">
                                <User size={14} className="text-slate-400" />
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                     <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                            <Sparkles size={14} className="text-indigo-400" />
                        </div>
                        <div className="bg-slate-800/50 rounded-2xl p-4 rounded-tl-none border border-slate-700/30 flex items-center gap-2">
                             <Loader2 size={14} className="animate-spin text-indigo-400" />
                             <span className="text-xs text-slate-500 font-mono">Synthesizing...</span>
                        </div>
                     </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-700 bg-slate-900/90 backdrop-blur-md shrink-0">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a query..."
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={isLoading || !inputValue.trim()}
                        className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-900/40 disabled:opacity-30 disabled:grayscale"
                    >
                        <Send size={20} />
                    </button>
                </div>
                <div className="mt-2 text-[9px] text-center text-slate-600 font-mono uppercase tracking-tighter">
                    Neural Engine: Gemini Flash Preview 3.0
                </div>
            </div>
        </div>,
        document.body
    );
};

export default NeuralAssistant;