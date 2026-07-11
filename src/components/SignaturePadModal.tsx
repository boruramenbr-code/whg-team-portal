'use client';

import { useEffect, useRef, useState } from 'react';
import SignaturePad from 'signature_pad';

interface Props {
  /** Heading shown above the signature pad — e.g. "Sign Cell Phone Policy". */
  title: string;
  /** Employee's display name, shown in the modal so it's clear who's signing. */
  employeeName: string;
  /** Called with the signature as a PNG data URL when the user confirms. */
  onSigned: (signatureDataUrl: string) => void;
  /** Called when the user cancels without signing. */
  onCancel: () => void;
  /** UI language. Defaults to English. */
  language?: 'en' | 'es';
}

const STRINGS = {
  en: {
    rotateTitle: 'Turn your phone sideways',
    rotateBody:
      'Rotating to landscape gives your signature more room. If your rotation is locked, no problem — you can sign upright too.',
    signUpright: 'Sign upright instead',
    cancel: 'Cancel',
    signingAs: 'Signing as',
    hint: '✍️ Sign with your finger',
    clear: 'Clear',
    done: 'Done',
  },
  es: {
    rotateTitle: 'Gira tu teléfono',
    rotateBody:
      'Girar el teléfono te da más espacio para firmar. Si tu pantalla está bloqueada, no hay problema — también puedes firmar sin girar.',
    signUpright: 'Firmar sin girar',
    cancel: 'Cancelar',
    signingAs: 'Firmando como',
    hint: '✍️ Firma con tu dedo',
    clear: 'Borrar',
    done: 'Listo',
  },
} as const;

/**
 * SignaturePadModal — full-screen finger-signature capture.
 *
 * Mobile UX:
 *   1. Modal opens portrait, prompting "Turn your phone sideways to sign"
 *   2. Once the device flips to landscape, the signing surface fills the
 *      screen with a clean signature_pad canvas (smoothed bezier strokes)
 *   3. Sign with finger → tap Done → returns a PNG data URL
 *
 * Desktop UX:
 *   - Always shows the canvas immediately (no rotation prompt). Use mouse.
 *
 * Powered by signature_pad — handles touch + mouse + retina + smoothing.
 */
export default function SignaturePadModal({ title, employeeName, onSigned, onCancel, language = 'en' }: Props) {
  const t = STRINGS[language] ?? STRINGS.en;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLandscape, setIsLandscape] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : true
  );
  const [hasSigned, setHasSigned] = useState(false);
  // Escape hatch for locked-rotation devices (installed PWA is portrait-locked
  // on Android; iPhone orientation lock is common) — landscape must never be
  // the only way to sign.
  const [portraitOverride, setPortraitOverride] = useState(false);

  // Detect a small viewport (mobile) so we only show the "turn your phone"
  // prompt where it makes sense. Tablets in landscape and desktops skip it.
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const onResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  // Initialize signature_pad once the canvas is mounted AND we're in a
  // signing-ready state (desktop, OR mobile-landscape).
  const showCanvas = !isMobile || isLandscape || portraitOverride;

  useEffect(() => {
    if (!showCanvas) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Resize the canvas backing store to match the container × DPR so
    // strokes look crisp on retina screens.
    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(ratio, ratio);
      // signature_pad reads canvas dimensions at init — clear it so any
      // existing strokes don't get squished by the new dimensions.
      padRef.current?.clear();
    };
    resize();

    padRef.current = new SignaturePad(canvas, {
      backgroundColor: '#ffffff',
      penColor: '#1B3A6B', // navy ink
      minWidth: 1.5,
      maxWidth: 3,
      throttle: 16,
      velocityFilterWeight: 0.7,
    });

    const onEnd = () => setHasSigned(!padRef.current?.isEmpty());
    padRef.current.addEventListener('endStroke', onEnd);

    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
      padRef.current?.removeEventListener('endStroke', onEnd);
      padRef.current?.off();
      padRef.current = null;
    };
  }, [showCanvas]);

  const handleClear = () => {
    padRef.current?.clear();
    setHasSigned(false);
  };

  const handleDone = () => {
    if (!padRef.current || padRef.current.isEmpty()) return;
    const dataUrl = padRef.current.toDataURL('image/png');
    onSigned(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-0">
      {/* ── Portrait prompt: rotation suggested, never required ── */}
      {!showCanvas && (
        <div className="bg-white w-full max-w-sm m-4 rounded-2xl shadow-xl p-6 text-center">
          <div className="text-5xl mb-3">📱↻</div>
          <h2 className="text-lg font-bold text-[#1B3A6B] mb-2">{t.rotateTitle}</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">{t.rotateBody}</p>
          <button
            onClick={() => setPortraitOverride(true)}
            className="w-full py-3 rounded-lg text-sm font-bold bg-[#1B3A6B] text-white hover:bg-[#2C4F8A] mb-2"
          >
            {t.signUpright}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 text-sm text-gray-500 font-semibold hover:text-gray-700"
          >
            {t.cancel}
          </button>
        </div>
      )}

      {/* ── Signing surface ── */}
      {showCanvas && (
        <div className="bg-white w-full h-full sm:max-w-4xl sm:max-h-[90vh] sm:rounded-2xl shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                {t.signingAs}
              </p>
              <p className="text-sm font-bold text-[#1B3A6B] truncate">{employeeName}</p>
              <p className="text-xs text-gray-500 truncate">{title}</p>
            </div>
            <button
              onClick={onCancel}
              className="text-sm text-gray-500 font-semibold hover:text-gray-700 px-4 py-3 -my-1"
            >
              {t.cancel}
            </button>
          </div>

          {/* Canvas area */}
          <div
            ref={containerRef}
            className="flex-1 bg-white relative touch-none select-none"
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              style={{ touchAction: 'none' }}
            />
            {/* Signature line + hint */}
            {!hasSigned && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-gray-300 text-sm italic pointer-events-none">
                ✍️ Sign with your finger
              </div>
            )}
            <div className="absolute bottom-8 left-12 right-12 h-px bg-gray-200 pointer-events-none" />
          </div>

          {/* Footer actions */}
          <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between gap-3 flex-shrink-0">
            <button
              onClick={handleClear}
              disabled={!hasSigned}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                hasSigned
                  ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  : 'text-gray-300 bg-gray-50 cursor-not-allowed'
              }`}
            >
              Clear
            </button>
            <button
              onClick={handleDone}
              disabled={!hasSigned}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                hasSigned
                  ? 'bg-[#1B3A6B] text-white hover:bg-[#2C4F8A]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
