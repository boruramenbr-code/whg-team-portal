'use client';

import { useEffect, useState } from 'react';

interface StoryData {
  acknowledged: boolean;
  title: string | null;
  body: string | null;
}

interface Props {
  onAcknowledged: () => void;
}

const ACK_BUTTON_ENABLE_AFTER_MS = 12_000; // 12 seconds — time-gated so staff
                                            // can't instant-click through.

/**
 * OurStoryModal — one-time onboarding read.
 *
 * On every authenticated Home load, fetches /api/our-story to check whether
 * the current user has acknowledged the Our Story / Mission / Values content.
 * If not, renders a full-screen modal with the content and a time-gated
 * "I've read this. Let's go." acknowledgment button (12-second cooldown
 * before the button enables — forces at least a scan, no instant dismiss).
 *
 * Content is sourced from the same handbook_sections row that powers the
 * Handbook tab's "Our Story" section — single source of truth.
 *
 * After acknowledgment, never shows again for that user (profiles.
 * story_acknowledged_at is non-null).
 */
export default function OurStoryModal({ onAcknowledged }: Props) {
  const [data, setData] = useState<StoryData | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(ACK_BUTTON_ENABLE_AFTER_MS / 1000));
  const [acknowledging, setAcknowledging] = useState(false);

  // Fetch story status + content on mount
  useEffect(() => {
    let cancelled = false;
    // Phase 1 perf: server returns 10-min cache once acknowledged.
    fetch('/api/our-story')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: StoryData | null) => {
        if (cancelled) return;
        if (!d || d.acknowledged || !d.body) {
          // Either already acknowledged, fetch failed, or content missing.
          // Either way, don't show the modal — caller can proceed.
          onAcknowledged();
          return;
        }
        setData(d);
      })
      .catch(() => {
        if (!cancelled) onAcknowledged();
      });
    return () => { cancelled = true; };
  }, [onAcknowledged]);

  // Time-gate the acknowledgment button. Counts down once content is loaded.
  useEffect(() => {
    if (!data) return;
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const left = Math.max(0, Math.ceil((ACK_BUTTON_ENABLE_AFTER_MS - elapsed) / 1000));
      setSecondsLeft(left);
      if (elapsed >= ACK_BUTTON_ENABLE_AFTER_MS) {
        setEnabled(true);
        clearInterval(interval);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [data]);

  const handleAcknowledge = async () => {
    if (!enabled || acknowledging) return;
    setAcknowledging(true);
    try {
      await fetch('/api/our-story/acknowledge', { method: 'POST' });
    } catch {
      // ignore — even if the ack POST fails, dismissing the modal is fine
    }
    onAcknowledged();
  };

  if (!data || !data.body) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2C4F8A] px-6 py-5 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300 mb-1">
            Welcome to the team
          </p>
          <h1 className="text-xl md:text-2xl font-bold">
            {data.title}
          </h1>
          <p className="text-xs text-white/80 mt-1.5 italic leading-relaxed">
            Take a few minutes to read this before you start. It's what we hold ourselves to.
          </p>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <StoryBody body={data.body} />
        </div>

        {/* Footer with time-gated acknowledge button */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            onClick={handleAcknowledge}
            disabled={!enabled || acknowledging}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${
              enabled && !acknowledging
                ? 'bg-[#1B3A6B] text-white hover:bg-[#2C4F8A]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {acknowledging
              ? 'Saving…'
              : enabled
              ? "I've read this. Let's go."
              : `Please take a moment to read (${secondsLeft}s)`}
          </button>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            This shows once. You can revisit it anytime in the Handbook tab.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───────── Story body renderer ─────────
 * Mirrors the handbook reader's simple markdown dialect:
 *   ## Header   → big navy section header
 *   ### Header  → smaller numbered subheader
 *   - bullet    → bulleted list item
 *   paragraph   → plain text paragraph (blank line separator)
 */
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
    if (!line) {
      flushList();
      flushPara();
      continue;
    }
    const h3 = line.match(/^###\s+(.*)$/);
    if (h3) {
      flushList(); flushPara();
      blocks.push({ kind: 'h3', text: h3[1].trim() });
      continue;
    }
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) {
      flushList(); flushPara();
      blocks.push({ kind: 'h2', text: h2[1].trim() });
      continue;
    }
    const bullet = line.match(/^-\s+(.*)$/);
    if (bullet) {
      flushPara();
      list.push(bullet[1].trim());
      continue;
    }
    flushList();
    para.push(line);
  }
  flushList();
  flushPara();

  return (
    <div className="space-y-3">
      {blocks.map((b, idx) => {
        if (b.kind === 'h2') {
          return (
            <h2 key={idx} className="text-base font-bold text-[#1B3A6B] uppercase tracking-widest mt-4 pb-1 border-b border-gray-200">
              {b.text}
            </h2>
          );
        }
        if (b.kind === 'h3') {
          return (
            <h3 key={idx} className="text-sm font-bold text-[#1B3A6B] mt-3">
              {b.text}
            </h3>
          );
        }
        if (b.kind === 'bullets') {
          return (
            <ul key={idx} className="space-y-1.5 pl-1">
              {b.items.map((it, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
                  <span className="text-[#1B3A6B] flex-shrink-0 mt-0.5">•</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={idx} className="text-sm text-gray-700 leading-relaxed">
            {b.text}
          </p>
        );
      })}
    </div>
  );
}
