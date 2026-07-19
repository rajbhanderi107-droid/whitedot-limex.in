import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { usePremium } from '../premium-wd';

/**
 * AnimatedText — staggered word-rise text reveal (21st.dev pattern, built on
 * framer-motion). Each word rises out of an overflow mask with a soft blur
 * settle; calm cinematic pacing to match the site's mineral aesthetic.
 *
 * Accessibility/SEO: the full string lives on the container as aria-label;
 * the split spans are aria-hidden. With premium off or reduced motion the
 * text renders as a plain static string.
 *
 * Multi-line headings: pass an array of lines — stagger flows across lines.
 */

type AnimatedTextProps = {
  text: string | string[];
  className?: string;
  /** Base delay (s) before the first word starts. */
  delay?: number;
  /** Per-word stagger (s). */
  stagger?: number;
};

const EASE = [0.16, 1, 0.3, 1] as const;

export default function AnimatedText({
  text,
  className,
  delay = 0.1,
  stagger = 0.07,
}: AnimatedTextProps) {
  const premium = usePremium();
  const reduceOS = useReducedMotion();
  const motionOverride =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('wd_motion') === '1';
  const animate = premium && (!reduceOS || motionOverride);

  const containerRef = useRef<HTMLSpanElement | null>(null);
  const [inView, setInView] = useState(false);

  // Plain IntersectionObserver (matches the rest of the site's useReveal
  // pattern) instead of framer-motion's whileInView, which does not reliably
  // fire the "visible" variant across every render environment. A low
  // threshold plus a hard timeout fallback guarantees the text can never get
  // stuck permanently hidden — e.g. a hash-link jump-scroll that passes
  // through the element in a single frame, before layout/video assets settle.
  useEffect(() => {
    if (!animate) return;
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0, rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    const safety = window.setTimeout(() => setInView(true), 1800);
    return () => {
      io.disconnect();
      window.clearTimeout(safety);
    };
  }, [animate]);

  const lines = Array.isArray(text) ? text : [text];
  const label = lines.join(' ');

  if (!animate) {
    return (
      <span className={className}>
        {lines.map((line, i) => (
          <span key={i} style={{ display: 'block' }}>
            {line}
          </span>
        ))}
      </span>
    );
  }

  let wordIndex = 0;

  return (
    <motion.span
      ref={containerRef}
      className={className}
      aria-label={label}
      role="text"
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      {lines.map((line, li) => (
        <span key={li} style={{ display: 'block' }} aria-hidden="true">
          {line.split(' ').map((word, wi) => {
            const i = wordIndex++;
            return (
              <span
                key={wi}
                style={{
                  display: 'inline-block',
                  overflow: 'hidden',
                  verticalAlign: 'bottom',
                  paddingBottom: '0.08em',
                  marginBottom: '-0.08em',
                }}
              >
                <motion.span
                  style={{ display: 'inline-block', willChange: 'transform, filter' }}
                  variants={{
                    hidden: { y: '112%', opacity: 0.001, filter: 'blur(5px)' },
                    visible: {
                      y: '0%',
                      opacity: 1,
                      filter: 'blur(0px)',
                      transition: {
                        duration: 0.9,
                        ease: EASE,
                        delay: delay + i * stagger,
                      },
                    },
                  }}
                >
                  {word}
                </motion.span>
                {' '}
              </span>
            );
          })}
        </span>
      ))}
    </motion.span>
  );
}
