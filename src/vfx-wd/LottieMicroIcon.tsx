import { useEffect, useMemo, useRef } from "react";

type IconVariant = "orbit" | "check" | "meter";

const variantColor: Record<IconVariant, [number, number, number, number]> = {
  orbit: [0.72, 0.77, 0.88, 1],
  check: [0.9, 0.73, 0.45, 1],
  meter: [0.56, 0.75, 0.65, 1],
};

function makeIconData(variant: IconVariant) {
  const color = variantColor[variant];
  return {
    v: "5.12.2",
    fr: 30,
    ip: 0,
    op: 120,
    w: 96,
    h: 96,
    nm: `WhiteDot ${variant}`,
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Rotating ring",
        sr: 1,
        ks: {
          o: { a: 0, k: 82 },
          r: {
            a: 1,
            k: [
              { t: 0, s: [0] },
              { t: 120, s: [360] },
            ],
          },
          p: { a: 0, k: [48, 48, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] },
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              { ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [54, 54] } },
              {
                ty: "tm",
                s: { a: 0, k: 8 },
                e: { a: 0, k: 78 },
                o: { a: 0, k: 0 },
                m: 1,
              },
              {
                ty: "st",
                c: { a: 0, k: color },
                o: { a: 0, k: 100 },
                w: { a: 0, k: 5 },
                lc: 2,
                lj: 2,
              },
              {
                ty: "tr",
                p: { a: 0, k: [0, 0] },
                a: { a: 0, k: [0, 0] },
                s: { a: 0, k: [100, 100] },
                r: { a: 0, k: 0 },
                o: { a: 0, k: 100 },
              },
            ],
            nm: "ring group",
          },
        ],
        ip: 0,
        op: 120,
        st: 0,
        bm: 0,
      },
      {
        ddd: 0,
        ind: 2,
        ty: 4,
        nm: "Core pulse",
        sr: 1,
        ks: {
          o: {
            a: 1,
            k: [
              { t: 0, s: [48] },
              { t: 48, s: [100] },
              { t: 120, s: [48] },
            ],
          },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [48, 48, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: {
            a: 1,
            k: [
              { t: 0, s: [82, 82, 100] },
              { t: 48, s: [104, 104, 100] },
              { t: 120, s: [82, 82, 100] },
            ],
          },
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              { ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [14, 14] } },
              { ty: "fl", c: { a: 0, k: color }, o: { a: 0, k: 100 } },
              {
                ty: "tr",
                p: { a: 0, k: [0, 0] },
                a: { a: 0, k: [0, 0] },
                s: { a: 0, k: [100, 100] },
                r: { a: 0, k: 0 },
                o: { a: 0, k: 100 },
              },
            ],
            nm: "core group",
          },
        ],
        ip: 0,
        op: 120,
        st: 0,
        bm: 0,
      },
    ],
  };
}

export default function LottieMicroIcon({ variant = "orbit" }: { variant?: IconVariant }) {
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const iconData = useMemo(() => makeIconData(variant), [variant]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    let animation: { destroy: () => void } | null = null;
    let cancelled = false;
    let observer: IntersectionObserver | null = null;

    const loadAnimation = () => {
      import("lottie-web").then((lottieModule) => {
        if (cancelled || !containerRef.current || animation) return;

        animation = lottieModule.default.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData: iconData,
        });
      });
    };

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer?.disconnect();
            observer = null;
            loadAnimation();
          }
        },
        { rootMargin: "180px" },
      );
      observer.observe(container);
    } else {
      loadAnimation();
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      animation?.destroy();
    };
  }, [iconData]);

  return <span ref={containerRef} className={`vfx-wd-lottie-icon ${variant}`} aria-hidden="true" />;
}
