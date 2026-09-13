/**
 * Client-side image normalization for uploads.
 *
 * Same pipeline the bar-card uploader proved out:
 *   1. HEIC/HEIF (iPhone default) → decode to JPEG via heic2any (WASM,
 *      loaded lazily only when needed).
 *   2. Always canvas-resize/recompress (default max 2048px, q=0.8) so
 *      every final upload lands around 0.5–2MB — safely under Vercel's
 *      ~4.5MB request body limit no matter what the camera produced.
 *
 * Browser-only (uses Image/canvas) — call from client components.
 */
export async function convertToJpeg(
  file: File,
  opts: { maxDim?: number; quality?: number } = {}
): Promise<File> {
  const maxDim = opts.maxDim ?? 2048;
  const quality = opts.quality ?? 0.8;

  // Detect HEIC by MIME type OR extension (some browsers report empty MIME).
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.heic$/i.test(file.name) ||
    /\.heif$/i.test(file.name);

  let working: File = file;
  if (isHeic) {
    const heic2any = (await import('heic2any')).default;
    const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
    const jpegBlob = Array.isArray(result) ? result[0] : result;
    const name = file.name.replace(/\.[^.]+$/, '.jpg');
    working = new File([jpegBlob], name, { type: 'image/jpeg' });
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(working);
    img.onload = () => {
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
          const name = working.name.replace(/\.[^.]+$/, '.jpg');
          resolve(new File([blob], name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
    img.src = url;
  });
}

/** Small JPEG for grid tiles (~720px, typically 40–90KB). */
export function makeThumbnail(file: File): Promise<File> {
  return convertToJpeg(file, { maxDim: 720, quality: 0.72 });
}

/**
 * Grab a still frame from a video file for its tile (~720px JPEG).
 * Resolves null when this browser can't decode the video (e.g. iPhone
 * HEVC outside Safari) — the tile then falls back to the video itself.
 */
export function captureVideoPoster(file: File): Promise<File | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    let settled = false;
    const done = (result: File | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
      resolve(result);
    };
    const timer = setTimeout(() => done(null), 8000);

    video.onerror = () => done(null);
    video.onloadeddata = () => {
      // Half a second in skips the black frame many clips open on.
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
    };
    video.onseeked = () => {
      let w = video.videoWidth;
      let h = video.videoHeight;
      if (!w || !h) { done(null); return; }
      const ratio = Math.min(1, 720 / Math.max(w, h));
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { done(null); return; }
      ctx.drawImage(video, 0, 0, w, h);
      canvas.toBlob(
        (blob) => done(blob ? new File([blob], 'poster.jpg', { type: 'image/jpeg' }) : null),
        'image/jpeg',
        0.72
      );
    };
    video.src = url;
  });
}
