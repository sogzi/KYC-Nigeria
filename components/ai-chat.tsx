'use client';

/**
 * NaijaVote AI Chat Widget
 *
 * Floating bottom-right chat button that opens a slide-up chat drawer.
 * Streams Claude responses in real time using the /api/chat endpoint.
 * Gracefully hides itself when ANTHROPIC_API_KEY is not configured.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircle, X, Send, Loader2, Bot, ChevronDown,
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

const STARTERS = [
  'Who are the main 2027 presidential candidates?',
  'How do I register to vote in Nigeria?',
  'What should I look for when choosing a candidate?',
  'When are the 2027 elections?',
];

export function AiChatWidget() {
  const [isOpen, setIsOpen]         = useState(false);
  const [isEnabled, setIsEnabled]   = useState<boolean | null>(null); // null = checking
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState('');
  const [isLoading, setIsLoading]   = useState(false);
  const bottomRef                   = useRef<HTMLDivElement>(null);
  const inputRef                    = useRef<HTMLInputElement>(null);
  const abortRef                    = useRef<AbortController | null>(null);

  // Check if chat API is available (has API key configured)
  useEffect(() => {
    fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [] }) })
      .then((r) => {
        // 400 = bad request (messages empty) = endpoint exists and is configured
        // 503 = not configured
        setIsEnabled(r.status !== 503);
      })
      .catch(() => setIsEnabled(false));
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: text };
    const withUser = [...messages, userMsg];
    setMessages([...withUser, { role: 'assistant', content: '', streaming: true }]);
    setInput('');
    setIsLoading(true);

    // Cancel any in-progress stream
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: withUser.map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Chat failed' }));
        throw new Error(error);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: accumulated,
            streaming: true,
          };
          return updated;
        });
      }

      // Mark stream complete
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: accumulated };
        return updated;
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content:
            err instanceof Error && err.message !== 'No stream'
              ? `⚠️ ${err.message}`
              : '⚠️ Something went wrong. Please try again.',
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  // Don't render if API not configured
  if (isEnabled === null || isEnabled === false) return null;

  return (
    <>
      {/* Chat Drawer */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-4 z-50 flex flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl"
          style={{ width: 'min(380px, calc(100vw - 2rem))', height: 'min(520px, calc(100dvh - 7rem))' }}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between bg-brand-green px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold leading-none text-white">NaijaVote AI</p>
                <p className="mt-0.5 text-[10px] text-white/70">Election guide · 2027</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col gap-3">
                <p className="text-center text-sm text-muted-foreground">
                  🇳🇬 Ask me anything about the 2027 elections
                </p>
                {STARTERS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="rounded-xl bg-secondary px-3 py-2.5 text-left text-xs font-medium text-gray-700 transition-colors hover:bg-muted"
                  >
                    {q}
                  </button>
                ))}
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-green/10">
                      <Bot className="h-3 w-3 text-brand-green" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'rounded-br-sm bg-brand-green text-white'
                        : 'rounded-bl-sm bg-secondary text-foreground'
                    }`}
                  >
                    {m.content ? (
                      m.content
                    ) : m.streaming ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t p-3">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about candidates, parties, voting..."
                className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-green text-white transition-opacity disabled:opacity-40 hover:bg-brand-green/90"
              >
                {isLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Send className="h-4 w-4" />
                }
              </button>
            </form>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
              AI may make mistakes · Verify from official sources
            </p>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? 'Close AI chat' : 'Open AI chat'}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-green text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
      >
        {isOpen
          ? <X className="h-6 w-6" />
          : (
            <div className="relative">
              <MessageCircle className="h-6 w-6" />
              <span className="absolute -right-1 -top-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-gold opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-brand-gold" />
              </span>
            </div>
          )
        }
      </button>
    </>
  );
}
