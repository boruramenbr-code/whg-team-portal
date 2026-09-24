'use client';

/**
 * The owner's welcome video (YouTube, unlisted). Privacy-enhanced embed;
 * Spanish subtitles come on automatically for staff using the app in
 * Spanish. Shown on Start Here → Welcome and in guided training's first step.
 */
export default function WelcomeVideo({ id, isES, title }: { id: string; isES: boolean; title?: string }) {
  const params = new URLSearchParams({ rel: '0', modestbranding: '1', playsinline: '1' });
  if (isES) { params.set('cc_load_policy', '1'); params.set('cc_lang_pref', 'es'); params.set('hl', 'es'); }
  return (
    <div className="relative w-full aspect-video overflow-hidden rounded-2xl border border-whg-line bg-black shadow-lg">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`}
        title={title || (isES ? 'Bienvenida de Randy' : 'A welcome from Randy')}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
