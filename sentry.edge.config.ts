// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Entorno actual
  environment: process.env.NODE_ENV || 'development',

  // Sampling de trazas (10% en producción)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // NO enviar PII por defecto
  sendDefaultPii: false,

  // Ignorar errores comunes en edge runtime
  ignoreErrors: [
    'Non-Error promise rejection captured',
    'AbortError',
    'Network request failed',
  ],
});
