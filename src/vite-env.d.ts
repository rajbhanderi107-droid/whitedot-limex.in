/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Master premium kill switch. "false" ships the simple, reverted site. */
  readonly VITE_WD_PREMIUM_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
