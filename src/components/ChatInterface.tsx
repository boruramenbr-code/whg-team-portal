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
}

export default function ChatInterface({ profile, pendingQuestion, onPendingQuestionConsumed, onHandbookSourceChange, language, onLanguageChange }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [handbookSource, setHandbookSource] = useState<'employee' | 'manager'>('employee');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isManager = ['manager', 'admin', 'assistant_manager'].includes(profile.role);
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

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, handbookSource, language }),
      });

      if (!res.ok || !res.body) throw new Error('Request failed');

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
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? {
                ...m,
                content:
                  "I'm having trouble connecting right now. Please try again in a moment.",
              }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }, [input, handbookSource, language, loading]);

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
          ? 'bg-[#1B3A6B] border-[#152d54]'
          : 'bg-white border-gray-100'
      }`}>
        <div className="flex items-center justify-between gap-3">
          {/* Manager handbook toggle (managers only) */}
          {isManager ? (
            <div className={`flex rounded-lg p-0.5 ${
              handbookSource === 'manager' ? 'bg-[#152d54]' : 'bg-gray-100'
            }`}>
              <button
                onClick={() => { setHandbookSource('employee'); onHandbookSourceChange?.('employee'); }}
                className={`py-1.5 px-3 text-xs font-semibold rounded-md transition-all ${
                  handbookSource === 'employee'
                    ? 'bg-white text-[#1B3A6B] shadow-sm'
                    : handbookSource === 'manager'
                    ? 'text-white/60 hover:text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Team Handbook
              </button>
              <button
                onClick={() => { setHandbookSource('manager'); onHandbookSourceChange?.('manager'); }}
                className={`py-1.5 px-3 text-xs font-semibold rounded-md transition-all ${
                  handbookSource === 'manager'
                    ? 'bg-[#2E86C1] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
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
            isManager && handbookSource === 'manager' ? 'bg-[#152d54]' : 'bg-gray-100'
          }`}>
            <button
              onClick={() => onLanguageChange('en')}
              className={`py-1 px-2.5 text-xs font-bold rounded-md transition-all ${
                language === 'en'
                  ? isManager && handbookSource === 'manager'
                    ? 'bg-white text-[#1B3A6B] shadow-sm'
                    : 'bg-white text-[#1B3A6B] shadow-sm'
                  : isManager && handbookSource === 'manager'
                  ? 'text-white/50 hover:text-white'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('es')}
              className={`py-1 px-2.5 text-xs font-bold rounded-md transition-all ${
                language === 'es'
                  ? isManager && handbookSource === 'manager'
                    ? 'bg-white text-[#1B3A6B] shadow-sm'
                    : 'bg-white text-[#1B3A6B] shadow-sm'
                  : isManager && handbookSource === 'manager'
                  ? 'text-white/50 hover:text-white'
                  : 'text-gray-400 hover:text-gray-600'
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
              handbookSource === 'manager' ? 'bg-[#1B3A6B]' : 'bg-[#EBF3FB]'
            }`}>
              <span className={`font-bold text-lg ${
                handbookSource === 'manager' ? 'text-white' : 'text-[#1B3A6B]'
              }`}>WHG</span>
            </div>
            <h3 className="text-[#1B3A6B] font-bold text-lg">
              {handbookSource === 'manager'
                ? 'Manager Reference'
                : language === 'es'
                ? `¡Hola, ${firstName}!`
                : greeting}
            </h3>
            <p className="text-gray-500 text-sm mt-1 max-w-xs">
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
                  className={`w-full text-left px-4 py-3 bg-white border rounded-xl text-sm transition-all ${
                    handbookSource === 'manager'
                      ? 'border-[#1B3A6B]/20 text-gray-700 hover:border-[#1B3A6B] hover:bg-[#1B3A6B]/5 hover:text-[#1B3A6B]'
                      : 'border-gray-200 text-gray-600 hover:border-[#2E86C1] hover:text-[#1B3A6B] hover:bg-[#EBF3FB]'
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
                msg.source === 'manager' ? 'bg-amber-600' : 'bg-[#1B3A6B]'
              }`}>
                <span className="text-white text-[10px] font-bold">W</span>
              </div>
            )}

            <div className="flex flex-col gap-1 max-w-[82%]">
              {msg.role === 'assistant' && msg.source === 'manager' && msg.content !== '' && (
                <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide pl-1">
                  Manager Reference
                </span>
              )}
              {msg.role === 'assistant' && msg.source === 'employee' && msg.content !== '' && (
                <span className="text-[10px] font-semibold text-[#2E86C1] uppercase tracking-wide pl-1">
                  Team Handbook
                </span>
              )}
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#1B3A6B] text-white rounded-br-sm'
                    : msg.source === 'manager'
                    ? 'bg-amber-50 text-gray-800 border border-amber-200 shadow-sm rounded-bl-sm'
                    : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm'
                }`}
              >
                {msg.content === '' && msg.role === 'assistant' ? (
                  <span className="flex gap-1 items-center py-0.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full typing-dot" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full typing-dot" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full typing-dot" />
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
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3">
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
            className="flex-1 resize-none px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E86C1] text-sm text-gray-800 bg-gray-50 disabled:opacity-60 transition-shadow"
            style={{ minHeight: '42px', maxHeight: '120px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-10 h-10 bg-[#1B3A6B] hover:bg-[#2E86C1] text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-40"
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
        <p className="text-center text-[10px] text-gray-400 mt-2">
          {language === 'es'
            ? 'Las respuestas se basan en el manual de WHG · Shift+Enter para nueva línea'
            : 'Answers are based on the WHG handbook only · Shift+Enter for new line'}
        </p>
      </div>
    </div>
  );
}
