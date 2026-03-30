'use client';

import { useState, useEffect } from 'react';

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

const RESTAURANT_COLORS: Record<string, string> = {
  'Ichiban Sushi': 'from-red-600 to-red-800',
  'Boru Ramen': 'from-orange-500 to-orange-700',
  'Shokudo': 'from-emerald-600 to-emerald-800',
  'Central Hub': 'from-[#1B3A6B] to-[#0F1E3C]',
};

const RESTAURANT_EMOJI: Record<string, string> = {
  'Ichiban Sushi': '🍣',
  'Boru Ramen': '🍜',
  'Shokudo': '🥢',
  'Central Hub': '☕',
};

function PinDots({ pin }: { pin: string }) {
  return (
    <div className="flex gap-4 justify-center my-6">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
            i < pin.length
              ? 'bg-white border-white scale-110'
              : 'bg-transparent border-white/40'
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
        const isDisabled = loading || (isConfirm && pin.length !== 4) || (!isBackspace && !isConfirm && pin.length >= 4);

        return (
          <button
            key={k}
            onClick={() => onKey(k)}
            disabled={isDisabled}
            className={`h-14 rounded-2xl text-lg font-bold transition-all active:scale-95 disabled:opacity-30 ${
              isBackspace
                ? 'bg-white/10 text-white hover:bg-white/20'
                : isConfirm
                ? 'bg-white text-[#1B3A6B] hover:bg-white/90'
                : 'bg-white/20 text-white hover:bg-white/30'
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

  // Shared state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Manager form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
    fetch(`/api/staff-list?restaurant_id=${selectedRestaurant.id}`)
      .then((r) => r.json())
      .then((d) => {
        setStaff(d.staff || []);
        setStaffLoading(false);
      })
      .catch(() => setStaffLoading(false));
  }, [selectedRestaurant]);

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
      if (pin.length === 4) await submitPinLogin(pin);
      return;
    }
    const newPin = pin + k;
    setPin(newPin);
    if (newPin.length === 4) {
      await submitPinLogin(newPin);
    }
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
      } else {
        window.location.href = '/dashboard';
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
        window.location.href = '/dashboard';
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
    setSelectedRestaurant(null);
    setSelectedStaff(null);
    setEmail('');
    setPassword('');
  };

  const filteredStaff = staff.filter((s) =>
    s.full_name.toLowerCase().includes(staffSearch.toLowerCase())
  );

  const firstName = selectedStaff?.full_name.split(' ')[0];

  return (
    <div className="min-h-screen bg-[#0F1E3C] flex flex-col items-center justify-center px-4 py-8">
      {/* Brand header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 mb-3">
          <span className="text-white font-bold text-xl tracking-tight">WHG</span>
        </div>
        <h1 className="text-white text-xl font-bold tracking-wide">
          Wong Hospitality Group
        </h1>
        <p className="text-[#7BA7D3] text-xs mt-1 tracking-widest uppercase">
          Team Portal
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-white/10 rounded-xl p-1 mb-6 gap-1">
        <button
          onClick={() => switchMode('staff')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            mode === 'staff'
              ? 'bg-white text-[#1B3A6B] shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Staff Login
        </button>
        <button
          onClick={() => switchMode('manager')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            mode === 'manager'
              ? 'bg-white text-[#1B3A6B] shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Manager / Owner
        </button>
      </div>

      {/* ─── STAFF FLOW ─── */}
      {mode === 'staff' && (
        <div className="w-full max-w-sm">
          {/* Step header */}
          {step > 1 && (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-4 transition-colors"
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
              <p className="text-white/70 text-sm text-center mb-4">Select your restaurant</p>
              {restaurantsLoading ? (
                <div className="text-center text-white/40 py-8 text-sm">Loading...</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {restaurants.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleRestaurantSelect(r)}
                      className={`bg-gradient-to-br ${
                        RESTAURANT_COLORS[r.name] || 'from-[#1B3A6B] to-[#0F1E3C]'
                      } rounded-2xl p-4 text-left shadow-lg hover:scale-105 transition-all active:scale-95 border border-white/10`}
                    >
                      <div className="text-2xl mb-2">
                        {RESTAURANT_EMOJI[r.name] || '🍽️'}
                      </div>
                      <p className="text-white font-bold text-sm leading-tight">{r.name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Staff Name Selection */}
          {step === 2 && selectedRestaurant && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{RESTAURANT_EMOJI[selectedRestaurant.name] || '🍽️'}</span>
                <p className="text-white font-semibold">{selectedRestaurant.name}</p>
              </div>
              <p className="text-white/60 text-sm mb-3">Select your name</p>

              <input
                type="text"
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                placeholder="Search..."
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 mb-3"
              />

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {staffLoading ? (
                  <div className="text-center text-white/40 py-6 text-sm">Loading...</div>
                ) : filteredStaff.length === 0 ? (
                  <div className="text-center text-white/40 py-6 text-sm">
                    {staffSearch ? 'No matches found.' : 'No staff found for this location.'}
                  </div>
                ) : (
                  filteredStaff.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleStaffSelect(s)}
                      className="w-full text-left px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white font-medium text-sm transition-all active:scale-98"
                    >
                      {s.full_name}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STEP 3: PIN Pad */}
          {step === 3 && selectedStaff && (
            <div className={`bg-gradient-to-br ${
              RESTAURANT_COLORS[selectedRestaurant?.name || ''] || 'from-[#1B3A6B] to-[#0F1E3C]'
            } rounded-3xl p-6 border border-white/10 shadow-2xl`}>
              <div className="text-center">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white text-xl font-bold">
                    {selectedStaff.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <p className="text-white font-bold text-lg">Hey, {firstName}!</p>
                <p className="text-white/60 text-xs mt-0.5">{selectedRestaurant?.name}</p>
              </div>

              <p className="text-white/70 text-sm text-center mt-4">Enter your 4-digit PIN</p>

              <PinDots pin={pin} />

              {error && (
                <div className="bg-red-500/20 border border-red-400/30 text-red-200 text-sm text-center px-4 py-2.5 rounded-xl mb-4">
                  {error}
                </div>
              )}

              <PinPad pin={pin} onKey={handlePinKey} loading={loading} />

              {loading && (
                <p className="text-white/50 text-xs text-center mt-4">Signing in...</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── MANAGER / OWNER FLOW ─── */}
      {mode === 'manager' && (
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-[#1B3A6B] text-lg font-bold mb-1 text-center">Manager Login</h2>
          <p className="text-gray-400 text-xs text-center mb-6">Use your email and password</p>

          <form onSubmit={handleManagerLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E86C1] text-gray-800 text-sm"
                placeholder="your@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E86C1] text-gray-800 text-sm"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B3A6B] hover:bg-[#2E86C1] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 text-sm mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>
      )}

      <p className="text-[#7BA7D3]/40 text-xs mt-8 text-center">
        © {new Date().getFullYear()} Wong Hospitality Group · Baton Rouge, LA
      </p>
    </div>
  );
}
