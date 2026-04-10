'use client';

import { useState, useEffect, useCallback } from 'react';

interface OwnerMessage {
  id: string;
  message: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export default function OwnerMessageEditor() {
  const today = new Date().toISOString().split('T')[0];
  const [messages, setMessages] = useState<OwnerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const loadMessages = useCallback(async () => {
    try {
      const r = await fetch(`/api/owner-messages/all?t=${Date.now()}`, { cache: 'no-store' });
      const d = await r.json();
      setMessages(d.messages || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const resetForm = () => {
    setEditingId(null);
    setMessageText('');
    setStartDate(today);
    setEndDate(today);
    setError('');
  };

  const startEdit = (m: OwnerMessage) => {
    setEditingId(m.id);
    setMessageText(m.message);
    setStartDate(m.start_date);
    setEndDate(m.end_date);
    setError('');
  };

  const handleSave = async () => {
    if (!messageText.trim()) {
      setError('Please write a message.');
      return;
    }
    if (endDate < startDate) {
      setError('End date must be on or after start date.');
      return;
    }

    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const res = await fetch('/api/owner-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          message: messageText,
          startDate,
          endDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save');
      } else {
        setSaved(true);
        resetForm();
        await loadMessages();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this owner message? Staff will stop seeing it immediately.')) return;
    try {
      await fetch(`/api/owner-messages?id=${id}`, { method: 'DELETE' });
      await loadMessages();
    } catch {
      // ignore
    }
  };

  const formatDate = (iso: string) => {
    const [y, m, d] = iso.split('-');
    return `${m}/${d}/${y.slice(2)}`;
  };

  const isActiveNow = (m: OwnerMessage) => m.start_date <= today && m.end_date >= today;
  const isUpcoming = (m: OwnerMessage) => m.start_date > today;
  const isExpired = (m: OwnerMessage) => m.end_date < today;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">💙</span>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Owner&apos;s Message</h3>
            <p className="text-[11px] text-gray-500">
              Motivational notes that appear on the Pre-Shift tab for every restaurant
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Form */}
        <div className="space-y-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
              <span>✍️</span> {editingId ? 'Edit Message' : 'New Message'}
            </label>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Proud of the team for crushing last weekend. Keep the energy up — you all are what makes WHG special."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          {saved && (
            <div className="bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-2.5 rounded-xl">
              Owner message saved.
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm"
            >
              {saving ? 'Saving...' : editingId ? 'Update Message' : 'Post Owner Message'}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm font-semibold"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Existing messages list */}
        {loading ? (
          <div className="text-center text-gray-400 text-sm py-4">Loading...</div>
        ) : messages.length > 0 ? (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">
              Scheduled Messages
            </p>
            <div className="space-y-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 mb-1">{m.message}</p>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <span>
                        {formatDate(m.start_date)} – {formatDate(m.end_date)}
                      </span>
                      {isActiveNow(m) && (
                        <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                          Live
                        </span>
                      )}
                      {isUpcoming(m) && (
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                          Upcoming
                        </span>
                      )}
                      {isExpired(m) && (
                        <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">
                          Expired
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(m)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-xs text-gray-400 hover:text-red-500 px-2 py-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
