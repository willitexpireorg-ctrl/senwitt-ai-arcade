import React, { useState } from 'react';
import { X, Send, Bot, Sparkles, User } from 'lucide-react';
import type { UserProgress } from '../types';
import { playClickSound } from '../services/sound';

interface WittChatModalProps {
  progress: UserProgress;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'witt' | 'user';
  text: string;
  timestamp: string;
}

export const WittChatModal: React.FC<WittChatModalProps> = ({ progress, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'witt',
      text: `Hello! I'm Witt, your AI Cognitive Companion. Your current Sharpness is ${progress.sharpnessScore} with a ${progress.streakDays}-day streak. Ask me anything about cognitive training, formal logic fallacies, code scoping, or how to avoid AI dependency!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState<string>('');

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    playClickSound();

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    const promptLower = inputText.toLowerCase();
    setInputText('');

    setTimeout(() => {
      let replyText = `Great question! In cognitive maintenance, daily reps across Writing, Logic, and Code protect your independent processing capacity against AI offloading debt.`;

      if (promptLower.includes('streak') || promptLower.includes('belt')) {
        replyText = `You currently hold the ${progress.beltRank} with a ${progress.streakDays}-day streak! Keep completing daily sets to unlock Purple and Black Belt mastery.`;
      } else if (promptLower.includes('fallacy') || promptLower.includes('logic')) {
        replyText = `Formal fallacies (like Affirming the Consequent or Ad Hominem) occur when an argument's structural rules break down. Practicing our Logic games trains dual-process reasoning to catch hidden fallacies in AI text!`;
      } else if (promptLower.includes('code') || promptLower.includes('scope')) {
        replyText = `Code tracing exercises strengthen frontoparietal mental execution. Reading un-summarized code closures prevents Copilot-induced code reading decay!`;
      } else if (promptLower.includes('fluff') || promptLower.includes('writing')) {
        replyText = `Cutting AI fluff exercises your Broca & inferior frontal gyrus. Converting passive corporate filler into active, dense sentences keeps your drafting sharp!`;
      }

      const wittReply: ChatMessage = {
        id: `witt-${Date.now()}`,
        sender: 'witt',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, wittReply]);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end">
      <div className="w-full max-w-md bg-slate-950 border-l border-indigo-500/30 flex flex-col h-full shadow-2xl animate-slideLeft">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                Witt AI Coach <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              </h3>
              <span className="text-[10px] text-emerald-400 font-semibold">● Active Companion</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white bg-white/5 border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs leading-relaxed">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'witt' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] p-3.5 rounded-2xl ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-white/10 text-gray-200 border border-white/10 rounded-bl-none'
                }`}
              >
                <p>{msg.text}</p>
                <span className="block text-[9px] opacity-60 text-right mt-1">{msg.timestamp}</span>
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-white/10 bg-slate-900 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask Witt a question about your cognition..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleSendMessage}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/30 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
