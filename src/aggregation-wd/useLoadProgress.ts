import { useEffect, useRef, useState } from "react";

const HARD_CAP_MS = 4000;

export function useLoadProgress(): { progress: number; ready: boolean } {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const settled = useRef(false);

  useEffect(() => {
    if (settled.current) return;

    let expected = 0;
    let loaded = 0;
    let fontsReady = false;
    let resourcesDone = false;

    const bump = () => {
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

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (
          entry.entryType === "resource" &&
          (entry.name.endsWith(".js") ||
            entry.name.endsWith(".css") ||
            entry.name.endsWith(".woff2") ||
            entry.name.endsWith(".woff") ||
            entry.name.endsWith(".svg") ||
            entry.name.endsWith(".webp"))
        ) {
          expected++;
          if ((entry as PerformanceResourceTiming).responseEnd > 0) {
            loaded++;
          }
        }
      }
      bump();
    });

    try {
      observer.observe({ type: "resource", buffered: true });
    } catch {
      resourcesDone = true;
    }

    document.fonts.ready.then(() => {
      fontsReady = true;
      bump();
      checkComplete();
    });

    const poll = setInterval(() => {
      const entries = performance.getEntriesByType("resource");
      expected = entries.length || 1;
      loaded = entries.filter(
        (e) => (e as PerformanceResourceTiming).responseEnd > 0,
      ).length;
      resourcesDone = loaded >= expected && expected > 0;
      bump();
      checkComplete();
    }, 200);

    const cap = setTimeout(finish, HARD_CAP_MS);

    return () => {
      observer.disconnect();
      clearInterval(poll);
      clearTimeout(cap);
    };
  }, []);

  return { progress, ready };
}
