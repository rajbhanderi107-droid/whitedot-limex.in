import { LimexAssistant } from "./LimexAssistant";

/**
 * Mounts the LIMEX Assistant unless disabled via the kill switch.
 * Returns null when VITE_WD_ASSISTANT_ENABLED === "false" (defaults to enabled).
 */
export function AssistantShell() {
  if (import.meta.env.VITE_WD_ASSISTANT_ENABLED === "false") return null;
  return <LimexAssistant />;
}

export { LimexAssistant };
