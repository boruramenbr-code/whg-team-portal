/**
 * Client-side image normalization for uploads.
 *
 * Same pipeline the bar-card uploader proved out:
 *   1. HEIC/HEIF (iPhone default) → decode to JPEG via heic2any (WASM,
 *      loaded lazily only when needed).
 *   2. Always canvas-resize/recompress (max 2048px, q=0.8) so every final
 *      upload lands around 0.5–2MB — safely under Vercel's ~4.5MB request
 *      body limit no matter what the camera produced.
 *
 * Browser-only (uses Image/canvas) — call from client components.
 */
export async function convertToJpeg(file: File): Promise<File> {
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
      const maxDim = 2048;
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
        0.8
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
    img.src = url;
  });
}
