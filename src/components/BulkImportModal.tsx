'use client';

import { useState, useMemo, useRef } from 'react';
import { Restaurant, UserRole } from '@/lib/types';

interface BulkImportModalProps {
  restaurants: Restaurant[];
  onClose: () => void;
  onComplete: () => void;
}

interface ParsedRow {
  index: number; // 1-based row number for user-facing messages (header is row 1, data starts at row 2)
  full_name: string;
  restaurant_id: string;
  restaurant_label: string; // what they typed, for display
  role: UserRole;
  pin: string;
  email: string;
  password: string;
  date_of_birth: string | null;
  preferred_language: 'en' | 'es';
  errors: string[];
}

interface ImportResult {
  index: number;
  full_name: string;
  success: boolean;
  error?: string;
}

/* ── Tiny CSV/TSV parser (handles quoted fields with embedded commas/newlines) ── */
function parseDelimited(text: string): string[][] {
  // Detect delimiter: tab if any header line has a tab, else comma
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  const delim = firstLine.includes('\t') ? '\t' : ',';

  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"' && field === '') {
        inQuotes = true;
      } else if (c === delim) {
        cur.push(field);
        field = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++; // swallow \r\n
        cur.push(field);
        field = '';
        // Skip totally blank rows
        if (!(cur.length === 1 && cur[0] === '')) rows.push(cur);
        cur = [];
      } else {
        field += c;
      }
    }
  }
  // Final field/row flush
  if (field !== '' || cur.length > 0) {
    cur.push(field);
    if (!(cur.length === 1 && cur[0] === '')) rows.push(cur);
  }
  return rows;
}

/* ── Header normalization ── */
const HEADER_ALIASES: Record<string, string> = {
  // full_name
  'name': 'full_name',
  'full name': 'full_name',
  'fullname': 'full_name',
  'full_name': 'full_name',
  'employee': 'full_name',
  'employee name': 'full_name',
  // restaurant
  'restaurant': 'restaurant',
  'location': 'restaurant',
  'store': 'restaurant',
  'site': 'restaurant',
  // role
  'role': 'role',
  'position': 'role',
  'title': 'role',
  // pin
  'pin': 'pin',
  '4-digit pin': 'pin',
  // email
  'email': 'email',
  'email address': 'email',
  // password
  'password': 'password',
  'temp password': 'password',
  'temporary password': 'password',
  // dob
  'birthday': 'date_of_birth',
  'dob': 'date_of_birth',
  'birth date': 'date_of_birth',
  'birthdate': 'date_of_birth',
  'date of birth': 'date_of_birth',
  'date_of_birth': 'date_of_birth',
  // language
  'language': 'preferred_language',
  'lang': 'preferred_language',
  'preferred_language': 'preferred_language',
  'preferred language': 'preferred_language',
};

function normalizeHeader(h: string): string {
  const k = h.trim().toLowerCase().replace(/\s+/g, ' ');
  return HEADER_ALIASES[k] || '';
}

/* ── Value normalizers ── */
function normalizeRole(v: string): UserRole | null {
  const s = v.trim().toLowerCase();
  if (!s) return 'employee';
  if (['employee', 'staff', 'emp'].includes(s)) return 'employee';
  if (['manager', 'gm', 'general manager'].includes(s)) return 'manager';
  if (['asst manager', 'assistant manager', 'assistant_manager', 'asst', 'asst. manager', 'amgr'].includes(s))
    return 'assistant_manager';
  if (['admin', 'owner', 'administrator'].includes(s)) return 'admin';
  return null;
}

function normalizeLanguage(v: string): 'en' | 'es' | null {
  const s = v.trim().toLowerCase();
  if (!s) return 'en';
  if (['en', 'english', 'eng'].includes(s)) return 'en';
  if (['es', 'spanish', 'español', 'espanol', 'esp'].includes(s)) return 'es';
  return null;
}

function normalizeDate(v: string): string | null | 'INVALID' {
  const s = v.trim();
  if (!s) return null;
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // M/D/YYYY or MM/DD/YYYY (accept - or / separator)
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2}|\d{4})$/);
  if (m) {
    let [, mo, d, y] = m;
    if (y.length === 2) {
      // Two-digit year: assume 1900s for >=30, 2000s for <30 (matches typical hire DOB range)
      const yn = parseInt(y, 10);
      y = (yn >= 30 ? 1900 + yn : 2000 + yn).toString();
    }
    const month = mo.padStart(2, '0');
    const day = d.padStart(2, '0');
    return `${y}-${month}-${day}`;
  }
  return 'INVALID';
}

function resolveRestaurantId(input: string, restaurants: Restaurant[]): string | null {
  const s = input.trim().toLowerCase();
  if (!s) return null;
  // Exact id match
  const byId = restaurants.find((r) => r.id === input.trim());
  if (byId) return byId.id;
  // Slug match
  const bySlug = restaurants.find((r) => r.slug && r.slug.toLowerCase() === s);
  if (bySlug) return bySlug.id;
  // Exact name match
  const byName = restaurants.find((r) => r.name.toLowerCase() === s);
  if (byName) return byName.id;
  // Partial / first-word match (e.g. "ichiban" → "Ichiban Sushi", "central" → "Central Hub")
  const byPartial = restaurants.find((r) => {
    const n = r.name.toLowerCase();
    return n.startsWith(s) || s.startsWith(n.split(' ')[0]);
  });
  return byPartial ? byPartial.id : null;
}

/* ── Component ── */
export default function BulkImportModal({ restaurants, onClose, onComplete }: BulkImportModalProps) {
  const [rawText, setRawText] = useState('');
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number; batch: number; batchCount: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsed: ParsedRow[] = useMemo(() => {
    if (!rawText.trim()) return [];
    const rows = parseDelimited(rawText);
    if (rows.length < 2) return [];

    const headerRow = rows[0];
    const headerMap = headerRow.map(normalizeHeader);

    const dataRows = rows.slice(1).filter((r) => r.some((cell) => cell.trim() !== ''));

    return dataRows.map((cells, i) => {
      const get = (key: string) => {
        const idx = headerMap.indexOf(key);
        return idx >= 0 && idx < cells.length ? cells[idx].trim() : '';
      };

      const errors: string[] = [];

      const fullName = get('full_name');
      if (!fullName) errors.push('Name is required');

      const restaurantInput = get('restaurant');
      const restaurantId = resolveRestaurantId(restaurantInput, restaurants) || '';
      if (!restaurantInput) errors.push('Restaurant is required');
      else if (!restaurantId) errors.push(`Restaurant "${restaurantInput}" not found`);

      const role = normalizeRole(get('role')) || 'employee';
      if (get('role') && !normalizeRole(get('role'))) {
        errors.push(`Invalid role "${get('role')}"`);
      }

      const pin = get('pin');
      const email = get('email');
      const password = get('password');

      if (role === 'employee') {
        if (!/^\d{4,8}$/.test(pin)) errors.push('PIN must be 4 to 8 digits');
      } else {
        if (!email) errors.push('Email is required for managers/admin');
        else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.push('Invalid email format');
        if (password.length < 8) errors.push('Password must be at least 8 characters');
      }

      const dobRaw = get('date_of_birth');
      const dobNormalized = normalizeDate(dobRaw);
      let dob: string | null = null;
      if (dobNormalized === 'INVALID') {
        errors.push(`Birthday "${dobRaw}" not recognized — use YYYY-MM-DD or MM/DD/YYYY`);
      } else {
        dob = dobNormalized;
      }

      const lang = normalizeLanguage(get('preferred_language')) || 'en';
      if (get('preferred_language') && !normalizeLanguage(get('preferred_language'))) {
        errors.push(`Invalid language "${get('preferred_language')}" — use "en" or "es"`);
      }

      return {
        index: i + 2, // header is row 1
        full_name: fullName,
        restaurant_id: restaurantId,
        restaurant_label: restaurantInput,
        role,
        pin,
        email,
        password,
        date_of_birth: dob,
        preferred_language: lang,
        errors,
      };
    });
  }, [rawText, restaurants]);

  const validRows = parsed.filter((r) => r.errors.length === 0);
  const invalidRows = parsed.filter((r) => r.errors.length > 0);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setRawText(text);
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    setResults(null);
    setProgress({ current: 0, total: validRows.length, batch: 0, batchCount: 0 });

    // Batch into chunks of 8 — each batch creates ~8 Supabase auth users sequentially
    // (~5-8s per batch), which stays well under any serverless function timeout.
    const BATCH_SIZE = 8;
    const batches: typeof validRows[] = [];
    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      batches.push(validRows.slice(i, i + BATCH_SIZE));
    }

    const allResults: ImportResult[] = [];
    let processed = 0;

    for (let b = 0; b < batches.length; b++) {
      setProgress({
        current: processed,
        total: validRows.length,
        batch: b + 1,
        batchCount: batches.length,
      });

      const payload = {
        rows: batches[b].map((r) => ({
          full_name: r.full_name,
          restaurant_id: r.restaurant_id,
          role: r.role,
          pin: r.pin,
          email: r.email,
          password: r.password,
          date_of_birth: r.date_of_birth,
          preferred_language: r.preferred_language,
        })),
      };

      try {
        const res = await fetch('/api/admin/users/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          // Endpoint-level failure — mark every row in this batch as failed
          for (const r of batches[b]) {
            allResults.push({
              index: allResults.length,
              full_name: r.full_name,
              success: false,
              error: data.error || `Batch ${b + 1} failed`,
            });
          }
        } else {
          for (const r of (data.results || [])) {
            allResults.push({ ...r, index: allResults.length });
          }
        }
      } catch (err) {
        for (const r of batches[b]) {
          allResults.push({
            index: allResults.length,
            full_name: r.full_name,
            success: false,
            error: err instanceof Error ? err.message : 'Network error',
          });
        }
      }

      processed += batches[b].length;
      setProgress({
        current: processed,
        total: validRows.length,
        batch: b + 1,
        batchCount: batches.length,
      });
    }

    setResults(allResults);
    setImporting(false);
  };

  const handleClose = () => {
    if (results && results.some((r) => r.success)) {
      onComplete();
    }
    onClose();
  };

  /* Sample rows for the helper section */
  const sampleHeaders = 'full_name,restaurant,role,pin,email,password,date_of_birth,preferred_language';
  const sampleRow1 = 'Sarah Johnson,Ichiban,employee,4521,,,1992-06-15,en';
  const sampleRow2 = 'Maria Lopez,Boru,employee,7890,,,1988-03-22,es';
  const sampleRow3 = 'Alex Chen,Boru,manager,,alex@whg.com,TempPass123!,1985-11-04,en';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl shadow-2xl my-auto">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-lg font-bold text-[#1B3A6B]">Bulk Import Staff</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Paste from your spreadsheet or upload a CSV. Creates accounts, sets PINs, and saves birthdays in one shot.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* RESULTS PANEL — shown after import */}
        {results ? (
          <div className="mt-5">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="text-2xl font-bold text-emerald-700">
                  {results.filter((r) => r.success).length}
                </div>
                <div className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Created</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="text-2xl font-bold text-red-700">
                  {results.filter((r) => !r.success).length}
                </div>
                <div className="text-xs text-red-600 font-semibold uppercase tracking-wide">Failed</div>
              </div>
            </div>

            {results.some((r) => !r.success) && (
              <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
                <div className="bg-gray-50 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Failed Rows
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {results
                    .filter((r) => !r.success)
                    .map((r, i) => (
                      <div key={i} className="px-4 py-2 border-t border-gray-100 first:border-t-0 text-sm">
                        <span className="font-semibold text-gray-700">{r.full_name || `Row ${r.index + 2}`}</span>
                        <span className="text-red-600 ml-2">— {r.error}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setResults(null);
                  setRawText('');
                }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Import More
              </button>
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 bg-[#1B3A6B] hover:bg-[#2E86C1] text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* INSTRUCTIONS */}
            <details className="mt-4 mb-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-900">
              <summary className="font-semibold cursor-pointer">📋 Format guide (click to expand)</summary>
              <div className="mt-3 space-y-2">
                <p><strong>Columns (any order, headers are case-insensitive):</strong></p>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  <li><code>full_name</code> or <code>name</code> — required</li>
                  <li><code>restaurant</code> or <code>location</code> — required (Ichiban, Boru, Shokudo, Central Hub)</li>
                  <li><code>role</code> — employee / manager / assistant_manager / admin (default: employee)</li>
                  <li><code>pin</code> — 4 to 8 digits, required for employees (matches their 7shifts clock-in code)</li>
                  <li><code>email</code> + <code>password</code> — required for managers / admin</li>
                  <li><code>date_of_birth</code> or <code>birthday</code> — YYYY-MM-DD or MM/DD/YYYY (optional)</li>
                  <li><code>preferred_language</code> or <code>lang</code> — en / es (default: en)</li>
                </ul>
                <p className="pt-1"><strong>Sample (paste-able):</strong></p>
                <pre className="bg-white border border-blue-200 rounded p-2 overflow-x-auto text-[11px] leading-relaxed font-mono">
{sampleHeaders}
{'\n'}{sampleRow1}
{'\n'}{sampleRow2}
{'\n'}{sampleRow3}
                </pre>
                <p className="text-[11px] text-blue-700 pt-1">
                  💡 Easiest path: select the rows in Google Sheets / Excel and paste directly into the box below. Tabs work just as well as commas.
                </p>
              </div>
            </details>

            {/* INPUT AREA */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Paste your roster
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-[#2E86C1] hover:underline font-semibold"
                >
                  or upload a CSV file
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
                  onChange={handleFile}
                  className="hidden"
                />
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={6}
                placeholder="Paste rows from your spreadsheet here (include the header row)..."
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#2E86C1] resize-y"
              />
            </div>

            {/* PREVIEW */}
            {parsed.length > 0 && (
              <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Preview — {parsed.length} row{parsed.length === 1 ? '' : 's'}
                  </span>
                  <span className="text-xs">
                    <span className="text-emerald-700 font-semibold">{validRows.length} valid</span>
                    {invalidRows.length > 0 && (
                      <span className="text-red-600 font-semibold ml-2">{invalidRows.length} with errors</span>
                    )}
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr className="text-left text-gray-500">
                        <th className="px-3 py-2 font-semibold">#</th>
                        <th className="px-3 py-2 font-semibold">Name</th>
                        <th className="px-3 py-2 font-semibold">Restaurant</th>
                        <th className="px-3 py-2 font-semibold">Role</th>
                        <th className="px-3 py-2 font-semibold">PIN/Email</th>
                        <th className="px-3 py-2 font-semibold">Birthday</th>
                        <th className="px-3 py-2 font-semibold">Lang</th>
                        <th className="px-3 py-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.map((r) => (
                        <tr
                          key={r.index}
                          className={`border-t border-gray-100 ${r.errors.length > 0 ? 'bg-red-50' : ''}`}
                        >
                          <td className="px-3 py-2 text-gray-400">{r.index}</td>
                          <td className="px-3 py-2 font-semibold text-gray-700">{r.full_name || '—'}</td>
                          <td className="px-3 py-2 text-gray-600">
                            {r.restaurant_id
                              ? restaurants.find((x) => x.id === r.restaurant_id)?.name
                              : <span className="text-red-600">{r.restaurant_label || '—'}</span>}
                          </td>
                          <td className="px-3 py-2 text-gray-600 capitalize">{r.role.replace('_', ' ')}</td>
                          <td className="px-3 py-2 text-gray-600 font-mono">
                            {r.role === 'employee' ? r.pin || '—' : r.email || '—'}
                          </td>
                          <td className="px-3 py-2 text-gray-600 font-mono">{r.date_of_birth || '—'}</td>
                          <td className="px-3 py-2 text-gray-600 uppercase">{r.preferred_language}</td>
                          <td className="px-3 py-2">
                            {r.errors.length === 0 ? (
                              <span className="text-emerald-700 font-semibold">✓</span>
                            ) : (
                              <span className="text-red-600" title={r.errors.join('; ')}>
                                ⚠ {r.errors.length}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {invalidRows.length > 0 && (
                  <div className="bg-red-50 border-t border-red-100 px-4 py-2 text-[11px] text-red-700">
                    Rows with errors will be skipped. Hover the warning icon to see details, or fix the source and re-paste.
                  </div>
                )}
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing || validRows.length === 0}
                className="flex-1 py-2.5 bg-[#1B3A6B] hover:bg-[#2E86C1] text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {importing && progress
                  ? `Importing batch ${progress.batch}/${progress.batchCount} — ${progress.current}/${progress.total} done...`
                  : importing
                  ? 'Importing...'
                  : validRows.length === 0
                  ? 'Nothing to import'
                  : `Import ${validRows.length} row${validRows.length === 1 ? '' : 's'}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
