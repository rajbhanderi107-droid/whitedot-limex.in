// White Dot LLP — Mineral Sound System: trigger wiring.
// Attaches delegated listeners so cues fire only on the allowed events.
// NEVER fires on hover, scroll, focus, modal open, tabs, or accordions.
// Removable via `npm run remove:sound:wd`.

import { useEffect } from "react";
import { audioEngine } from "./audioEngine";

const AUDIO_ENABLED = import.meta.env.VITE_WD_AUDIO_ENABLED !== "false";

// Primary CTAs only — WhatsApp / inquiry buttons and the nav action.
const PRIMARY_CTA = ".button.primary, .nav-action";
const NAV_LINK = ".nav-links a, .brand";

export default function SoundTriggers() {
  if (!AUDIO_ENABLED) return null;
  return <EnabledSoundTriggers />;
}

function EnabledSoundTriggers() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;

      // stone-tap: primary CTA presses.
      if (target.closest(PRIMARY_CTA)) {
        audioEngine.play("stoneTap");
        return;
      }
      // settle: deliberate section navigation (nav click → smooth scroll).
      if (target.closest(NAV_LINK)) {
        audioEngine.play("settle");
      }
    };

    // confirmation: form submitted (the signature sound).
    const onSubmit = () => {
      audioEngine.play("confirmation");
    };

    // continuity: connection lost (once per offline transition).
    const onOffline = () => {
      audioEngine.play("continuity");
    };
    // settle: connection restored.
    const onOnline = () => {
      audioEngine.play("settle");
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return null;
}
