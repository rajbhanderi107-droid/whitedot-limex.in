import { useEffect, type RefObject } from 'react';

type Options = {
  eager?: boolean;
  rootMargin?: string;
  threshold?: number;
  resetWhenHidden?: boolean;
};

export function useViewportVideo(
  videoRef: RefObject<HTMLVideoElement | null>,
  { eager = false, rootMargin = '160px 0px', threshold = 0.05, resetWhenHidden = false }: Options = {},
) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      video.pause();
      return undefined;
    }

    const play = () => {
      video.muted = true;
      void video.play().catch(() => undefined);
    };

    const pause = () => {
      video.pause();
      if (resetWhenHidden) {
        try {
          video.currentTime = 0;
        } catch {
          // Metadata may not be ready yet.
        }
      }
    };

    if (!('IntersectionObserver' in window)) {
      if (eager) play();
      return pause;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) play();
        else pause();
      },
      { rootMargin, threshold },
    );

    observer.observe(video);
    if (eager) play();

    return () => {
      observer.disconnect();
      pause();
    };
  }, [eager, resetWhenHidden, rootMargin, threshold, videoRef]);
}
