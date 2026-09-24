'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Profile } from '@/lib/types';
import { parseTrainingLink, type TrainingLink } from '@/lib/training-links';
import ManagerZoneBar from './ManagerZoneBar';
import type { SubView as BibleView } from './ManagerStandardsTab';
import { CALCULATORS, type CalculatorKey } from './ManagerCalculators';

const TabLoader = () => (
  <div className="flex-1 flex items-center justify-center text-whg-dim text-sm py-12">Loading…</div>
);
const ManagerStandardsTab = dynamic(() => import('./ManagerStandardsTab'), { loading: TabLoader, ssr: false });
const AcademyPanel = dynamic(() => import('./ManagerAcademyTab').then((m) => m.AcademyInMissionControl), { loading: TabLoader, ssr: false });
const CalculatorBlock = dynamic(() => import('./ManagerCalculators').then((m) => m.CalculatorBlock), { loading: TabLoader, ssr: false });

type Tab = 'home' | 'bible' | 'academy' | 'calculators';

/* ───────── Manager Resources (/resources) ─────────
 *
 * The learning half of the manager zone (Randy, Sept 2026): everything a
 * manager studies or looks up — the Manager Bible, Manager Academy
 * (lessons + manager videos), and the calculators. Mission Control keeps
 * the controls. Same Charcoal & Gold skin, so the whole manager zone reads
 * as one place; the gold band hops between the two rooms.
 */
export default function ResourcesDashboard({ profile }: { profile: Profile }) {
  const [tab, setTab] = useState<Tab>('home');
  const [bibleView, setBibleView] = useState<BibleView>('about');
  const [link, setLink] = useState<TrainingLink | null>(null);
  const [calc, setCalc] = useState<CalculatorKey>('true_cost');
  const firstName = profile.full_name.split(' ')[0];

  // ?tab=bible|academy|calculators, and shared Academy lesson / manager
  // video links (?lesson=…&zone=academy, ?video=…) open their tab.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const l = parseTrainingLink(window.location.search);
    if (l && l.kind !== 'start') {
      setLink(l);
      setTab('academy');
    } else {
      const t = q.get('tab');
      if (t === 'bible' || t === 'academy' || t === 'calculators') setTab(t);
    }
    if (window.location.search) {
      try { window.history.replaceState(null, '', '/resources'); } catch { /* ignore */ }
    }
  }, []);

  const openBible = (view: BibleView) => { setBibleView(view); setTab('bible'); };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'home', label: 'Home', icon: <Icon d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /> },
    { key: 'bible', label: 'Manager Bible', icon: <Icon d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5zM4 5.5v16M8 7h8M8 11h6" /> },
    { key: 'academy', label: 'Academy', icon: <Icon d="M2 9l10-5 10 5-10 5zM6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /> },
    { key: 'calculators', label: 'Calculators', icon: <Icon d="M7 2.5h10a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2zM8 6.5h8M8.5 11h1M11.5 11h1M14.5 11h1M8.5 14.5h1M11.5 14.5h1M14.5 14.5h1M8.5 18h7" /> },
  ];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <ManagerZoneBar zone="resources" />

      {/* Tabs */}
      <div className="flex-shrink-0 border-b border-whg-line bg-whg-night px-1 md:px-6">
        <div className="max-w-4xl mx-auto flex overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`tap-highlight relative flex items-center gap-2 px-3 md:px-5 py-3 text-[13px] md:text-sm font-semibold whitespace-nowrap transition-colors ${active ? 'text-whg-gold2' : 'text-whg-dim hover:text-whg-snow'}`}
              >
                <span className="[&_svg]:w-4 [&_svg]:h-4">{t.icon}</span>
                {t.label}
                {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-whg-gold rounded-t-full" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-whg-night to-whg-night2">
        {tab === 'home' && (
          <div className="flex-1 overflow-y-auto tab-content-enter">
            <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-whg-gold">Manager Resources</p>
                <h1 className="text-2xl md:text-3xl font-bold text-whg-snow mt-1">Learn it. Look it up.</h1>
                <p className="text-sm text-whg-dim mt-1.5 max-w-xl">
                  {firstName}, everything you study or reference as a WHG leader lives here: the standards, the Academy, and the numbers.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Tile
                  title="Manager Bible"
                  blurb="How to handle what the handbook doesn’t spell out: coaching, escalations, gray areas."
                  icon={<Icon d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5zM4 5.5v16M8 7h8M8 11h6" />}
                  onClick={() => openBible('read')}
                />
                <Tile
                  title="Manager Academy"
                  blurb="Lessons and videos across Leadership, Operations, and Administration."
                  icon={<Icon d="M2 9l10-5 10 5-10 5zM6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />}
                  onClick={() => setTab('academy')}
                />
                <Tile
                  title="Manager videos"
                  blurb="Training from ownership, grouped by Academy pillar."
                  icon={<Icon d="M3.5 5h17a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM10 9l5 3-5 3z" />}
                  onClick={() => setTab('academy')}
                />
                <Tile
                  title="Calculators"
                  blurb={CALCULATORS.map((c) => c.title).join(' · ')}
                  icon={<Icon d="M7 2.5h10a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2zM8 6.5h8M8.5 11h1M11.5 11h1M14.5 11h1M8.5 14.5h1M11.5 14.5h1M14.5 14.5h1M8.5 18h7" />}
                  onClick={() => setTab('calculators')}
                />
              </div>

              <button
                onClick={() => openBible('ask')}
                className="tap-highlight w-full flex items-center gap-4 p-4 md:p-5 rounded-2xl text-left bg-whg-card border border-whg-gold/40 hover:border-whg-gold transition-colors"
              >
                <span className="w-11 h-11 flex-shrink-0 rounded-xl bg-whg-gold text-whg-goldink flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5">
                  <Icon d="M4 5h16v11H9l-5 4z" />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-bold text-whg-snow">Ask the Manager Bible</span>
                  <span className="block text-sm text-whg-dim">Type a real situation, like “A server skipped pre-shift three times this week. What’s the right move?”</span>
                </span>
              </button>
            </div>
          </div>
        )}

        {tab === 'bible' && (
          <div className="flex-1 flex flex-col overflow-hidden tab-content-enter">
            <ManagerStandardsTab key={bibleView} profile={profile} initialView={bibleView} />
          </div>
        )}

        {tab === 'academy' && (
          <div className="flex-1 overflow-y-auto tab-content-enter mc-native">
            <AcademyPanel link={link} />
          </div>
        )}

        {tab === 'calculators' && (
          <div className="flex-1 overflow-y-auto tab-content-enter">
            <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-4">
              <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                {CALCULATORS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setCalc(c.key)}
                    className={`tap-highlight flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                      calc === c.key ? 'bg-whg-gold text-whg-goldink' : 'bg-whg-card text-whg-dim border border-whg-line hover:text-whg-snow'
                    }`}
                  >
                    {c.title}
                  </button>
                ))}
              </div>
              <p className="text-sm text-whg-dim">{CALCULATORS.find((c) => c.key === calc)?.blurb}</p>
              <div className="rounded-2xl bg-white border border-gray-200 p-4 md:p-5">
                <CalculatorBlock which={calc} language="en" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

function Tile({ title, blurb, icon, onClick }: { title: string; blurb: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="tap-highlight flex items-start gap-3.5 p-4 rounded-2xl text-left bg-whg-card border border-whg-line hover:border-whg-gold/50 transition-colors"
    >
      <span className="w-10 h-10 flex-shrink-0 rounded-xl bg-whg-gold/12 border border-whg-gold/35 text-whg-gold flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-bold text-whg-snow">{title}</span>
        <span className="block text-[13px] text-whg-dim leading-snug mt-0.5">{blurb}</span>
      </span>
    </button>
  );
}
