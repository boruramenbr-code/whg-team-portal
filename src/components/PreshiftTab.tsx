'use client';

import { useState, useEffect, useCallback } from 'react';

interface TaggedItem {
  id: string;
  text: string;
  by: string | null;
  at: string;
}

interface PreshiftNote {
  id: string;
  message: string | null;
  specials: TaggedItem[];
  eighty_sixed: TaggedItem[];
  focus_items: TaggedItem[];
  shift_date: string;
  created_at: string;
  updated_at: string;
  creator_name?: string | null;
}

interface OwnerMessage {
  id: string;
  message: string;
  start_date: string;
  end_date: string;
}

interface Props {
  language: 'en' | 'es';
  restaurantName: string | null;
  restaurantId?: string | null;
}

export default function PreshiftTab({ language, restaurantName, restaurantId }: Props) {
  const [note, setNote] = useState<PreshiftNote | null>(null);
  const [ownerMessages, setOwnerMessages] = useState<OwnerMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const isES = language === 'es';

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const ridParam = restaurantId ? `&restaurant_id=${restaurantId}` : '';
      const [noteRes, ownerRes] = await Promise.all([
        fetch(`/api/preshift-notes?t=${Date.now()}${ridParam}`, { cache: 'no-store' }),
        fetch(`/api/owner-messages?t=${Date.now()}${ridParam}`, { cache: 'no-store' }),
      ]);
      const noteData = await noteRes.json();
      const ownerData = await ownerRes.json();
      setNote(noteData.note || null);
      setOwnerMessages(ownerData.messages || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const hasSpecials = (note?.specials?.length ?? 0) > 0;
  const has86 = (note?.eighty_sixed?.length ?? 0) > 0;
  const hasFocus = (note?.focus_items?.length ?? 0) > 0;
  const hasMessage = !!note?.message?.trim();
  const hasAnyContent = hasSpecials || has86 || hasFocus || hasMessage;

  const updatedTime = note
    ? new Date(note.updated_at || note.created_at).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#C5D3E2] via-[#CDDAE7] to-[#D5E0EB]">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Date header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isES ? 'Turno de Hoy' : "Today's Shift"}
            </h2>
            <p className="text-xs text-gray-500">
              {todayLabel}
              {restaurantName ? ` · ${restaurantName}` : ''}
            </p>
          </div>
          <button
            onClick={loadAll}
            className="text-xs text-gray-400 hover:text-gray-600"
            title="Refresh"
          >
            {isES ? 'Actualizar' : 'Refresh'}
          </button>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 text-sm py-12">Loading...</div>
        ) : (
          <>
            {/* Manager's Pre-Shift Note (primary) */}
            {hasAnyContent ? (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 bg-amber-100/60 border-b border-amber-200">
                  <span className="text-lg">📋</span>
                  <h3 className="font-bold text-amber-900 text-sm">
                    {isES ? 'Notas del Turno' : 'Pre-Shift Notes'}
                  </h3>
                </div>

                <div className="px-5 py-4 space-y-4">
                  {hasMessage && (
                    <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                      {note!.message}
                    </p>
                  )}

                  {hasSpecials && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-sm">⭐</span>
                        <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                          {isES ? 'Especiales del Día' : "Today's Specials"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {note!.specials.map((item, i) => (
                          <span
                            key={item.id || i}
                            className="inline-flex items-center gap-1.5 bg-white border border-amber-200 text-gray-700 text-xs px-2.5 py-1 rounded-lg"
                          >
                            {item.text}
                            {item.by && (
                              <span className="text-[9px] font-bold text-gray-400 uppercase">
                                {item.by}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {has86 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-sm">🚫</span>
                        <span className="text-xs font-bold text-red-700 uppercase tracking-wide">
                          86&apos;d
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {note!.eighty_sixed.map((item, i) => (
                          <span
                            key={item.id || i}
                            className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-xs px-2.5 py-1 rounded-lg font-medium"
                          >
                            {item.text}
                            {item.by && (
                              <span className="text-[9px] font-bold text-red-400 uppercase">
                                {item.by}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {hasFocus && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-sm">🎯</span>
                        <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                          {isES ? 'Enfoque de Hoy' : "Today's Focus"}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {note!.focus_items.map((item, i) => (
                          <div key={item.id || i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span className="flex-1">{item.text}</span>
                            {item.by && (
                              <span className="text-[9px] font-bold text-gray-400 uppercase mt-1">
                                {item.by}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-5 py-2 border-t border-amber-100">
                  <span className="text-[10px] text-amber-500">
                    {isES
                      ? `Última actualización a las ${updatedTime}`
                      : `Last updated at ${updatedTime}`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-gray-600 text-sm font-medium">
                  {isES
                    ? 'No hay notas del turno para hoy todavía.'
                    : 'No pre-shift note posted yet for today.'}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {isES
                    ? 'Revisa de nuevo antes de tu turno.'
                    : 'Check back closer to your shift.'}
                </p>
              </div>
            )}

            {/* Owner's Message(s) — subtle, below the manager note */}
            {ownerMessages.length > 0 && (
              <div className="space-y-2">
                {ownerMessages.map((m) => (
                  <div
                    key={m.id}
                    className="bg-indigo-50/60 border border-indigo-100 rounded-xl px-4 py-3 flex items-start gap-3"
                  >
                    <span className="text-base mt-0.5">💙</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide mb-0.5">
                        {isES ? 'Mensaje del Dueño' : "Owner's Message"}
                      </p>
                      <p className="text-sm text-indigo-900 leading-relaxed whitespace-pre-wrap">
                        {m.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
