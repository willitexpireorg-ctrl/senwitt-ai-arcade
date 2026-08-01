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
      text: `Hi! I'm Witt, your training coach. Your current Sharpness is ${progress.sharpnessScore} with a ${progress.streakDays}-day streak. Ask me about streaks, logical fallacies, code scoping, or writing fluff — I'll do my best with a few quick tips!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    playClickSound();

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const promptLower = inputText.toLowerCase();
    setInputText('');

    setTimeout(() => {
      let replyText =
        `Nice question. Short daily reps in writing, logic, and code help you keep solving things yourself instead of always asking a tool first.`;

      if (promptLower.includes('streak') || promptLower.includes('belt')) {
        replyText = `You're on ${progress.beltRank} with a ${progress.streakDays}-day streak. Finish today's set to keep it going.`;
      } else if (promptLower.includes('fallacy') || promptLower.includes('logic')) {
        replyText = `Watch for weak arguments — circular reasoning, straw men, and attacks on the person instead of the claim. The logic games are good practice for spotting those.`;
      } else if (promptLower.includes('code') || promptLower.includes('scope')) {
        replyText = `Trace code by hand before you trust a suggested fix. Closures and shared loop variables still trip people up — our code drills target that.`;
      } else if (promptLower.includes('fluff') || promptLower.includes('writing')) {
        replyText = `Cut filler. Prefer short active sentences over corporate padding. The writing drills train that habit.`;
      }

      const wittReply: ChatMessage = {
        id: `witt-${Date.now()}`,
        sender: 'witt',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, wittReply]);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
      <div
        className="w-full max-w-md flex flex-col h-full shadow-2xl animate-slideLeft"
        style={{ background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-color)' }}
      >
        <div
          className="p-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border-color)', background: '#f0fdfa' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(145deg, #17a89a, #0f766e)' }}
            >
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                Witt Coach <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent-teal)' }} />
              </h3>
              <span className="text-[10px] font-bold" style={{ color: '#059669' }}>● Quick coach tips</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs leading-relaxed">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'witt' && (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 mt-0.5"
                  style={{ background: 'var(--accent-teal)' }}
                >
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className="max-w-[80%] p-3.5 rounded-2xl font-semibold"
                style={
                  msg.sender === 'user'
                    ? { background: 'var(--accent-coral)', color: '#fff', borderBottomRightRadius: 4 }
                    : { background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderBottomLeftRadius: 4 }
                }
              >
                <p>{msg.text}</p>
                <span className="block text-[9px] opacity-60 text-right mt-1">{msg.timestamp}</span>
              </div>

              {msg.sender === 'user' && (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 mt-0.5"
                  style={{ background: '#0284c7' }}
                >
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          className="p-3 flex items-center gap-2"
          style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface-soft)' }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask Witt about streaks, logic, code…"
            className="flex-1 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus-ring"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={handleSendMessage}
            className="p-2.5 rounded-xl text-white shrink-0"
            style={{ background: 'var(--accent-teal)' }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
