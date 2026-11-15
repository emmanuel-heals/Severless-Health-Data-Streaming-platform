/* Centralized, typed access to build-time environment. No secrets (NFR-SEC-08). */

function bool(v: string | undefined, fallback = false): boolean {
  if (v == null) return fallback;
  return v === 'true' || v === '1';
}

function num(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  authMode: (import.meta.env.VITE_AUTH_MODE ?? 'mock') as 'cognito' | 'mock',
  cognito: {
    region: import.meta.env.VITE_COGNITO_REGION ?? '',
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID ?? '',
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? '',
  },
  incomingFeedPollMs: num(import.meta.env.VITE_INCOMING_FEED_POLL_MS, 20000),
  features: {
    documentUpload: bool(import.meta.env.VITE_FEATURE_DOCUMENT_UPLOAD),
    deIdentifiedAnalyst: bool(import.meta.env.VITE_FEATURE_DEIDENTIFIED_ANALYST),
  },
} as const;
