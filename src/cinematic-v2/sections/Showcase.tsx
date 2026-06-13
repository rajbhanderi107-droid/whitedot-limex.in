import './Showcase.css';
import { useRef } from 'react';
import { useReveal } from '../motion';
import { useViewportVideo } from '../useViewportVideo';

const launchFilmSrc = `${import.meta.env.BASE_URL}assets/limex-launch-film-fast.mp4`;
const launchPosterSrc = `${import.meta.env.BASE_URL}assets/limex-launch-poster.webp`;

/**
 * Showcase — Frame 05. Carries V1's "Future Advertisement Showcase" copy
 * (MaterialCore.tsx) verbatim, now wired to the Higgsfield launch-film loop
 * generated for the green studio theme.
 */
export default function Showcase() {
  const head = useReveal<HTMLDivElement>();
  const frame = useReveal<HTMLDivElement>({ threshold: 0.15 });
  const caption = useReveal<HTMLParagraphElement>();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useViewportVideo(videoRef);

  return (
    <section className="v2sc" id="material-core" aria-labelledby="v2sc-title">
      <div className="v2sc-inner">
        <div className="v2sc-head v2-reveal" ref={head.ref}>
          <p className="v2-eyebrow">Future Advertisement Showcase</p>
          <h2 id="v2sc-title" className="v2sc-title">
            Watch the Future of Sustainable Materials
          </h2>
          <p className="v2sc-sub">
            A cinematic look at how carbon innovation becomes premium material
            possibility.
          </p>
        </div>

        <div className="v2sc-frame v2-reveal" ref={frame.ref}>
          <span className="v2sc-reflection" aria-hidden="true" />
          <video
            ref={videoRef}
            className="v2sc-media"
            src={launchFilmSrc}
            poster={launchPosterSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
          />
        </div>

        <p className="v2sc-caption v2-reveal" ref={caption.ref}>
          From captured carbon to next-generation material innovation.
        </p>
      </div>
    </section>
  );
}
