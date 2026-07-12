import { useEffect, useRef, useState } from "react";

const HARD_CAP_MS = 6000;

// Only "above the fold" asset types gate the loader — fonts, core JS/CSS,
// icons, and images. Full-length hero video and the case-study 3D model
// warmup (13 GLBs, several MB each) stream in progressively after reveal
// and must NOT hold the loader open; they finish long after paint.
function isCriticalResource(name: string): boolean {
  return (
    name.endsWith(".js") ||
    name.endsWith(".css") ||
    name.endsWith(".woff2") ||
    name.endsWith(".woff") ||
    name.endsWith(".svg") ||
    name.endsWith(".webp") ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg")
  );
}

export function useLoadProgress(): { progress: number; ready: boolean } {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const settled = useRef(false);

  useEffect(() => {
    if (settled.current) return;

    let fontsReady = false;
    let resourcesDone = false;

    const bump = (loaded: number, expected: number) => {
      if (settled.current) return;
      const total = expected || 1;
      const resourceFraction = Math.min(loaded / total, 1) * 0.7;
      const fontFraction = fontsReady ? 0.3 : 0;
      setProgress(Math.min(resourceFraction + fontFraction, 1));
    };

    const finish = () => {
      if (settled.current) return;
      settled.current = true;
      setProgress(1);
      setReady(true);
    };

    const checkComplete = () => {
      if (resourcesDone && fontsReady) finish();
    };

    const recount = () => {
      const entries = performance
        .getEntriesByType("resource")
        .filter((e) => isCriticalResource(e.name));
      const expected = entries.length || 1;
      const loaded = entries.filter(
        (e) => (e as PerformanceResourceTiming).responseEnd > 0,
      ).length;
      resourcesDone = loaded >= expected && expected > 0;
      bump(loaded, expected);
      checkComplete();
    };

    const observer = new PerformanceObserver(recount);
    try {
      observer.observe({ type: "resource", buffered: true });
    } catch {
      resourcesDone = true;
    }

    document.fonts.ready.then(() => {
      fontsReady = true;
      recount();
    });

    const poll = setInterval(recount, 200);
    const cap = setTimeout(finish, HARD_CAP_MS);

    return () => {
      observer.disconnect();
      clearInterval(poll);
      clearTimeout(cap);
    };
  }, []);

  return { progress, ready };
}
