'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * WelcomeWizard — first-login onboarding flow.
 *
 * Replaces the two consecutive popups (welcome note + Our Story) with a
 * single sequential 4-step experience. Fires once per user — the trigger
 * is `profiles.wizard_completed_at IS NULL`. Migration 052 backfills the
 * column for veterans so they never see this.
 *
 * Steps (mobile-only steps marked):
 *   1. Install on your phone  [mobile only — auto-skipped on desktop]
 *   2. Welcome from ownership
 *   3. Our Story, Mission & Values
 *   4. Your onboarding checklist (intro + CTA into the checklist)
 *
 * The wizard is a full-screen overlay (z-50). On completion, calls
 * /api/wizard/complete which stamps wizard_completed_at + backfills
 * welcome_dismissed_at + story_acknowledged_at if null.
 */

type DeviceKind = 'ios' | 'android' | 'desktop';

interface Props {
  firstName: string;
  restaurantName: string | null;
  /** Called once the wizard finishes (or determines it should not show). */
  onComplete: () => void;
  /** Called when user hits "Let's get started" — navigate to checklist. */
  onGoToChecklist: () => void;
  /**
   * Replay mode — when true, show every step regardless of whether the
   * user has already acknowledged welcome/story. Used by the
   * "Watch intro again" link on the Onboarding tab.
   */
  forceReplay?: boolean;
}

interface WelcomeData {
  content: string | null;
  content_es: string | null;
  dismissed: boolean;
}

interface StoryData {
  title: string | null;
  body: string | null;
  acknowledged: boolean;
}

export default function WelcomeWizard({ firstName, restaurantName, onComplete, onGoToChecklist, forceReplay = false }: Props) {
  const [device, setDevice] = useState<DeviceKind>('desktop');
  const [welcome, setWelcome] = useState<WelcomeData | null>(null);
  const [story, setStory] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Detect device on mount. iOS Safari: needs manual Share→Add to Home Screen.
  // Android Chrome: support beforeinstallprompt (handled lazily below).
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) setDevice('ios');
    else if (/Android/.test(ua)) setDevice('android');
    else setDevice('desktop');
  }, []);

  // Already-installed check — when launched from a PWA shortcut, the
  // window is in 'standalone' display mode. No need to nag them again.
  const isInstalled = typeof window !== 'undefined'
    && (window.matchMedia?.('(display-mode: standalone)').matches
        || (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

  // Step list — dynamic, skipping anything the user has already done.
  //   • install: hidden on desktop or PWA-installed
  //   • welcome: hidden if welcome already dismissed (unless replay)
  //   • story:   hidden if story already acknowledged (unless replay)
  //   • checklist: always shown — the closing CTA
  const steps: Array<'install' | 'welcome' | 'story' | 'checklist'> = (() => {
    const list: Array<'install' | 'welcome' | 'story' | 'checklist'> = [];
    if (device !== 'desktop' && !isInstalled) list.push('install');
    if (forceReplay || !welcome?.dismissed) list.push('welcome');
    if (forceReplay || !story?.acknowledged) list.push('story');
    list.push('checklist');
    return list;
  })();

  const currentStep = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;
  const isFirst = stepIdx === 0;

  // Fetch welcome + Our Story content on mount in parallel.
  // Both endpoints return the dismissed/acknowledged flags so we can skip
  // any step the user has already completed.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [welcomeRes, storyRes] = await Promise.all([
          fetch('/api/welcome').then((r) => r.json()).catch(() => null),
          fetch('/api/our-story').then((r) => r.json()).catch(() => null),
        ]);
        if (cancelled) return;
        setWelcome(welcomeRes?.message
          ? {
              content: welcomeRes.message.content ?? null,
              content_es: welcomeRes.message.content_es ?? null,
              dismissed: !!welcomeRes.dismissed,
            }
          : null);
        setStory(storyRes && storyRes.body
          ? {
              title: storyRes.title,
              body: storyRes.body,
              acknowledged: !!storyRes.acknowledged,
            }
          : null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const advance = useCallback(() => {
    if (stepIdx < steps.length - 1) setStepIdx((i) => i + 1);
  }, [stepIdx, steps.length]);

  const back = useCallback(() => {
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  }, [stepIdx]);

  const finish = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch('/api/wizard/complete', { method: 'POST' });
    } catch {
      // ignore — we'll still close locally so the user isn't stuck
    } finally {
      setSubmitting(false);
      onComplete();
      onGoToChecklist();
    }
  }, [submitting, onComplete, onGoToChecklist]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#1B3A6B] flex items-center justify-center">
        <div className="text-white/70 text-sm animate-pulse">Loading…</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#1B3A6B] via-[#2C4F8A] to-[#1B3A6B] flex flex-col">
      {/* Top bar — progress dots centered, no big skip button */}
      <div className="flex items-center justify-center px-5 pt-safe pt-3 pb-3 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === stepIdx ? 'w-6 bg-white' : i < stepIdx ? 'w-3 bg-white/60' : 'w-3 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <div className="max-w-md mx-auto">
          {currentStep === 'install' && (
            <InstallStep device={device} firstName={firstName} restaurantName={restaurantName} />
          )}
          {currentStep === 'welcome' && (
            <WelcomeStep firstName={firstName} restaurantName={restaurantName} content={welcome?.content || null} />
          )}
          {currentStep === 'story' && (
            <StoryStep title={story?.title || 'Our Story'} body={story?.body || ''} />
          )}
          {currentStep === 'checklist' && (
            <ChecklistStep firstName={firstName} />
          )}
        </div>
      </div>

      {/* Footer — back + primary action. Subtle "skip" lives below as a
          tiny escape hatch, not competing with Continue. */}
      <div className="border-t border-white/10 bg-black/20 backdrop-blur-sm px-5 py-3 pb-safe flex-shrink-0">
        <div className="flex items-center gap-3">
          {!isFirst ? (
            <button
              onClick={back}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white/70 hover:text-white"
            >
              ← Back
            </button>
          ) : <div className="w-16" />}

          {!isLast ? (
            <button
              onClick={advance}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-bold bg-white text-[#1B3A6B] hover:bg-gray-100 shadow-lg"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={submitting}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-bold bg-emerald-400 text-[#0B2447] hover:bg-emerald-300 shadow-lg disabled:opacity-50"
            >
              {submitting ? 'Saving…' : "Let's get started →"}
            </button>
          )}
        </div>
        <div className="text-center mt-2">
          <button
            onClick={onComplete}
            className="text-[10px] text-white/40 hover:text-white/70 underline-offset-2 hover:underline"
          >
            Skip for now — you can finish this later
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── Step 1: Install on phone ───────── */
function InstallStep({ device, firstName, restaurantName }: { device: DeviceKind; firstName: string; restaurantName: string | null }) {
  return (
    <div className="text-white pt-4">
      <p className="text-xs uppercase tracking-widest text-white/60 mb-2">Step 1 of 4</p>
      <h1 className="text-2xl font-bold mb-2">Put this app on your phone, {firstName}.</h1>
      <p className="text-sm text-white/80 leading-relaxed mb-5">
        You&rsquo;ll use this every shift — schedule, training, policies, your checklist.
        Add it to your home screen so it opens like a real app.
      </p>

      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
        {device === 'ios' ? (
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">iPhone — Safari</p>
            <Step number={1}>
              Tap the <strong>Share</strong> button at the bottom of Safari (the square with an arrow pointing up <span className="inline-block">⬆</span>).
            </Step>
            <Step number={2}>
              Scroll down in the share menu and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.
            </Step>
            <Step number={3}>
              Tap <strong>Add</strong> in the top-right corner. The {restaurantName || 'WHG'} icon will appear on your home screen.
            </Step>
            <Step number={4}>
              Come back here and tap <strong>Continue</strong> below.
            </Step>
          </div>
        ) : device === 'android' ? (
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Android — Chrome</p>
            <Step number={1}>
              Tap the <strong>three-dot menu</strong> (⋮) in the top right of Chrome.
            </Step>
            <Step number={2}>
              Tap <strong>&ldquo;Install app&rdquo;</strong> or <strong>&ldquo;Add to Home screen&rdquo;</strong>.
            </Step>
            <Step number={3}>
              Confirm <strong>Install</strong> — the icon appears on your home screen.
            </Step>
            <Step number={4}>
              Come back here and tap <strong>Continue</strong> below.
            </Step>
          </div>
        ) : (
          <p className="text-sm text-white/80">
            You&rsquo;re on a computer right now — no install needed. Tap Continue to keep going.
          </p>
        )}
      </div>

      <p className="text-[11px] text-white/50 italic mt-4 text-center">
        Don&rsquo;t worry if you skip this — you can always do it later.
      </p>
    </div>
  );
}

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-300 text-[#0B2447] font-bold text-xs flex items-center justify-center">
        {number}
      </div>
      <p className="text-sm text-white/90 leading-relaxed flex-1">{children}</p>
    </div>
  );
}

/** Render text with **bold** markdown segments inline. Preserves newlines. */
function renderBoldInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const lines = text.split('\n');
  lines.forEach((line, lineIdx) => {
    let lastIndex = 0;
    let keyCounter = 0;
    const lineNodes: React.ReactNode[] = [];
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let m: RegExpExecArray | null;
    while ((m = boldRegex.exec(line)) !== null) {
      if (m.index > lastIndex) lineNodes.push(line.slice(lastIndex, m.index));
      lineNodes.push(<strong key={`b-${lineIdx}-${keyCounter++}`}>{m[1]}</strong>);
      lastIndex = m.index + m[0].length;
    }
    if (lastIndex < line.length) lineNodes.push(line.slice(lastIndex));
    parts.push(<span key={`l-${lineIdx}`}>{lineNodes}</span>);
    if (lineIdx < lines.length - 1) parts.push(<br key={`br-${lineIdx}`} />);
  });
  return parts;
}

/* ───────── Step 2: Welcome ───────── */
function WelcomeStep({ firstName, restaurantName, content }: { firstName: string; restaurantName: string | null; content: string | null }) {
  return (
    <div className="text-white pt-4">
      <p className="text-xs uppercase tracking-widest text-white/60 mb-2">Welcome</p>
      <h1 className="text-2xl font-bold mb-2">Welcome to {restaurantName || 'WHG'}, {firstName}!</h1>
      <p className="text-sm text-white/80 mb-5">A quick note from the team.</p>

      <div className="bg-white rounded-2xl p-5 text-gray-800 shadow-lg">
        {content ? (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {renderBoldInline(content)}
          </div>
        ) : (
          <p className="text-sm italic text-gray-500">No welcome note has been written yet — but we&rsquo;re glad you&rsquo;re here.</p>
        )}
      </div>
    </div>
  );
}

/* ───────── Step 3: Our Story ───────── */
function StoryStep({ title, body }: { title: string; body: string }) {
  return (
    <div className="text-white pt-4">
      <p className="text-xs uppercase tracking-widest text-white/60 mb-2">Who we are</p>
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-sm text-white/80 mb-5">Quick read — this is the team you&rsquo;ve joined and what we stand for.</p>

      <div className="bg-white rounded-2xl p-5 text-gray-800 shadow-lg max-h-[60vh] overflow-y-auto">
        <StoryBody body={body} />
      </div>
    </div>
  );
}

/* ───────── Step 4: Checklist intro ───────── */
function ChecklistStep({ firstName }: { firstName: string }) {
  return (
    <div className="text-white pt-4">
      <p className="text-xs uppercase tracking-widest text-white/60 mb-2">Final step</p>
      <h1 className="text-2xl font-bold mb-2">You&rsquo;re in, {firstName} — let&rsquo;s get you moving.</h1>
      <p className="text-sm text-white/80 leading-relaxed mb-5">
        Restaurants don&rsquo;t have time for slow starts. We built this checklist so you can knock out paperwork, get trained, and start earning real shifts without chasing people down.
      </p>
      <p className="text-sm text-white/80 leading-relaxed mb-5">
        Most of it auto-tracks when you finish. Your manager confirms the rest. Come back anytime in the Onboarding tab.
      </p>

      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 space-y-3">
        <Bullet>
          ✅ <strong>Auto-tracks</strong> when you finish things (signing policies, reading Our Story, etc.)
        </Bullet>
        <Bullet>
          🤝 <strong>Dual check</strong> — you mark your part, your manager confirms theirs.
        </Bullet>
        <Bullet>
          🔗 <strong>One tap</strong> to join Telegram groups, download apps, watch training videos.
        </Bullet>
        <Bullet>
          🏁 <strong>Always here</strong> — find it again in the Onboarding tab whenever you need it.
        </Bullet>
      </div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-white/90 leading-relaxed">{children}</p>;
}

/* ───────── Reused story body renderer (mirrors OurStoryModal) ───────── */
function StoryBody({ body }: { body: string }) {
  type Block =
    | { kind: 'h2'; text: string }
    | { kind: 'h3'; text: string }
    | { kind: 'bullets'; items: string[] }
    | { kind: 'p'; text: string };

  const lines = body.split('\n');
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    if (para.length) {
      const text = para.join(' ').replace(/\s+/g, ' ').trim();
      if (text) blocks.push({ kind: 'p', text });
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push({ kind: 'bullets', items: list.slice() });
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushList(); flushPara(); continue; }
    const h3 = line.match(/^###\s+(.*)$/);
    if (h3) { flushList(); flushPara(); blocks.push({ kind: 'h3', text: h3[1].trim() }); continue; }
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) { flushList(); flushPara(); blocks.push({ kind: 'h2', text: h2[1].trim() }); continue; }
    const bullet = line.match(/^-\s+(.*)$/);
    if (bullet) { flushPara(); list.push(bullet[1].trim()); continue; }
    flushList();
    para.push(line);
  }
  flushList();
  flushPara();

  return (
    <div className="space-y-3 text-sm">
      {blocks.map((b, i) => {
        if (b.kind === 'h2') return <h2 key={i} className="text-base font-bold text-[#1B3A6B] uppercase tracking-widest mt-4 pb-1 border-b border-gray-200">{b.text}</h2>;
        if (b.kind === 'h3') return <h3 key={i} className="text-sm font-bold text-[#1B3A6B] mt-3">{b.text}</h3>;
        if (b.kind === 'bullets') return (
          <ul key={i} className="space-y-1.5 pl-1">
            {b.items.map((item, j) => (
              <li key={j} className="flex gap-2 leading-relaxed">
                <span className="text-[#1B3A6B] flex-shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
        return <p key={i} className="leading-relaxed">{b.text}</p>;
      })}
    </div>
  );
}
