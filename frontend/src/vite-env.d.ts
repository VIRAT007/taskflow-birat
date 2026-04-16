/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_SAME_ORIGIN_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
