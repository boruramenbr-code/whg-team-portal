'use client';

import { useState, useEffect, useCallback } from 'react';

interface PreshiftNote {
  id: string;
  message: string | null;
  specials: string[];
  eighty_sixed: string[];
  focus_items: string[];
  shift_date: string;
}

interface Restaurant {
  id: string;
  name: string;
}

interface Props {
  // If provided, shows restaurant picker (admin use). Otherwise, locked to user's own restaurant.
  restaurants?: Restaurant[];
  isAdmin?: boolean;
}

// Returns an ISO date string (YYYY-MM-DD) for today or tomorrow in the user's local timezone.
function getLocalDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  // Build YYYY-MM-DD in local time (not UTC) so late-night managers don't see the wrong day
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatFriendlyDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

type ShiftDay = 'today' | 'tomorrow';

export default function PreshiftEditor({ restaurants, isAdmin }: Props) {
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(
    restaurants && restaurants.length > 0 ? restaurants[0].id : ''
  );
  const [shiftDay, setShiftDay] = useState<ShiftDay>('today');
  const [message, setMessage] = useState('');
  const [specials, setSpecials] = useState<string[]>(['']);
  const [eightySixed, setEightySixed] = useState<string[]>(['']);
  const [focusItems, setFocusItems] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [existingNote, setExistingNote] = useState<PreshiftNote | null>(null);

  const shiftDate = getLocalDate(shiftDay === 'today' ? 0 : 1);
  const friendlyDate = formatFriendlyDate(shiftDate);

  const loadNote = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ date: shiftDate, t: String(Date.now()) });
      if (isAdmin && selectedRestaurantId) {
        params.set('restaurant_id', selectedRestaurantId);
      }
      const r = await fetch(`/api/preshift-notes?${params.toString()}`, { cache: 'no-store' });
      const d = await r.json();
      if (d.note) {
        setExistingNote(d.note);
        setMessage(d.note.message || '');
        setSpecials(d.note.specials?.length > 0 ? d.note.specials : ['']);
        setEightySixed(d.note.eighty_sixed?.length > 0 ? d.note.eighty_sixed : ['']);
        setFocusItems(d.note.focus_items?.length > 0 ? d.note.focus_items : ['']);
      } else {
        setExistingNote(null);
        setMessage('');
        setSpecials(['']);
        setEightySixed(['']);
        setFocusItems(['']);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [isAdmin, selectedRestaurantId, shiftDate]);

  useEffect(() => {
    loadNote();
  }, [loadNote]);

  const updateArrayItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    setter((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const addArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => [...prev, '']);
  };

  const removeArrayItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const body: Record<string, unknown> = {
        message,
        specials: specials.filter((s) => s.trim()),
        eightySixed: eightySixed.filter((s) => s.trim()),
        focusItems: focusItems.filter((s) => s.trim()),
        shiftDate,
      };
      if (isAdmin && selectedRestaurantId) {
        body.restaurantId = selectedRestaurantId;
      }

      const res = await fetch('/api/preshift-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to save');
      } else {
        setSaved(true);
        setExistingNote(data.note);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderArrayFields = (
    label: string,
    emoji: string,
    items: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    placeholder: string,
    colorClass: string
  ) => (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
        <span>{emoji}</span> {label}
      </label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => updateArrayItem(setter, i, e.target.value)}
              placeholder={placeholder}
              className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${colorClass}`}
            />
            {items.length > 1 && (
              <button
                onClick={() => removeArrayItem(setter, i)}
                className="text-gray-300 hover:text-red-400 transition-colors px-1"
                aria-label="Remove item"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => addArrayItem(setter)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          + Add another
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="text-center text-gray-400 text-sm py-4">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Pre-Shift Notes</h3>
              <p className="text-[11px] text-gray-500">
                {shiftDay === 'tomorrow'
                  ? 'Prepping tomorrow — not visible to staff until tomorrow'
                  : existingNote
                  ? "Editing today's note — changes go live immediately"
                  : 'Post a note for your team before their shift'}
              </p>
            </div>
          </div>
          {existingNote && shiftDay === 'today' && (
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              Live
            </span>
          )}
          {existingNote && shiftDay === 'tomorrow' && (
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              Drafted
            </span>
          )}
        </div>
      </div>

      {/* Today / Tomorrow toggle */}
      <div className="px-5 pt-4">
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs font-semibold">
          <button
            onClick={() => setShiftDay('today')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              shiftDay === 'today'
                ? 'bg-white text-[#1B3A6B] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setShiftDay('tomorrow')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              shiftDay === 'tomorrow'
                ? 'bg-white text-[#1B3A6B] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Tomorrow
          </button>
        </div>
        <p className="text-[11px] text-gray-500 mt-1.5">
          Editing note for <span className="font-semibold text-gray-700">{friendlyDate}</span>
          {shiftDay === 'tomorrow' && (
            <span className="text-blue-600">
              {' '}
              · goes live automatically at midnight
            </span>
          )}
        </p>
      </div>

      <div className="p-5 space-y-5">
        {/* Admin restaurant picker */}
        {isAdmin && restaurants && restaurants.length > 0 && (
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
              <span>🏢</span> Restaurant
            </label>
            <select
              value={selectedRestaurantId}
              onChange={(e) => setSelectedRestaurantId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">
              As an owner, you can post or edit pre-shift notes for any restaurant.
            </p>
          </div>
        )}

        {/* Manager message */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
            <span>💬</span> Shift Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hey team — busy night ahead. We have a private party of 20 coming in at 7. Let's nail it."
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
          />
        </div>

        {renderArrayFields(
          "Today's Specials",
          '⭐',
          specials,
          setSpecials,
          'e.g., Spicy Tuna Crispy Rice',
          'border-gray-200 focus:ring-amber-300'
        )}

        {renderArrayFields(
          "86'd Items",
          '🚫',
          eightySixed,
          setEightySixed,
          'e.g., Yellowtail, Edamame',
          'border-red-100 focus:ring-red-300'
        )}

        {renderArrayFields(
          "Today's Focus",
          '🎯',
          focusItems,
          setFocusItems,
          'e.g., Upsell the salmon special, keep ticket times under 15 min',
          'border-blue-100 focus:ring-blue-300'
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-2.5 rounded-xl">
            {error}
          </div>
        )}

        {saved && (
          <div className="bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-2.5 rounded-xl">
            Pre-shift note posted! Your team will see it when they log in.
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 text-sm"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </span>
          ) : existingNote ? (
            shiftDay === 'tomorrow' ? "Update Tomorrow's Note" : 'Update Pre-Shift Note'
          ) : shiftDay === 'tomorrow' ? (
            "Save Tomorrow's Note"
          ) : (
            'Post Pre-Shift Note'
          )}
        </button>
      </div>
    </div>
  );
}
