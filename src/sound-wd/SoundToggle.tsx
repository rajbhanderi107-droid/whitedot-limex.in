// White Dot LLP — Mineral Sound System: footer speaker toggle.
// Removable via `npm run remove:sound:wd`.

import { Volume2, VolumeX } from "lucide-react";
import { audioEngine } from "./audioEngine";
import { useSoundToggle } from "./useSoundToggle";

const AUDIO_ENABLED = import.meta.env.VITE_WD_AUDIO_ENABLED !== "false";

export default function SoundToggle() {
  if (!AUDIO_ENABLED) return null;
  return <EnabledSoundToggle />;
}

function EnabledSoundToggle() {
  const { enabled, toggle } = useSoundToggle();

  const handleToggle = () => {
    toggle();
    // Confirm the new state audibly when turning sound on.
    if (!enabled) {
      audioEngine.play("stoneTap");
    }
  };

  return (
    <button
      type="button"
      className="sound-wd-toggle"
      onClick={handleToggle}
      aria-pressed={enabled}
      aria-label={enabled ? "Mute interface sound" : "Enable interface sound"}
      title={enabled ? "Sound on" : "Sound off"}
    >
      {enabled ? <Volume2 size={17} aria-hidden="true" /> : <VolumeX size={17} aria-hidden="true" />}
      <span>{enabled ? "Sound on" : "Sound off"}</span>
    </button>
  );
}
