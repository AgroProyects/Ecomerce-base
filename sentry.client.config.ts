// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Entorno actual
  environment: process.env.NODE_ENV || 'development',

  // Sampling de trazas (10% en producción)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay: Graba sesiones para debugging visual
  // 10% de sesiones normales, 100% cuando hay error
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  replaysOnErrorSampleRate: 1.0,

  // NO enviar PII por defecto
  sendDefaultPii: false,

  // Ignorar errores comunes del navegador
  ignoreErrors: [
    'Non-Error promise rejection captured',
    'ResizeObserver loop limit exceeded',
    'AbortError',
    'Network request failed',
    'Load failed',
    'Failed to fetch',
    'NetworkError when attempting to fetch resource',
    'The operation was aborted',
    // Errores de extensiones del navegador
    'chrome-extension://',
    'moz-extension://',
  ],

  // Integraciones
  integrations: [
    Sentry.replayIntegration({
      // Enmascarar texto sensible
      maskAllText: true,
      // Bloquear todos los medios (imágenes, videos)
      blockAllMedia: true,
      // Enmascarar inputs
      maskAllInputs: true,
    }),
  ],

  // Configuración de beforeSend para sanitizar datos sensibles
  beforeSend(event, hint) {
    // No enviar errores en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('🐛 Sentry event (dev - client):', event);
      return null;
    }

    // Sanitizar datos sensibles en breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
        if (breadcrumb.data) {
          // Redactar datos sensibles en breadcrumbs
          if (breadcrumb.data.password) breadcrumb.data.password = '[REDACTED]';
          if (breadcrumb.data.token) breadcrumb.data.token = '[REDACTED]';
          if (breadcrumb.data.cardNumber) breadcrumb.data.cardNumber = '[REDACTED]';
        }
        return breadcrumb;
      });
    }

    return event;
  },
});
