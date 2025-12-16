// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Entorno actual
  environment: process.env.NODE_ENV || 'development',

  // Sampling de trazas (10% en producción para reducir costos)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // NO enviar PII por defecto (privacidad y seguridad)
  sendDefaultPii: false,

  // Ignorar errores comunes que no son problemas reales
  ignoreErrors: [
    'Non-Error promise rejection captured',
    'ResizeObserver loop limit exceeded',
    'AbortError',
    'Network request failed',
    'Load failed', // Errores de red del cliente
  ],

  // Configuración de beforeSend para sanitizar datos sensibles
  beforeSend(event, hint) {
    // No enviar errores en desarrollo (opcional)
    if (process.env.NODE_ENV === 'development') {
      console.log('🐛 Sentry event (dev mode):', event);
      return null; // No enviar a Sentry en desarrollo
    }

    // Sanitizar datos sensibles
    if (event.request) {
      // Eliminar cookies (pueden contener tokens de sesión)
      delete event.request.cookies;

      // Eliminar headers sensibles
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-access-token'];
      }
    }

    // Sanitizar datos de formularios
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>;
      if (data.password) data.password = '[REDACTED]';
      if (data.cardNumber) data.cardNumber = '[REDACTED]';
      if (data.cvv) data.cvv = '[REDACTED]';
      if (data.token) data.token = '[REDACTED]';
    }

    return event;
  },
});
