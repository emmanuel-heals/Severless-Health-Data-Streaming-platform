/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_COGNITO_REGION?: string;
  readonly VITE_COGNITO_USER_POOL_ID?: string;
  readonly VITE_COGNITO_CLIENT_ID?: string;
  readonly VITE_AUTH_MODE?: 'cognito' | 'mock';
  readonly VITE_INCOMING_FEED_POLL_MS?: string;
  readonly VITE_FEATURE_DOCUMENT_UPLOAD?: string;
  readonly VITE_FEATURE_DEIDENTIFIED_ANALYST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
