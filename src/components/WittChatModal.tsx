import React, { useState } from 'react';
import { X, Send, Bot, Sparkles, User, Loader2 } from 'lucide-react';
import type { UserProgress } from '../types';
import { playClickSound } from '../services/sound';
import { wittLocalReply } from '../services/wittLocalReply';
import { getAccessToken } from '../services/authService';

interface WittChatModalProps {
  progress: UserProgress;
  isPremium: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'witt' | 'user';
  text: string;
  timestamp: string;
}

const WITT_CHAT_TIMEOUT_MS = 12_000;

const nowStamp = (): string => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const WittChatModal: React.FC<WittChatModalProps> = ({ progress, isPremium, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'witt',
      text: `Hi! I'm Witt, your training coach. Your current Sharpness is ${progress.sharpnessScore} with a ${progress.streakDays}-day streak. Ask me about streaks, logical fallacies, code scoping, or writing fluff — I'll do my best with a few quick tips!`,
      timestamp: nowStamp(),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusLabel, setStatusLabel] = useState<string>('Quick coach tips');

  const appendWittReply = (text: string, status: string) => {
    setStatusLabel(status);
    setMessages((prev) => [
      ...prev,
      {
        id: `witt-${Date.now()}`,
        sender: 'witt',
        text,
        timestamp: nowStamp(),
      },
    ]);
  };

  const fetchLlmReply = async (userText: string): Promise<string | null> => {
    const token = await getAccessToken();
    if (!token) return null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WITT_CHAT_TIMEOUT_MS);

    try {
      const res = await fetch('/api/witt-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userText,
          progressSnapshot: {
            sharpnessScore: progress.sharpnessScore,
            streakDays: progress.streakDays,
            beltRank: progress.beltRank,
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) return null;
      const data = (await res.json()) as { reply?: string };
      return data.reply?.trim() || null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || isLoading) return;
    playClickSound();

    const trimmedText = inputText.trim();
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: trimmedText,
      timestamp: nowStamp(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    if (!isPremium) {
      // Free tier: local tips only, no network call. Still gated behind
      // isLoading so the send button/input stay disabled during the delay
      // and a fast double-click/double-Enter can't queue two replies.
      setTimeout(() => {
        appendWittReply(wittLocalReply(trimmedText, progress), 'Quick tips');
        setIsLoading(false);
      }, 400);
      return;
    }

    fetchLlmReply(trimmedText)
      .then((reply) => {
        if (reply) {
          appendWittReply(reply, 'Witt coach');
        } else {
          appendWittReply(wittLocalReply(trimmedText, progress), 'Quick tips');
        }
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-fadeIn">
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
              <span className="text-[10px] font-bold" style={{ color: '#059669' }}>● {statusLabel}</span>
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

          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 mt-0.5"
                style={{ background: 'var(--accent-teal)' }}
              >
                <Bot className="w-4 h-4" />
              </div>
              <div
                className="max-w-[80%] p-3.5 rounded-2xl font-semibold flex items-center gap-2"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderBottomLeftRadius: 4 }}
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Thinking…</span>
              </div>
            </div>
          )}
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
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            className="p-2.5 rounded-xl text-white shrink-0 disabled:opacity-50"
            style={{ background: 'var(--accent-teal)' }}
            disabled={isLoading}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
