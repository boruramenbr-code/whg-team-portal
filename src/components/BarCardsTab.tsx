'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';

/* ───────── types ───────── */
interface BarCard {
  id: string;
  restaurant_id: string;
  employee_name: string;
  expiration_date: string;
  card_image_url: string;
  notes: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

interface Location {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  restaurantId: string | null;
  role: string;
}

/* ───────── status helpers ───────── */
type CardStatus = 'expired' | 'critical' | 'warning' | 'valid';

function getCardStatus(expirationDate: string): CardStatus {
  const now = new Date();
  const exp = new Date(expirationDate + 'T23:59:59');
  const diffDays = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays <= 14) return 'critical';
  if (diffDays <= 45) return 'warning';
  return 'valid';
}

function getDaysUntilExpiry(expirationDate: string): number {
  const now = new Date();
  const exp = new Date(expirationDate + 'T23:59:59');
  return Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const STATUS_CONFIG: Record<CardStatus, { label: string; bg: string; text: string; dot: string; border: string }> = {
  expired:  { label: 'Expired',       bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500',    border: 'border-red-200' },
  critical: { label: 'Expiring Soon', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', border: 'border-orange-200' },
  warning:  { label: 'Expiring',      bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500',  border: 'border-amber-200' },
  valid:    { label: 'Valid',          bg: 'bg-emerald-50',text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
};

/* ───────── image conversion helper ───────── */
// Converts HEIC files to JPEG using heic2any (WASM decoder — works in any browser).
// Also compresses oversized JPEGs/PNGs via Canvas.
async function convertToJpeg(file: File): Promise<File> {
  // Detect HEIC by MIME type OR file extension (some browsers report empty MIME for HEIC)
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    file.type === '' && /\.heic$/i.test(file.name) ||
    file.type === '' && /\.heif$/i.test(file.name) ||
    /\.heic$/i.test(file.name) ||
    /\.heif$/i.test(file.name);

  if (isHeic) {
    // Dynamically import heic2any (WASM-based, ~400KB, loads only when needed)
    const heic2any = (await import('heic2any')).default;
    const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
    const jpegBlob = Array.isArray(result) ? result[0] : result;
    const name = file.name.replace(/\.[^.]+$/, '.jpg');
    return new File([jpegBlob], name, { type: 'image/jpeg' });
  }

  // Already a supported format and under 4MB — use as-is
  const supported = ['image/jpeg', 'image/png', 'image/webp'];
  if (supported.includes(file.type) && file.size < 4 * 1024 * 1024) {
    return file;
  }

  // Compress oversized images via Canvas
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const maxDim = 2048;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) { reject(new Error('Conversion failed')); return; }
          const name = file.name.replace(/\.[^.]+$/, '.jpg');
          resolve(new File([blob], name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.85
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
    img.src = url;
  });
}

/* ───────── auto-crop helper ───────── */
// Crops an image file to the given region (percentages) using Canvas.
async function cropImage(
  file: File,
  crop: { top: number; left: number; width: number; height: number }
): Promise<File> {
  // Skip if crop is basically the full image
  if (crop.top <= 2 && crop.left <= 2 && crop.width >= 96 && crop.height >= 96) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const sx = Math.round((crop.left / 100) * img.width);
      const sy = Math.round((crop.top / 100) * img.height);
      const sw = Math.round((crop.width / 100) * img.width);
      const sh = Math.round((crop.height / 100) * img.height);

      const canvas = document.createElement('canvas');
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) { reject(new Error('Crop failed')); return; }
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.9
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
    img.src = url;
  });
}

/* ───────── main component ───────── */
export default function BarCardsTab({ restaurantId, role }: Props) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(restaurantId);
  const [cards, setCards] = useState<BarCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [viewingCard, setViewingCard] = useState<BarCard | null>(null);
  const [editingCard, setEditingCard] = useState<BarCard | null>(null);

  // Fetch locations
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/my-locations');
        const json = await res.json();
        const locs: Location[] = json.locations || [];
        setLocations(locs);
        if (locs.length > 0 && !activeLocationId) {
          setActiveLocationId(locs[0].id);
        }
      } catch {
        if (restaurantId) {
          setActiveLocationId(restaurantId);
        }
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch cards when location changes
  const fetchCards = useCallback(async () => {
    if (!activeLocationId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bar-cards?restaurantId=${activeLocationId}`);
      const json = await res.json();
      setCards(json.cards || []);
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [activeLocationId]);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  // Stats
  const stats = useMemo(() => {
    const expired = cards.filter(c => getCardStatus(c.expiration_date) === 'expired').length;
    const critical = cards.filter(c => getCardStatus(c.expiration_date) === 'critical').length;
    const warning = cards.filter(c => getCardStatus(c.expiration_date) === 'warning').length;
    const valid = cards.filter(c => getCardStatus(c.expiration_date) === 'valid').length;
    return { expired, critical, warning, valid, total: cards.length };
  }, [cards]);

  // Sort: expired first, then critical, warning, valid
  const sortedCards = useMemo(() => {
    const order: Record<CardStatus, number> = { expired: 0, critical: 1, warning: 2, valid: 3 };
    return [...cards].sort((a, b) => {
      const sa = getCardStatus(a.expiration_date);
      const sb = getCardStatus(b.expiration_date);
      if (order[sa] !== order[sb]) return order[sa] - order[sb];
      return new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime();
    });
  }, [cards]);

  const alertCards = useMemo(() =>
    cards.filter(c => ['expired', 'critical'].includes(getCardStatus(c.expiration_date))),
    [cards]
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this bar card? This cannot be undone.')) return;
    try {
      await fetch(`/api/bar-cards/${id}`, { method: 'DELETE' });
      setCards(prev => prev.filter(c => c.id !== id));
      setViewingCard(null);
    } catch {
      alert('Failed to delete card.');
    }
  };

  const handleUpdate = async (id: string, updates: Partial<BarCard>) => {
    try {
      const res = await fetch(`/api/bar-cards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
        setEditingCard(null);
      }
    } catch {
      alert('Failed to update card.');
    }
  };

  const hasMultipleLocations = locations.length > 1;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Location switcher */}
      {hasMultipleLocations && (
        <div className="border-b border-[#D6DEE8]/60 bg-[#C8D4E1] px-3 md:px-4 py-2 flex-shrink-0">
          <div className="flex flex-wrap gap-2 justify-center">
            {locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => setActiveLocationId(loc.id)}
                className={`tap-highlight px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeLocationId === loc.id
                    ? 'bg-white text-[#1B3A6B] shadow-md border-2 border-[#1B3A6B]/20'
                    : 'bg-white/40 text-gray-500 hover:bg-white/70 hover:text-gray-700 border-2 border-transparent'
                }`}
              >
                {loc.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

          {/* Alert banner */}
          {!loading && alertCards.length > 0 && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <p className="text-sm font-bold text-red-800">
                  {alertCards.length} card{alertCards.length !== 1 ? 's' : ''} need{alertCards.length === 1 ? 's' : ''} attention
                </p>
              </div>
              <div className="space-y-1.5">
                {alertCards.map(c => {
                  const days = getDaysUntilExpiry(c.expiration_date);
                  return (
                    <div key={c.id} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-red-700">{c.employee_name}</span>
                      <span className="text-red-600">
                        {days < 0 ? `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago` : `${days} day${days !== 1 ? 's' : ''} left`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stats bar */}
          {!loading && cards.length > 0 && (
            <div className="flex gap-2">
              {stats.expired > 0 && (
                <div className="flex-1 rounded-lg bg-red-50 border border-red-100 py-2 px-3 text-center">
                  <p className="text-lg font-bold text-red-600">{stats.expired}</p>
                  <p className="text-[10px] text-red-500 font-medium uppercase tracking-wide">Expired</p>
                </div>
              )}
              {stats.critical > 0 && (
                <div className="flex-1 rounded-lg bg-orange-50 border border-orange-100 py-2 px-3 text-center">
                  <p className="text-lg font-bold text-orange-600">{stats.critical}</p>
                  <p className="text-[10px] text-orange-500 font-medium uppercase tracking-wide">Critical</p>
                </div>
              )}
              {stats.warning > 0 && (
                <div className="flex-1 rounded-lg bg-amber-50 border border-amber-100 py-2 px-3 text-center">
                  <p className="text-lg font-bold text-amber-600">{stats.warning}</p>
                  <p className="text-[10px] text-amber-500 font-medium uppercase tracking-wide">Expiring</p>
                </div>
              )}
              <div className="flex-1 rounded-lg bg-emerald-50 border border-emerald-100 py-2 px-3 text-center">
                <p className="text-lg font-bold text-emerald-600">{stats.valid}</p>
                <p className="text-[10px] text-emerald-500 font-medium uppercase tracking-wide">Valid</p>
              </div>
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={() => setShowUpload(true)}
            className="tap-highlight w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1B3A6B] text-white font-semibold text-sm shadow-md hover:bg-[#15305A] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload Bar Card
          </button>

          {/* Card list */}
          {loading ? (
            <div className="text-center py-12 text-sm text-gray-400">Loading bar cards...</div>
          ) : sortedCards.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="16" rx="2"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <p className="text-sm text-gray-500 font-medium">No bar cards uploaded yet</p>
              <p className="text-xs text-gray-400 mt-1">Upload your team&apos;s alcohol certification cards to track expirations</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedCards.map(card => (
                <CardRow
                  key={card.id}
                  card={card}
                  onView={() => setViewingCard(card)}
                  onEdit={() => setEditingCard(card)}
                  onDelete={() => handleDelete(card.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload modal */}
      {showUpload && activeLocationId && (
        <UploadModal
          restaurantId={activeLocationId}
          onClose={() => setShowUpload(false)}
          onSuccess={(newCard: BarCard) => {
            setCards(prev => [...prev, newCard]);
            setShowUpload(false);
          }}
        />
      )}

      {/* View modal */}
      {viewingCard && (
        <ViewModal
          card={viewingCard}
          onClose={() => setViewingCard(null)}
          onDelete={() => handleDelete(viewingCard.id)}
        />
      )}

      {/* Edit modal */}
      {editingCard && (
        <EditModal
          card={editingCard}
          onClose={() => setEditingCard(null)}
          onSave={(updates) => handleUpdate(editingCard.id, updates)}
        />
      )}
    </div>
  );
}

/* ───────── card row ───────── */
function CardRow({ card, onView, onEdit, onDelete }: {
  card: BarCard;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = getCardStatus(card.expiration_date);
  const cfg = STATUS_CONFIG[status];
  const days = getDaysUntilExpiry(card.expiration_date);
  const expDate = new Date(card.expiration_date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-3 transition-all`}>
      <div className="flex items-center gap-3">
        {/* Thumbnail */}
        <button onClick={onView} className="tap-highlight flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.card_image_url} alt={card.employee_name} className="w-full h-full object-cover" />
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1B3A6B] truncate">{card.employee_name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            <span className={`text-xs font-medium ${cfg.text}`}>
              {status === 'expired'
                ? `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`
                : status === 'valid'
                  ? `Exp. ${expDate}`
                  : `${days} day${days !== 1 ? 's' : ''} left — ${expDate}`
              }
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onEdit} className="tap-highlight p-2 rounded-lg hover:bg-white/60 transition-colors" title="Edit">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button onClick={onDelete} className="tap-highlight p-2 rounded-lg hover:bg-red-100/60 transition-colors" title="Delete">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── upload modal ───────── */
function UploadModal({ restaurantId, onClose, onSuccess }: {
  restaurantId: string;
  onClose: () => void;
  onSuccess: (card: BarCard) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [scanning, setScanning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ocrDone, setOcrDone] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Shared: process a file (from camera capture or file picker) — convert, preview, OCR
  const processFile = async (raw: File) => {
    let f: File;
    try {
      f = await convertToJpeg(raw);
    } catch {
      f = raw;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));

    // Run OCR
    setScanning(true);
    setOcrDone(false);
    try {
      const fd = new FormData();
      fd.append('file', f);
      const res = await fetch('/api/bar-cards/ocr', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        if (data.employee_name && data.employee_name !== 'Unknown') {
          setEmployeeName(data.employee_name);
        }
        if (data.expiration_date) {
          setExpirationDate(data.expiration_date);
        }
        setOcrDone(true);
      }
    } catch {
      // OCR failed silently — user can enter manually
    } finally {
      setScanning(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0];
    if (!raw) return;
    await processFile(raw);
  };

  const handleCameraCapture = async (capturedFile: File) => {
    setShowCamera(false);
    await processFile(capturedFile);
  };

  const handleSubmit = async () => {
    if (!file || !employeeName.trim() || !expirationDate) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('restaurantId', restaurantId);
      fd.append('employeeName', employeeName.trim());
      fd.append('expirationDate', expirationDate);
      if (notes.trim()) fd.append('notes', notes.trim());

      const res = await fetch('/api/bar-cards', { method: 'POST', body: fd });
      const json = await res.json();
      if (res.ok && json.card) {
        onSuccess(json.card);
      } else {
        alert(json.error || 'Upload failed');
      }
    } catch {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-[#1B3A6B]">Upload Bar Card</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-light">✕</button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* File picker */}
          {!preview ? (
            <>
              {/* Instruction banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-[#1B3A6B] mb-1">Photo Tips</p>
                <ul className="text-[11px] text-blue-800 space-y-0.5 list-disc list-inside">
                  <li>Hold the card <strong>flat</strong> in <strong>landscape</strong> orientation</li>
                  <li>Make sure the <strong>name</strong> and <strong>expiration date</strong> are readable</li>
                  <li>Use the scanner for best results — it has a card guide overlay</li>
                </ul>
              </div>

              {/* Two action buttons: Scan Card + Choose from Library */}
              <div className="space-y-2.5">
                <button
                  onClick={() => setShowCamera(true)}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-[#1B3A6B] text-white rounded-xl font-semibold text-sm shadow-sm hover:bg-[#15305a] active:scale-[0.98] transition-all"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Scan Card
                </button>

                <label className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm cursor-pointer hover:border-[#1B3A6B]/40 hover:text-[#1B3A6B] active:scale-[0.98] transition-all">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Choose from Library
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="hidden" onChange={handleFileSelect} />
                </label>
              </div>
            </>
          ) : (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Card preview" className="w-full rounded-xl border border-gray-200 shadow-sm" />
              {scanning && (
                <div className="absolute inset-0 bg-white/80 rounded-xl flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-[#1B3A6B] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-medium text-[#1B3A6B]">Reading card...</p>
                </div>
              )}
              {ocrDone && !scanning && (
                <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">
                  ✓ Card read
                </div>
              )}
              <button
                onClick={() => { setFile(null); setPreview(null); setOcrDone(false); }}
                className="absolute top-2 left-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-black/70"
              >
                ✕
              </button>
            </div>
          )}

          {/* Name field */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Employee Name</label>
            <input
              type="text"
              value={employeeName}
              onChange={e => setEmployeeName(e.target.value)}
              placeholder="e.g. John Smith"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-[#1B3A6B] font-medium placeholder:text-gray-300 focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
            />
          </div>

          {/* Expiration date */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Expiration Date</label>
            <input
              type="date"
              value={expirationDate}
              onChange={e => setExpirationDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-[#1B3A6B] font-medium focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes <span className="text-gray-400 normal-case">(optional)</span></label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. RBS certified, ATC #12345"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-[#1B3A6B] font-medium placeholder:text-gray-300 focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!file || !employeeName.trim() || !expirationDate || uploading}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              !file || !employeeName.trim() || !expirationDate || uploading
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#1B3A6B] text-white shadow-md hover:bg-[#15305A]'
            }`}
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </span>
            ) : 'Save Bar Card'}
          </button>
        </div>
      </div>

      {/* In-app camera with card overlay */}
      {showCamera && (
        <CameraOverlay
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}

/* ───────── in-app camera with card cutout ───────── */
function CameraOverlay({ onCapture, onClose }: {
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  // Start camera on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (!active) { s.getTracks().forEach(t => t.stop()); return; }
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch {
        if (active) setError('Camera not available. Please use "Choose from Library" instead.');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [stream]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || capturing) return;

    setCapturing(true);

    // Draw the full video frame to canvas
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, vw, vh);

    // Stop the camera
    if (stream) stream.getTracks().forEach(t => t.stop());

    // Export as JPEG
    canvas.toBlob(
      (blob) => {
        if (!blob) { setCapturing(false); return; }
        const file = new File([blob], `barcard-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
      },
      'image/jpeg',
      0.92
    );
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <p className="text-white text-sm font-medium mb-1">Camera Unavailable</p>
          <p className="text-white/60 text-xs mb-6">{error}</p>
          <button onClick={onClose} className="px-6 py-2.5 bg-white text-gray-800 rounded-xl text-sm font-semibold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      {/* Camera viewfinder */}
      <div className="flex-1 relative overflow-hidden">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }}
        />

        {/* Dark overlay with transparent card cutout — forced above video layer on iOS */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)', pointerEvents: 'none' }}>
          {/* Top dark band */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '28%', background: 'rgba(0,0,0,0.55)' }} />
          {/* Bottom dark band */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '34%', background: 'rgba(0,0,0,0.55)' }} />
          {/* Left dark band */}
          <div style={{ position: 'absolute', top: '28%', left: 0, width: '8%', height: '38%', background: 'rgba(0,0,0,0.55)' }} />
          {/* Right dark band */}
          <div style={{ position: 'absolute', top: '28%', right: 0, width: '8%', height: '38%', background: 'rgba(0,0,0,0.55)' }} />

          {/* Card outline border + corner brackets */}
          <div style={{ position: 'absolute', left: '8%', top: '28%', width: '84%', height: '38%' }}>
            <div className="absolute inset-0 border-2 border-white/80 rounded-xl" />
            {/* Corner brackets */}
            <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-[3px] border-l-[3px] border-white rounded-tl-xl" />
            <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-[3px] border-r-[3px] border-white rounded-tr-xl" />
            <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-[3px] border-l-[3px] border-white rounded-bl-xl" />
            <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-[3px] border-r-[3px] border-white rounded-br-xl" />
          </div>

          {/* Guide text */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: '18%' }}>
            <p className="text-white text-center text-sm font-semibold drop-shadow-lg">
              Line up the card in the frame
            </p>
            <p className="text-white/70 text-center text-xs mt-1 drop-shadow">
              Hold steady and make sure text is readable
            </p>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="bg-black px-6 py-6 flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => { if (stream) stream.getTracks().forEach(t => t.stop()); onClose(); }}
          className="text-white/80 text-sm font-medium px-4 py-2"
        >
          Cancel
        </button>

        {/* Capture button */}
        <button
          onClick={handleCapture}
          disabled={capturing}
          className="w-[72px] h-[72px] rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
        >
          <div className={`w-[58px] h-[58px] rounded-full ${capturing ? 'bg-gray-400' : 'bg-white'} transition-colors`} />
        </button>

        {/* Spacer for centering */}
        <div className="w-16" />
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

/* ───────── view modal (full card image) ───────── */
function ViewModal({ card, onClose, onDelete }: {
  card: BarCard;
  onClose: () => void;
  onDelete: () => void;
}) {
  const status = getCardStatus(card.expiration_date);
  const cfg = STATUS_CONFIG[status];
  const expDate = new Date(card.expiration_date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-[#1B3A6B]">{card.employee_name}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label} — {expDate}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-light">✕</button>
        </div>
        <div className="p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.card_image_url} alt={card.employee_name} className="w-full rounded-xl border border-gray-200 shadow-sm" />
          {card.notes && (
            <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{card.notes}</p>
          )}
          <button
            onClick={onDelete}
            className="mt-4 w-full py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
          >
            Remove Bar Card
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── edit modal ───────── */
function EditModal({ card, onClose, onSave }: {
  card: BarCard;
  onClose: () => void;
  onSave: (updates: Partial<BarCard>) => void;
}) {
  const [name, setName] = useState(card.employee_name);
  const [expDate, setExpDate] = useState(card.expiration_date);
  const [notes, setNotes] = useState(card.notes || '');

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-[#1B3A6B]">Edit Bar Card</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-light">✕</button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Employee Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-[#1B3A6B] font-medium focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Expiration Date</label>
            <input
              type="date"
              value={expDate}
              onChange={e => setExpDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-[#1B3A6B] font-medium focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-[#1B3A6B] font-medium focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
            />
          </div>
          <button
            onClick={() => onSave({ employee_name: name.trim(), expiration_date: expDate, notes: notes.trim() || null })}
            disabled={!name.trim() || !expDate}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              !name.trim() || !expDate
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#1B3A6B] text-white shadow-md hover:bg-[#15305A]'
            }`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
