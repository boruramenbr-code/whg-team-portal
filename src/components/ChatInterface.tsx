'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Profile } from '@/lib/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  source?: 'employee' | 'manager' | 'employee-es';
}

const EMPLOYEE_QUESTIONS_EN = [
  'What is the meal discount policy?',
  'What is the attendance and call-out policy?',
  'What are the dress code requirements?',
  'What is the progressive discipline policy?',
];

const EMPLOYEE_QUESTIONS_ES = [
  '¿Cuál es la política de descuento en comidas?',
  '¿Cuál es la política de asistencia y ausencias?',
  '¿Cuáles son los requisitos del código de vestimenta?',
  '¿Cuál es la política de disciplina progresiva?',
];

const MANAGER_QUESTIONS = [
  'What is the progressive discipline process?',
  'How do I handle a call-out or no-show?',
  'What are the steps for a performance coaching conversation?',
  'How do I handle a guest complaint escalation?',
];

interface ChatInterfaceProps {
  profile: Profile;
  pendingQuestion?: string | null;
  onPendingQuestionConsumed?: () => void;
  onHandbookSourceChange?: (source: 'employee' | 'manager') => void;
  language: 'en' | 'es';
  onLanguageChange: (lang: 'en' | 'es') => void;
  /**
   * If provided, locks the handbook source and hides the toggle.
   *   • 'employee' → staff portal: always queries staff handbook only
   *   • 'manager'  → Manager's Handbook Standards tab: always queries manager-only content
   * If omitted, defaults to 'employee' (no manager toggle).
   */
  forceSource?: 'employee' | 'manager';
}

export default function ChatInterface({ profile, pendingQuestion, onPendingQuestionConsumed, onHandbookSourceChange, language, onLanguageChange, forceSource }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [handbookSource, setHandbookSource] = useState<'employee' | 'manager'>(forceSource || 'employee');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isManager = ['manager', 'admin', 'assistant_manager'].includes(profile.role);
  // When forceSource is set, hide the toggle entirely. Used by the staff portal
  // (locks to 'employee') and the Manager's Handbook Standards tab (locks to 'manager').
  const showSourceToggle = isManager && !forceSource;
  const firstName = profile.full_name.split(' ')[0];
  const restaurantName = (profile.restaurants as { name?: string } | null)?.name || null;
  const greeting = restaurantName ? `Hey ${firstName} of ${restaurantName}!` : `Hey ${firstName}!`;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-send when a question is selected from the sidebar
  useEffect(() => {
    if (pendingQuestion) {
      sendMessage(pendingQuestion);
      onPendingQuestionConsumed?.();
    }
  }, [pendingQuestion]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const sendMessage = useCallback(async (questionText?: string) => {
    const question = (questionText || input).trim();
    if (!question || loading) return;

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setLoading(true);

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: question,
    };

    const assistantMsg: Message = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: '',
      source: handbookSource,
    };

    // Capture prior conversation BEFORE appending the new turns.
    // This becomes the "history" sent to the server so the AI can follow
    // context-dependent follow-ups ("yes", "what happens after?"). We filter
    // out any empty assistant placeholders and cap to the last 10 messages.
    const historyForServer = messages
      .filter((m) => m.content.trim().length > 0)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, handbookSource, language, history: historyForServer }),
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok || !res.body) {
        // Handle rate limit or other API errors gracefully
        let errorMsg = "I'm having trouble connecting right now. Please try again in a moment.";
        try {
          const errorData = await res.json();
          if (res.status === 429) {
            errorMsg = errorData.error || "You've reached the question limit. Please wait a bit before asking more.";
          } else if (errorData.error) {
            errorMsg = errorData.error;
          }
        } catch { /* use default message */ }
        throw new Error(errorMsg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') {
            setLoading(false);
            break;
          }
          try {
            const { text } = JSON.parse(data);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsg.id
                  ? { ...m, content: m.content + text }
                  : m
              )
            );
          } catch {
            // skip malformed chunk
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : "I'm having trouble connecting right now. Please try again in a moment.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: errorMessage }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }, [input, handbookSource, language, loading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top control bar — manager toggle + language toggle */}
      <div className={`px-4 py-2.5 border-b flex-shrink-0 transition-colors ${
        isManager && handbookSource === 'manager'
          ? 'bg-amber-400/10 border-amber-400/30'
          : 'bg-whg-card border-whg-line'
      }`}>
        <div className="flex items-center justify-between gap-3">
          {/* Manager handbook toggle (managers only, hidden when source is locked) */}
          {showSourceToggle ? (
            <div className={`flex rounded-lg p-0.5 ${
              handbookSource === 'manager' ? 'bg-whg-night/60' : 'bg-white/10'
            }`}>
              <button
                onClick={() => { setHandbookSource('employee'); onHandbookSourceChange?.('employee'); }}
                className={`py-1.5 px-3 text-xs font-semibold rounded-md transition-all ${
                  handbookSource === 'employee'
                    ? 'bg-whg-gold text-whg-goldink shadow-sm'
                    : handbookSource === 'manager'
                    ? 'text-whg-dim hover:text-whg-snow'
                    : 'text-whg-dim hover:text-whg-snow/90'
                }`}
              >
                Team Handbook
              </button>
              <button
                onClick={() => { setHandbookSource('manager'); onHandbookSourceChange?.('manager'); }}
                className={`py-1.5 px-3 text-xs font-semibold rounded-md transition-all ${
                  handbookSource === 'manager'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-whg-dim hover:text-whg-snow/90'
                }`}
              >
                Manager Reference
              </button>
            </div>
          ) : (
            <div /> /* spacer to keep language toggle right-aligned for employees */
          )}

          {/* Language toggle — EN / ES */}
          <div className={`flex rounded-lg p-0.5 flex-shrink-0 ${
            isManager && handbookSource === 'manager' ? 'bg-whg-night/60' : 'bg-white/10'
          }`}>
            <button
              onClick={() => onLanguageChange('en')}
              className={`py-1 px-2.5 text-xs font-bold rounded-md transition-all ${
                language === 'en'
                  ? isManager && handbookSource === 'manager'
                    ? 'bg-whg-gold text-whg-goldink shadow-sm'
                    : 'bg-whg-gold text-whg-goldink shadow-sm'
                  : isManager && handbookSource === 'manager'
                  ? 'text-whg-dim hover:text-whg-snow'
                  : 'text-whg-dim/70 hover:text-whg-dim'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('es')}
              className={`py-1 px-2.5 text-xs font-bold rounded-md transition-all ${
                language === 'es'
                  ? isManager && handbookSource === 'manager'
                    ? 'bg-whg-gold text-whg-goldink shadow-sm'
                    : 'bg-whg-gold text-whg-goldink shadow-sm'
                  : isManager && handbookSource === 'manager'
                  ? 'text-whg-dim hover:text-whg-snow'
                  : 'text-whg-dim/70 hover:text-whg-dim'
              }`}
            >
              ES
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pt-4 pb-8">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
              handbookSource === 'manager' ? 'bg-amber-400/10 border border-amber-400/30' : 'bg-whg-card2 border border-whg-line'
            }`}>
              <span className={`font-bold text-lg ${
                handbookSource === 'manager' ? 'text-amber-200' : 'text-whg-snow'
              }`}>WHG</span>
            </div>
            <h3 className="text-whg-snow font-bold text-lg">
              {handbookSource === 'manager'
                ? 'Manager Reference'
                : language === 'es'
                ? `¡Hola, ${firstName}!`
                : greeting}
            </h3>
            <p className="text-whg-dim text-sm mt-1 max-w-xs">
              {handbookSource === 'manager'
                ? 'Ask about policies, discipline, coaching, operations — straight from your reference guide.'
                : language === 'es'
                ? 'Pregúntame cualquier cosa del Manual del Equipo. Te doy la respuesta directa.'
                : 'Ask me anything from the Team Handbook. I\'ll give you the straight answer.'}
            </p>

            <div className="mt-6 w-full max-w-sm space-y-2">
              {(handbookSource === 'manager'
                ? MANAGER_QUESTIONS
                : language === 'es'
                ? EMPLOYEE_QUESTIONS_ES
                : EMPLOYEE_QUESTIONS_EN
              ).map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className={`w-full text-left px-4 py-3 bg-whg-card border rounded-xl text-sm transition-all ${
                    handbookSource === 'manager'
                      ? 'border-amber-400/30 text-whg-snow/90 hover:border-amber-400/60 hover:bg-amber-400/10 hover:text-amber-200'
                      : 'border-whg-line text-whg-dim hover:border-sky-400/40 hover:text-whg-snow hover:bg-whg-card2'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 ${
                msg.source === 'manager' ? 'bg-amber-500' : 'bg-whg-card2 border border-whg-line'
              }`}>
                <span className="text-whg-snow text-[10px] font-bold">W</span>
              </div>
            )}

            <div className="flex flex-col gap-1 max-w-[82%]">
              {msg.role === 'assistant' && msg.source === 'manager' && msg.content !== '' && (
                <span className="text-[10px] font-semibold text-amber-300 uppercase tracking-wide pl-1">
                  Manager Reference
                </span>
              )}
              {msg.role === 'assistant' && msg.source === 'employee' && msg.content !== '' && (
                <span className="text-[10px] font-semibold text-sky-300 uppercase tracking-wide pl-1">
                  Team Handbook
                </span>
              )}
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-whg-gold/15 border border-whg-gold/30 text-whg-snow rounded-br-sm'
                    : msg.source === 'manager'
                    ? 'bg-amber-400/10 text-whg-snow/90 border border-amber-400/30 shadow-sm rounded-bl-sm'
                    : 'bg-whg-card text-whg-snow/90 border border-whg-line shadow-sm rounded-bl-sm'
                }`}
              >
                {msg.content === '' && msg.role === 'assistant' ? (
                  <span className="flex gap-1 items-center py-0.5">
                    <span className="w-1.5 h-1.5 bg-whg-dim rounded-full typing-dot" />
                    <span className="w-1.5 h-1.5 bg-whg-dim rounded-full typing-dot" />
                    <span className="w-1.5 h-1.5 bg-whg-dim rounded-full typing-dot" />
                  </span>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-whg-card border-t border-whg-line px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              handbookSource === 'manager'
                ? 'Ask about the Manager Reference…'
                : language === 'es'
                ? 'Escribe tu pregunta aquí…'
                : 'Ask about the Team Handbook…'
            }
            rows={1}
            disabled={loading}
            className="flex-1 resize-none px-4 py-2.5 border border-whg-line rounded-xl focus:outline-none focus:border-whg-gold focus:ring-1 focus:ring-whg-gold/20 text-base md:text-sm text-whg-snow placeholder:text-whg-dim/60 bg-whg-card2 disabled:opacity-60 transition-shadow"
            style={{ minHeight: '42px', maxHeight: '120px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-10 h-10 bg-whg-gold hover:bg-whg-gold2 text-whg-goldink rounded-xl flex items-center justify-center transition-colors disabled:bg-white/10 disabled:text-whg-dim/50"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-center text-[10px] text-whg-dim/70 mt-2">
          {language === 'es'
            ? 'Las respuestas se basan en el manual de WHG · Shift+Enter para nueva línea'
            : 'Answers are based on the WHG handbook only · Shift+Enter for new line'}
        </p>
      </div>
    </div>
  );
}
