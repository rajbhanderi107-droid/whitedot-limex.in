/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Master premium kill switch. "false" ships the simple, reverted site. */
  readonly VITE_WD_PREMIUM_ENABLED?: string;
  /** "false" disables the inline aggregation loading sequence. */
  readonly VITE_WD_AGGREGATION_ENABLED?: string;
  /** "false" disables the continuity offline overlay. */
  readonly VITE_WD_CONTINUITY_ENABLED?: string;
  /** Reserved for the mineral sound system. "false" disables audio. */
  readonly VITE_WD_AUDIO_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
