'use client';

import { useState } from 'react';
import { loginAction } from '@/app/actions/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await loginAction(email.trim(), password);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Hard navigation forces a full page load — avoids RSC soft-nav 503
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1E3C] flex flex-col items-center justify-center px-4">
      {/* Brand header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-4">
          <span className="text-white font-bold text-2xl tracking-tight">WHG</span>
        </div>
        <h1 className="text-white text-2xl font-bold tracking-wide">
          Wong Hospitality Group
        </h1>
        <p className="text-[#7BA7D3] text-sm mt-1 tracking-widest uppercase">
          Team Portal
        </p>
      </div>

      {/* Login card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <h2 className="text-[#1B3A6B] text-xl font-semibold mb-6 text-center">
          Sign In
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E86C1] text-gray-800 text-sm transition-shadow"
              placeholder="your@email.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E86C1] text-gray-800 text-sm transition-shadow"
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
            className="w-full bg-[#1B3A6B] hover:bg-[#2E86C1] text-white font-semibold py-3 rounded-xl transition-colors duration-200 disabled:opacity-60 text-sm mt-2"
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

        <p className="text-center text-xs text-gray-400 mt-6">
          Ichiban Sushi · Boru Ramen · Shokudo · Central Hub
        </p>
      </div>

      <p className="text-[#7BA7D3]/50 text-xs mt-6">
        © {new Date().getFullYear()} Wong Hospitality Group · Baton Rouge, LA
      </p>
    </div>
  );
}
