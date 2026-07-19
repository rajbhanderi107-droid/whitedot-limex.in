import './Showcase.css';
import { useReveal } from '../motion';
import AnimatedText from '../AnimatedText';

const placeholderArt = `${import.meta.env.BASE_URL}assets/higgsfield/journey/galaxy-formation.webp`;

export default function Showcase() {
  const head = useReveal<HTMLDivElement>();
  const frame = useReveal<HTMLDivElement>({ threshold: 0.15 });
  const caption = useReveal<HTMLParagraphElement>();

  return (
    <section className="v2sc" id="material-core" aria-labelledby="v2sc-title">
      <div className="v2sc-inner">
        <div className="v2sc-head v2-reveal" ref={head.ref}>
          <p className="v2-eyebrow">Future Advertisement Showcase</p>
          <h2 id="v2sc-title" className="v2sc-title">
            <AnimatedText text="Watch the Future of Sustainable Materials" />
          </h2>
          <p className="v2sc-sub">
            A cinematic look at how limestone-derived mineral technology becomes
            a practical material possibility.
          </p>
        </div>

        <div className="v2sc-frame v2-reveal" ref={frame.ref}>
          <span className="v2sc-reflection" aria-hidden="true" />

          <div className="v2sc-placeholder" role="img" aria-label="Whitedot LIMEX Launch Film — coming soon">
            <span
              className="v2sc-placeholder-art"
              aria-hidden="true"
              style={{ backgroundImage: `url(${placeholderArt})` }}
            />
            <span className="v2sc-placeholder-line" aria-hidden="true" />
            <p className="v2sc-placeholder-title">Whitedot LIMEX Launch Film</p>
            <p className="v2sc-placeholder-status">Coming Soon</p>
            <span className="v2sc-placeholder-line" aria-hidden="true" />
          </div>

          <button
            type="button"
            className="v2sc-play"
            aria-label="Launch film coming soon"
            tabIndex={-1}
            aria-disabled="true"
          >
            <span className="v2sc-play-ring" aria-hidden="true" />
            <svg className="v2sc-play-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
              <path d="M8.5 5.5v13l11-6.5-11-6.5z" fill="currentColor" />
            </svg>
          </button>
        </div>

        <p className="v2sc-caption v2-reveal" ref={caption.ref}>
          From limestone-derived mineral technology to next-generation material applications.
        </p>
      </div>
    </section>
  );
}
