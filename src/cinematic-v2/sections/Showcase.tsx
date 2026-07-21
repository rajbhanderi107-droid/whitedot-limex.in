import './Showcase.css';
import { useReveal } from '../motion';
import AnimatedText from '../AnimatedText';

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

          <div className="v2sc-video">
            <iframe
              src="https://www.youtube.com/embed/YIXzbM03qag"
              title="Whitedot LIMEX Launch Film"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>

        <p className="v2sc-caption v2-reveal" ref={caption.ref}>
          From limestone-derived mineral technology to next-generation material applications.
        </p>
      </div>
    </section>
  );
}
