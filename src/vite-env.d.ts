/// <reference types="vite/client" />

interface Window {
  YandexRotorSettings?: {
    WaiterEnabled?: boolean;
    IsLoaded?: boolean;
  };
}

interface ImportMetaEnv {
  readonly VITE_SITE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
