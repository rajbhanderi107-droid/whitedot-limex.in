/**
 * VideoHero — the hero centerpiece film.
 *
 * Replaces the 3D limestone model as the hero figure. Raj drops a film into
 *   public/assets/videos/hero.mp4   (optional: hero.webm, hero-poster.jpg)
 * and it auto-plays full-bleed behind the copy. Until a file exists, a clean
 * mineral gradient shows (no dev text → production-safe).
 *
 * Colors: none. The grade/placeholder live in cinematic.css using the brand
 * mineral tokens only.
 */
export function VideoHero() {
  const base = import.meta.env.BASE_URL;
  return (
    <div className="cine-hero-video" aria-hidden="true">
      <video
        className="cine-hero-video-el"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={`${base}assets/videos/hero-poster.jpg`}
      >
        <source src={`${base}assets/videos/hero.webm`} type="video/webm" />
        <source src={`${base}assets/videos/hero.mp4`} type="video/mp4" />
      </video>
    </div>
  );
}
