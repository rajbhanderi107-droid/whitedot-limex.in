import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { soundEngine } from "./soundEngine";

export function SoundToggle() {
  const [muted, setMuted] = useState(() => soundEngine.isMuted());

  useEffect(() => {
    // Sync React state with the global soundEngine subscribers (e.g. if muted from other parts)
    const unsub = soundEngine.subscribe((nextMuted) => {
      setMuted(nextMuted);
    });
    return unsub;
  }, []);

  const handleToggle = () => {
    const nextMuted = soundEngine.toggleMute();
    if (!nextMuted) {
      // Play a quick test sound to confirm unmuting to the user
      soundEngine.play("stone-tap");
    }
  };

  return (
    <button
      type="button"
      className="cine-sound-toggle"
      onClick={handleToggle}
      aria-label={muted ? "Unmute mineral sounds" : "Mute mineral sounds"}
      title={muted ? "Enable audio cues" : "Disable audio cues"}
    >
      {muted ? (
        <>
          <VolumeX size={15} aria-hidden="true" />
          <span>Sound Off</span>
        </>
      ) : (
        <>
          <Volume2 size={15} aria-hidden="true" className="is-pulsing" />
          <span>Sound On</span>
        </>
      )}
    </button>
  );
}
