'use client';

import { useState, useEffect, useRef } from 'react';
import { APP_VERSION } from '@/lib/changelog';
import { safeNextPath } from '@/lib/training-links';

interface Restaurant {
  id: string;
  name: string;
  slug?: string;
}

interface StaffMember {
  id: string;
  full_name: string;
}

type LoginMode = 'staff' | 'manager';
type StaffStep = 1 | 2 | 3; // 1=restaurant, 2=name, 3=pin

const PIN_MIN = 4;
const PIN_MAX = 8;

// Remembered last successful staff PIN login (so returning staff skip straight to the PIN pad)
const LAST_LOGIN_KEY = 'whg_last_login';

interface SavedLogin {
  restaurantId: string;
  restaurantName: string;
  profileId: string;
  profileName: string;
}

function readSavedLogin(): SavedLogin | null {
  try {
    const raw = localStorage.getItem(LAST_LOGIN_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedLogin;
    if (saved?.restaurantId && saved?.profileId && saved?.profileName) return saved;
  } catch {
    // ignore corrupt/unavailable storage
  }
  return null;
}

function clearSavedLogin() {
  try {
    localStorage.removeItem(LAST_LOGIN_KEY);
  } catch {
    // ignore
  }
}

// Each restaurant keeps its color as a quiet accent (Sept 2026 reskin):
// staff still spot "the red one," but the screen reads as one WHG brand.
const RESTAURANT_ACCENT: Record<string, string> = {
  'Ichiban Sushi': '#DC2626',
  'Boru Ramen': '#F97316',
  'Shokudo': '#10B981',
  'Central Hub': '#D9A94E',
};
const accentFor = (name?: string | null) => (name && RESTAURANT_ACCENT[name]) || '#D9A94E';

const RESTAURANT_EMOJI: Record<string, string> = {
  'Ichiban Sushi': '🍣',
  'Boru Ramen': '🍜',
  'Shokudo': '🥢',
  'Central Hub': '☕',
};

// White logos sit on the dark restaurant cards.
const RESTAURANT_LOGO_WHITE: Record<string, string> = {
  'Ichiban Sushi': '/logos/ichiban-white.png',
  'Boru Ramen': '/logos/boru-white.png',
  'Shokudo': '/logos/shokudo-white.png',
};

/**
 * PIN dot indicator. Renders 8 slots; fills based on length.
 * Tighter gap so 8 dots still fit comfortably on phone screens.
 */
function PinDots({ pin }: { pin: string }) {
  return (
    <div className="flex gap-2 justify-center my-6">
      {Array.from({ length: PIN_MAX }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full border-2 transition-all duration-150 ${
            i < pin.length
              ? 'bg-whg-gold border-whg-gold scale-110'
              : 'bg-transparent border-whg-dim/50'
          }`}
        />
      ))}
    </div>
  );
}

function PinPad({
  pin,
  onKey,
  loading,
}: {
  pin: string;
  onKey: (k: string) => void;
  loading: boolean;
}) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '←', '0', '✓'];

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-xs mx-auto">
      {keys.map((k) => {
        const isBackspace = k === '←';
        const isConfirm = k === '✓';
        // Confirm is enabled when PIN is 4-8 digits.
        // Digit keys are disabled once PIN reaches PIN_MAX (8).
        const isDisabled =
          loading ||
          (isConfirm && (pin.length < PIN_MIN || pin.length > PIN_MAX)) ||
          (!isBackspace && !isConfirm && pin.length >= PIN_MAX);

        return (
          <button
            key={k}
            onClick={() => onKey(k)}
            disabled={isDisabled}
            aria-label={isBackspace ? 'Delete' : isConfirm ? 'Sign in' : k}
            className={`h-14 rounded-2xl text-xl font-semibold tabular-nums transition-all active:scale-95 disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-whg-gold ${
              isBackspace
                ? 'bg-transparent text-whg-dim hover:text-whg-snow'
                : isConfirm
                ? 'bg-whg-gold text-whg-goldink hover:bg-whg-gold2'
                : 'bg-whg-card2 text-whg-snow border border-whg-line hover:border-whg-gold/40'
            }`}
          >
            {k}
          </button>
        );
      })}
    </div>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>('staff');
  const [step, setStep] = useState<StaffStep>(1);

  // Staff flow state
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [staffSearch, setStaffSearch] = useState('');
  const [pin, setPin] = useState('');

  // Remembered-login state: true while booted from a saved whg_last_login blob.
  const [isRemembered, setIsRemembered] = useState(false);
  // Profile id still awaiting validation against the fetched staff list (staleness check).
  const rememberedProfileIdRef = useRef<string | null>(null);

  // Shared state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Manager form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // On mount: if a previous PIN login was remembered, jump straight to the PIN step.
  useEffect(() => {
    const saved = readSavedLogin();
    if (!saved) return;
    rememberedProfileIdRef.current = saved.profileId;
    setSelectedRestaurant({ id: saved.restaurantId, name: saved.restaurantName || '' });
    setSelectedStaff({ id: saved.profileId, full_name: saved.profileName });
    setIsRemembered(true);
    setStep(3);
  }, []);

  // Load restaurants on mount
  useEffect(() => {
    fetch('/api/restaurants')
      .then((r) => r.json())
      .then((d) => {
        setRestaurants(d.restaurants || []);
        setRestaurantsLoading(false);
      })
      .catch(() => setRestaurantsLoading(false));
  }, []);

  // Load staff when restaurant is selected
  useEffect(() => {
    if (!selectedRestaurant) return;
    setStaffLoading(true);
    setStaff([]);
    setStaffSearch('');
    fetch(`/api/staff-list?restaurant_id=${selectedRestaurant.id}&t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        const list: StaffMember[] = d.staff || [];
        setStaff(list);
        setStaffLoading(false);
        // Staleness check: if the remembered person is no longer on this
        // restaurant's staff list, silently forget them and start fresh.
        const rememberedId = rememberedProfileIdRef.current;
        if (rememberedId) {
          if (list.some((s) => s.id === rememberedId)) {
            rememberedProfileIdRef.current = null; // validated
          } else {
            forgetSavedLogin();
          }
        }
      })
      .catch(() => setStaffLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRestaurant]);

  // Clear the remembered login and return to the normal restaurant-grid flow.
  const forgetSavedLogin = () => {
    clearSavedLogin();
    rememberedProfileIdRef.current = null;
    setIsRemembered(false);
    setSelectedRestaurant(null);
    setSelectedStaff(null);
    setPin('');
    setError('');
    setStep(1);
  };

  const handleRestaurantSelect = (r: Restaurant) => {
    setSelectedRestaurant(r);
    setError('');
    setStep(2);
  };

  const handleStaffSelect = (s: StaffMember) => {
    setSelectedStaff(s);
    setPin('');
    setError('');
    setStep(3);
  };

  const handlePinKey = async (k: string) => {
    if (k === '←') {
      setPin((p) => p.slice(0, -1));
      setError('');
      return;
    }
    if (k === '✓') {
      if (pin.length >= PIN_MIN && pin.length <= PIN_MAX) {
        await submitPinLogin(pin);
      }
      return;
    }
    if (pin.length >= PIN_MAX) return;
    setPin((p) => p + k);
  };

  const submitPinLogin = async (enteredPin: string) => {
    if (!selectedStaff) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: selectedStaff.id, pin: enteredPin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Incorrect PIN. Please try again.');
        setPin('');
        setLoading(false);
        return;
      } else {
        // Remember this login so next visit boots straight to the PIN step.
        try {
          const saved: SavedLogin = {
            restaurantId: selectedRestaurant?.id || '',
            restaurantName: selectedRestaurant?.name || '',
            profileId: selectedStaff.id,
            profileName: selectedStaff.full_name,
          };
          localStorage.setItem(LAST_LOGIN_KEY, JSON.stringify(saved));
        } catch {
          // storage unavailable — skip remembering
        }
        window.location.href = safeNextPath(new URLSearchParams(window.location.search).get('next'));
      }
    } catch {
      setError('Connection error. Please try again.');
      setPin('');
      setLoading(false);
    }
  };

  const handleManagerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Please try again.');
        setLoading(false);
      } else {
        window.location.href = safeNextPath(new URLSearchParams(window.location.search).get('next'));
      }
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  const goBack = () => {
    setError('');
    setPin('');
    if (step === 3) {
      setIsRemembered(false);
      rememberedProfileIdRef.current = null;
      setSelectedStaff(null);
      setStep(2);
    } else if (step === 2) {
      setSelectedRestaurant(null);
      setStep(1);
    }
  };

  const switchMode = (m: LoginMode) => {
    setMode(m);
    setError('');
    setPin('');
    setStep(1);
    setIsRemembered(false);
    rememberedProfileIdRef.current = null;
    setSelectedRestaurant(null);
    setSelectedStaff(null);
    setEmail('');
    setPassword('');
  };

  const filteredStaff = staff.filter((s) =>
    s.full_name.toLowerCase().includes(staffSearch.toLowerCase())
  );

  const firstName = selectedStaff?.full_name.split(' ')[0];

  const initials = (name: string) => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  // Past the restaurant grid the logo shrinks, so the whole PIN pad fits on a phone without scrolling.
  const compact = mode === 'staff' && step > 1;

  return (
    <div className="relative min-h-screen bg-whg-night flex flex-col items-center justify-center px-4 py-8 overflow-hidden">
      {/* Seigaiha waves in faint gold behind the logo — the same pattern family as the Quick Guide covers. */}
      <svg aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px] w-full" preserveAspectRatio="none">
        <defs>
          <pattern id="login-waves" patternUnits="userSpaceOnUse" width="48" height="24">
            <g fill="none" stroke="#D9A94E" strokeWidth="1">
              {[[24, 0], [24, 24], [0, 12], [48, 12]].map(([cx, cy]) =>
                [11.5, 8, 4.5].map((r) => <circle key={`${cx}-${cy}-${r}`} cx={cx} cy={cy} r={r} />))}
            </g>
          </pattern>
          <linearGradient id="login-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="login-mask"><rect width="100%" height="100%" fill="url(#login-fade)" /></mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#login-waves)" mask="url(#login-mask)" opacity="0.09" />
      </svg>
      <div aria-hidden className="pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-whg-gold/10 blur-3xl" />

      {/* Brand header */}
      <div className={`relative text-center transition-all ${compact ? 'mb-4' : 'mb-7'}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/whg.jpg"
          alt="Wong Hospitality Group"
          className={`object-cover mx-auto ring-1 ring-whg-gold/40 shadow-[0_18px_40px_rgba(0,0,0,0.5)] transition-all ${compact ? 'h-16 w-16 rounded-xl' : 'h-32 w-32 rounded-2xl'}`}
        />
        <p className={`text-whg-gold text-[11px] font-bold tracking-[0.3em] uppercase ${compact ? 'mt-2.5' : 'mt-4'}`}>
          Team Portal
        </p>
      </div>

      {/* Mode toggle */}
      <div className={`relative flex bg-whg-card border border-whg-line rounded-xl p-1 gap-1 ${compact ? 'mb-4' : 'mb-7'}`} role="tablist">
        {([['staff', 'Staff Login'], ['manager', 'Manager / Owner']] as const).map(([m, label]) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => switchMode(m)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-whg-gold ${
              mode === m ? 'bg-whg-gold text-whg-goldink shadow-sm' : 'text-whg-dim hover:text-whg-snow'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── STAFF FLOW ─── */}
      {mode === 'staff' && (
        <div className="relative w-full max-w-sm">
          {/* Step header */}
          {step > 1 && (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 text-whg-dim hover:text-whg-snow text-sm mb-4 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>
          )}

          {/* STEP 1: Restaurant Selection */}
          {step === 1 && (
            <div>
              <p className="text-whg-snow/80 text-sm text-center mb-4">Select your restaurant</p>
              {restaurantsLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map((i) => <div key={i} className="aspect-square rounded-2xl bg-whg-card/60 animate-pulse" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {restaurants.map((r) => {
                    const logoSrc = RESTAURANT_LOGO_WHITE[r.name];
                    return (
                      <button
                        key={r.id}
                        onClick={() => handleRestaurantSelect(r)}
                        className="group relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-b from-whg-card2 to-whg-card border border-whg-line hover:border-whg-gold/50 shadow-lg transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-whg-gold flex flex-col items-center justify-center p-4"
                      >
                        <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: accentFor(r.name) }} />
                        {logoSrc ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={logoSrc}
                            alt=""
                            className={`w-full flex-1 min-h-0 object-contain opacity-90 group-hover:opacity-100 transition-opacity ${r.name === 'Shokudo' ? 'scale-125' : 'p-1'}`}
                          />
                        ) : (
                          <div className="flex-1 flex items-center justify-center text-whg-gold/90 group-hover:text-whg-gold transition-colors">
                            {/* No logo yet (e.g. Central Hub) — a gold building mark instead of a tiny emoji. */}
                            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6M9 11h.01M15 11h.01" />
                            </svg>
                          </div>
                        )}
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-whg-dim group-hover:text-whg-snow transition-colors">{r.name}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Staff Name Selection */}
          {step === 2 && selectedRestaurant && (
            <div className="rounded-3xl bg-whg-card border border-whg-line overflow-hidden">
              <span aria-hidden className="block h-1" style={{ background: accentFor(selectedRestaurant.name) }} />
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  {RESTAURANT_LOGO_WHITE[selectedRestaurant.name] ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={RESTAURANT_LOGO_WHITE[selectedRestaurant.name]}
                      alt=""
                      className="h-8 w-auto object-contain"
                    />
                  ) : (
                    <span className="text-lg">{RESTAURANT_EMOJI[selectedRestaurant.name] || '🍽️'}</span>
                  )}
                  <div>
                    <p className="text-whg-snow font-semibold leading-tight">{selectedRestaurant.name}</p>
                    <p className="text-whg-dim text-xs">Tap your name</p>
                  </div>
                </div>

                <div className="relative mb-3">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-whg-dim" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
                  </svg>
                  <input
                    type="text"
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                    placeholder="Search your name"
                    aria-label="Search your name"
                    className="w-full pl-10 pr-4 py-2.5 bg-whg-night border border-whg-line rounded-xl text-whg-snow placeholder-whg-dim/70 text-sm focus:outline-none focus:ring-2 focus:ring-whg-gold/60"
                  />
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {staffLoading ? (
                    <div className="text-center text-whg-dim py-6 text-sm">Loading…</div>
                  ) : filteredStaff.length === 0 ? (
                    <div className="text-center text-whg-dim py-6 text-sm">
                      {staffSearch ? 'No matches found.' : 'No staff found for this location.'}
                    </div>
                  ) : (
                    filteredStaff.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleStaffSelect(s)}
                        className="w-full flex items-center gap-3 text-left px-3 py-2.5 bg-whg-night/60 hover:bg-whg-card2 border border-whg-line hover:border-whg-gold/40 rounded-xl text-whg-snow font-medium text-sm transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-whg-gold"
                      >
                        <span className="w-8 h-8 flex-shrink-0 rounded-full bg-whg-gold/12 border border-whg-gold/30 text-whg-gold text-[11px] font-bold flex items-center justify-center">
                          {initials(s.full_name)}
                        </span>
                        {s.full_name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PIN Pad */}
          {step === 3 && selectedStaff && (
            <div className="rounded-3xl bg-whg-card border border-whg-line shadow-2xl overflow-hidden">
              <span aria-hidden className="block h-1" style={{ background: accentFor(selectedRestaurant?.name) }} />
              <div className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-whg-night border-2 border-whg-gold/60 flex items-center justify-center mx-auto mb-3">
                    <span className="text-whg-gold text-xl font-bold">{initials(selectedStaff.full_name)}</span>
                  </div>
                  <p className="text-whg-snow font-bold text-lg">
                    {isRemembered ? `Welcome back, ${firstName}` : `Hey, ${firstName}!`}
                  </p>
                  <p className="text-whg-dim text-xs mt-0.5">{selectedRestaurant?.name}</p>
                  {isRemembered && (
                    <button
                      onClick={forgetSavedLogin}
                      className="text-whg-dim hover:text-whg-snow underline underline-offset-2 text-sm min-h-[44px] px-3 -mb-2 transition-colors"
                    >
                      Not you? Switch person
                    </button>
                  )}
                </div>

                <p className="text-whg-snow/75 text-sm text-center mt-4">
                  Enter your clock-in code, then tap ✓
                </p>

                <PinDots pin={pin} />

                {error && (
                  <div role="alert" className="bg-red-500/15 border border-red-400/30 text-red-200 text-sm text-center px-4 py-2.5 rounded-xl mb-4">
                    {error}
                  </div>
                )}

                <PinPad pin={pin} onKey={handlePinKey} loading={loading} />

                {loading && (
                  <p className="text-whg-dim text-xs text-center mt-4">Signing in…</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── MANAGER / OWNER FLOW ─── */}
      {mode === 'manager' && (
        <div className="relative w-full max-w-sm rounded-3xl bg-whg-card border border-whg-line shadow-2xl overflow-hidden">
          <span aria-hidden className="block h-1 bg-gradient-to-r from-whg-gold to-[#B8893A]" />
          <div className="p-7">
            <h2 className="text-whg-snow text-lg font-bold mb-1 text-center">Manager &amp; Owner sign-in</h2>
            <p className="text-whg-dim text-xs text-center mb-6">Use your email and password</p>

            <form onSubmit={handleManagerLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-[11px] font-semibold text-whg-dim mb-1.5 uppercase tracking-widest">
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-whg-night border border-whg-line rounded-xl text-whg-snow placeholder-whg-dim/60 text-sm focus:outline-none focus:ring-2 focus:ring-whg-gold/60"
                  placeholder="your@email.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-[11px] font-semibold text-whg-dim mb-1.5 uppercase tracking-widest">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-whg-night border border-whg-line rounded-xl text-whg-snow placeholder-whg-dim/60 text-sm focus:outline-none focus:ring-2 focus:ring-whg-gold/60"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && (
                <div role="alert" className="bg-red-500/15 border border-red-400/30 text-red-200 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-whg-gold hover:bg-whg-gold2 text-whg-goldink font-bold py-3 rounded-xl transition-colors disabled:opacity-60 text-sm mt-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-whg-gold2 focus-visible:ring-offset-2 focus-visible:ring-offset-whg-card"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in…
                  </span>
                ) : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      )}

      <p className="relative text-whg-dim/60 text-xs mt-10 text-center">
        © {new Date().getFullYear()} Wong Hospitality Group · Baton Rouge, LA · {APP_VERSION}
      </p>
    </div>
  );
}
