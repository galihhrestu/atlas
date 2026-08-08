/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_INSIGHT_K3_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
