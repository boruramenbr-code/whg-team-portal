'use client';

import { useState, useEffect } from 'react';

interface WelcomeSplashProps {
  firstName: string;
  restaurantName: string | null;
  onComplete: () => void;
}

export default function WelcomeSplash({ firstName, restaurantName, onComplete }: WelcomeSplashProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    // Phase 1: Fade in (already happening via CSS)
    const holdTimer = setTimeout(() => setPhase('hold'), 100);

    // Phase 2: Start exit after 2.5 seconds
    const exitTimer = setTimeout(() => setPhase('exit'), 2500);

    // Phase 3: Remove component after exit animation
    const completeTimer = setTimeout(() => onComplete(), 3200);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#0F1E3C] flex flex-col items-center justify-center transition-opacity duration-700 ${
        phase === 'enter' ? 'opacity-0' : phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* WHG Logo */}
      <div
        className={`w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center mb-6 transition-all duration-700 ${
          phase === 'hold' ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
      >
        <span className="text-white font-bold text-3xl tracking-tight">WHG</span>
      </div>

      {/* Welcome text */}
      <div
        className={`text-center transition-all duration-700 delay-200 ${
          phase === 'hold' ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <h1 className="text-white text-2xl font-bold mb-1">
          Welcome, {firstName}
        </h1>
        {restaurantName && (
          <p className="text-[#7BA7D3] text-sm">
            {restaurantName}
          </p>
        )}
      </div>

      {/* Subtle tagline */}
      <p
        className={`text-[#7BA7D3]/50 text-xs mt-8 transition-all duration-700 delay-500 ${
          phase === 'hold' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        Wong Hospitality Group · Team Portal
      </p>
    </div>
  );
}
