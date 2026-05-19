import { useEffect } from "react";

export default function VfxInteractionController() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const tiltItems = Array.from(document.querySelectorAll<HTMLElement>("[data-vfx-tilt]"));
    const magneticItems = Array.from(document.querySelectorAll<HTMLElement>(".vfx-wd-magnetic"));

    const tiltCleanup = tiltItems.map((item) => {
      const onMove = (event: PointerEvent) => {
        const rect = item.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        item.style.setProperty("--tilt-x", `${(-y * 5.5).toFixed(2)}deg`);
        item.style.setProperty("--tilt-y", `${(x * 6.5).toFixed(2)}deg`);
        item.style.setProperty("--parallax-x", `${(x * 12).toFixed(2)}px`);
        item.style.setProperty("--parallax-y", `${(y * 10).toFixed(2)}px`);
      };

      const onLeave = () => {
        item.style.setProperty("--tilt-x", "0deg");
        item.style.setProperty("--tilt-y", "0deg");
        item.style.setProperty("--parallax-x", "0px");
        item.style.setProperty("--parallax-y", "0px");
      };

      item.addEventListener("pointermove", onMove);
      item.addEventListener("pointerleave", onLeave);

      return () => {
        item.removeEventListener("pointermove", onMove);
        item.removeEventListener("pointerleave", onLeave);
      };
    });

    const magneticCleanup = magneticItems.map((item) => {
      const onMove = (event: PointerEvent) => {
        const rect = item.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        item.style.setProperty("--magnet-x", `${(x * 10).toFixed(2)}px`);
        item.style.setProperty("--magnet-y", `${(y * 8).toFixed(2)}px`);
      };

      const onLeave = () => {
        item.style.setProperty("--magnet-x", "0px");
        item.style.setProperty("--magnet-y", "0px");
      };

      item.addEventListener("pointermove", onMove);
      item.addEventListener("pointerleave", onLeave);

      return () => {
        item.removeEventListener("pointermove", onMove);
        item.removeEventListener("pointerleave", onLeave);
      };
    });

    return () => {
      tiltCleanup.forEach((dispose) => dispose());
      magneticCleanup.forEach((dispose) => dispose());
    };
  }, []);

  return null;
}
