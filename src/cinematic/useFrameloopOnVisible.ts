import { useEffect, useRef, useState } from "react";

/**
 * Pauses a React Three Fiber canvas while it is scrolled out of view.
 *
 * The site mounts several independent <Canvas> scenes (hero, Born of LIMEX,
 * material core). Left at the default `frameloop="always"`, every one keeps
 * rendering its full post-processing pipeline each frame even when off-screen,
 * which saturates the GPU and makes scrolling hang. This observes the canvas
 * element and flips `frameloop` to "never" once it leaves the viewport (plus a
 * margin so it resumes slightly before re-entering), so only the visible scene
 * renders.
 *
 * Defaults to "always" so the first paint of an in-view canvas is never blank.
 */
export function useFrameloopOnVisible(rootMargin = "200px") {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      ([entry]) => setFrameloop(entry.isIntersecting ? "always" : "never"),
      { rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);

  return { canvasRef, frameloop };
}
