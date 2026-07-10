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

    // Track whether the video is currently supposed to be playing.
    let shouldPlay = false;

    const play = () => {
      shouldPlay = true;
      video.muted = true;
      video.loop = true; // enforce loop attribute in case it was missing
      void video.play().catch(() => undefined);
    };

    const pause = () => {
      shouldPlay = false;
      video.pause();
      if (resetWhenHidden) {
        try {
          video.currentTime = 0;
        } catch {
          // Metadata may not be ready yet.
        }
      }
    };

    // Safety net: if the browser somehow doesn't honour the loop attribute,
    // restart playback when the video reaches the end.
    const onEnded = () => {
      if (shouldPlay) {
        try { video.currentTime = 0; } catch { /* not ready */ }
        void video.play().catch(() => undefined);
      }
    };
    video.addEventListener('ended', onEnded);

    // Re-trigger play after the browser tab regains focus — mobile browsers
    // (especially iOS Safari) suspend media when the tab is hidden and do
    // NOT always auto-resume when it becomes visible again.
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && shouldPlay && video.paused) {
        void video.play().catch(() => undefined);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Watchdog: the safety nets above only fire AFTER a video has
    // successfully started (ended/visibilitychange). If play() silently
    // stalls — readyState never advances past HAVE_NOTHING (a rejected
    // autoplay promise, a network hiccup mid-buffer, a stuck fetch) —
    // nothing ever retries and the video sits frozen on its poster frame
    // forever. Poll periodically and force a fresh load()+play() if a
    // video that should be playing is paused or still has no data.
    const watchdog = window.setInterval(() => {
      if (!shouldPlay) return;
      if (video.paused || video.readyState === 0) {
        try { video.load(); } catch { /* ignore */ }
        void video.play().catch(() => undefined);
      }
    }, 4000);

    if (!('IntersectionObserver' in window)) {
      if (eager) play();
      return () => {
        pause();
        window.clearInterval(watchdog);
        video.removeEventListener('ended', onEnded);
        document.removeEventListener('visibilitychange', onVisibilityChange);
      };
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
      window.clearInterval(watchdog);
      video.removeEventListener('ended', onEnded);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [eager, resetWhenHidden, rootMargin, threshold, videoRef]);
}
