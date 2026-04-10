'use client';

import { useState, useEffect } from 'react';

interface PreshiftNote {
  id: string;
  message: string | null;
  specials: string[];
  eighty_sixed: string[];
  focus_items: string[];
  shift_date: string;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string } | null;
}

interface PreshiftBoardProps {
  language: 'en' | 'es';
  onDismiss: () => void;
}

export default function PreshiftBoard({ language, onDismiss }: PreshiftBoardProps) {
  const [note, setNote] = useState<PreshiftNote | null>(null);
  const [loading, setLoading] = useState(true);

  const isES = language === 'es';

  useEffect(() => {
    fetch('/api/preshift-notes')
      .then((r) => r.json())
      .then((d) => {
        setNote(d.note || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!note) return null;

  const hasSpecials = note.specials?.length > 0;
  const has86 = note.eighty_sixed?.length > 0;
  const hasFocus = note.focus_items?.length > 0;
  const hasMessage = note.message?.trim();

  // Don't render if completely empty
  if (!hasSpecials && !has86 && !hasFocus && !hasMessage) return null;

  const postedBy = note.profiles?.full_name || null;
  const postedTime = new Date(note.updated_at || note.created_at).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-amber-100/60 border-b border-amber-200">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h3 className="font-bold text-amber-900 text-sm">
            {isES ? 'Notas del Turno' : 'Pre-Shift Notes'}
          </h3>
          <span className="text-[10px] text-amber-600 bg-amber-200/60 px-2 py-0.5 rounded-full font-medium">
            {isES ? 'Hoy' : 'Today'}
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="text-amber-400 hover:text-amber-600 transition-colors text-sm leading-none"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Manager message */}
        {hasMessage && (
          <p className="text-gray-800 text-sm leading-relaxed">{note.message}</p>
        )}

        {/* Daily Specials */}
        {hasSpecials && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm">⭐</span>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                {isES ? 'Especiales del Día' : "Today's Specials"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {note.specials.map((item, i) => (
                <span
                  key={i}
                  className="inline-block bg-white border border-amber-200 text-gray-700 text-xs px-2.5 py-1 rounded-lg"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 86'd Items */}
        {has86 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm">🚫</span>
              <span className="text-xs font-bold text-red-700 uppercase tracking-wide">
                86&apos;d
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {note.eighty_sixed.map((item, i) => (
                <span
                  key={i}
                  className="inline-block bg-red-50 border border-red-200 text-red-700 text-xs px-2.5 py-1 rounded-lg font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Focus Items */}
        {hasFocus && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm">🎯</span>
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                {isES ? 'Enfoque de Hoy' : "Today's Focus"}
              </span>
            </div>
            <div className="space-y-1">
              {note.focus_items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-gray-700"
                >
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer: who posted and when */}
      <div className="px-4 py-2 border-t border-amber-100 flex items-center justify-between">
        <span className="text-[10px] text-amber-500">
          {postedBy
            ? isES
              ? `Publicado por ${postedBy} a las ${postedTime}`
              : `Posted by ${postedBy} at ${postedTime}`
            : isES
            ? `Publicado a las ${postedTime}`
            : `Posted at ${postedTime}`}
        </span>
      </div>
    </div>
  );
}
