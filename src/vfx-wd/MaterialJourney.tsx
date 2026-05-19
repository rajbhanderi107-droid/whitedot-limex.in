import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import LottieMicroIcon from "./LottieMicroIcon";

const journeySteps = [
  {
    label: "01 Mineral input",
    title: "Limestone particles",
    text: "Natural calcium-carbonate rich mineral is presented as a controlled feedstock for technical material planning.",
  },
  {
    label: "02 Compounded resin",
    title: "LIMEX pellets",
    text: "Mineral content is compounded with polymer systems so processors can evaluate resin-based routes with familiar production logic.",
  },
  {
    label: "03 Engineered substrate",
    title: "LIMEX sheet",
    text: "Pellets can move into sheet and film-like formats for print, packaging, signage, and commercial product development.",
  },
  {
    label: "04 Industrial output",
    title: "Finished product",
    text: "The commercial focus is qualification: application fit, machine trials, cost room, and responsible adoption claims.",
  },
];

const particleMarks = Array.from({ length: 42 }, (_, index) => {
  const angle = index * 2.399;
  const radius = 2.1 + (index % 9) * 0.52;
  return {
    x: `${Math.cos(angle) * radius}rem`,
    y: `${Math.sin(angle) * radius * 0.72}rem`,
    r: `${index * 11}deg`,
    s: `${0.72 + (index % 5) * 0.08}`,
  };
});

const pelletMarks = Array.from({ length: 22 }, (_, index) => {
  const column = index % 6;
  const row = Math.floor(index / 6);
  return {
    x: `${(column - 2.5) * 1.36}rem`,
    y: `${(row - 1.55) * 1.18}rem`,
    r: `${index * 17}deg`,
    s: `${0.92 + (index % 4) * 0.05}`,
  };
});

export default function MaterialJourney() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    let cleanup = () => {};
    let cancelled = false;

    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([gsapModule, scrollTriggerModule]) => {
      if (cancelled || !sectionRef.current) return;

      const { gsap } = gsapModule;
      const { ScrollTrigger } = scrollTriggerModule;
      gsap.registerPlugin(ScrollTrigger);

      const context = gsap.context(() => {
        const media = gsap.matchMedia();

        media.add("(min-width: 780px)", () => {
          const tl = gsap.timeline({
            defaults: { ease: "power2.out" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "+=2600",
              pin: true,
              scrub: 0.9,
              anticipatePin: 1,
            },
          });

          gsap.set(".vfx-wd-journey-material", { autoAlpha: 0, scale: 0.84, y: 22 });
          gsap.set(".vfx-wd-stage-particles", { autoAlpha: 1, scale: 1, y: 0 });
          gsap.set(".vfx-wd-journey-card", { autoAlpha: 0.42, y: 14 });
          gsap.set(".vfx-wd-journey-card:nth-child(1)", { autoAlpha: 1, y: 0 });

          tl.to(".vfx-wd-stage-particles", { autoAlpha: 0, scale: 0.72, y: -18, duration: 0.85 }, 0.35)
            .to(".vfx-wd-stage-pellets", { autoAlpha: 1, scale: 1, y: 0, duration: 0.95 }, 0.55)
            .to(".vfx-wd-journey-card:nth-child(1)", { autoAlpha: 0.36, y: -8, duration: 0.5 }, 0.45)
            .to(".vfx-wd-journey-card:nth-child(2)", { autoAlpha: 1, y: 0, duration: 0.5 }, 0.58)
            .to(".vfx-wd-stage-pellets", { autoAlpha: 0, scale: 0.78, y: -14, duration: 0.9 }, 1.42)
            .to(".vfx-wd-stage-sheet", { autoAlpha: 1, scale: 1, y: 0, duration: 0.95 }, 1.62)
            .to(".vfx-wd-journey-card:nth-child(2)", { autoAlpha: 0.36, y: -8, duration: 0.5 }, 1.5)
            .to(".vfx-wd-journey-card:nth-child(3)", { autoAlpha: 1, y: 0, duration: 0.5 }, 1.64)
            .to(".vfx-wd-stage-sheet", { autoAlpha: 0, scale: 0.82, rotateX: 16, y: -10, duration: 0.9 }, 2.5)
            .to(".vfx-wd-stage-product", { autoAlpha: 1, scale: 1, y: 0, duration: 0.95 }, 2.72)
            .to(".vfx-wd-journey-card:nth-child(3)", { autoAlpha: 0.36, y: -8, duration: 0.5 }, 2.6)
            .to(".vfx-wd-journey-card:nth-child(4)", { autoAlpha: 1, y: 0, duration: 0.5 }, 2.74);

          return () => {
            tl.kill();
          };
        });
      }, section);

      cleanup = () => context.revert();
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <section className="section vfx-wd-journey" id="mineral-journey" ref={sectionRef}>
      <div className="section-kicker">
        <LottieMicroIcon variant="orbit" />
        Mineral Intelligence journey
      </div>
      <div className="split-heading">
        <h2>From mineral origin to business-ready LIMEX applications.</h2>
        <p>
          A scroll-led material story gives industrial buyers a clear mental model: mineral input,
          pelletized route, sheet conversion, then qualified commercial products.
        </p>
      </div>

      <div className="vfx-wd-journey-stage">
        <div className="vfx-wd-journey-visual" aria-label="Limestone to LIMEX transformation visualization">
          <div className="vfx-wd-journey-grid" aria-hidden="true" />

          <div className="vfx-wd-journey-material vfx-wd-stage-particles">
            {particleMarks.map((style, index) => (
              <span
                key={index}
                style={
                  {
                    "--x": style.x,
                    "--y": style.y,
                    "--r": style.r,
                    "--s": style.s,
                  } as CSSProperties
                }
              />
            ))}
          </div>

          <div className="vfx-wd-journey-material vfx-wd-stage-pellets">
            {pelletMarks.map((style, index) => (
              <span
                key={index}
                style={
                  {
                    "--x": style.x,
                    "--y": style.y,
                    "--r": style.r,
                    "--s": style.s,
                  } as CSSProperties
                }
              />
            ))}
          </div>

          <div className="vfx-wd-journey-material vfx-wd-stage-sheet">
            <span />
            <strong>LIMEX sheet</strong>
          </div>

          <div className="vfx-wd-journey-material vfx-wd-stage-product">
            <span className="vfx-wd-product-body" />
            <span className="vfx-wd-product-label" />
            <strong>Industrial product</strong>
          </div>
        </div>

        <div className="vfx-wd-journey-cards">
          {journeySteps.map((step) => (
            <article className="vfx-wd-journey-card" key={step.title}>
              <span>{step.label}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
