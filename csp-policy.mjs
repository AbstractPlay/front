/** Production CSP — injected into index.html at Vite build time. */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com 'unsafe-inline' 'unsafe-eval'",
  "script-src-elem 'self' https://www.googletagmanager.com https://www.google-analytics.com 'unsafe-inline'",
  "worker-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
  "style-src-elem 'self' https://fonts.googleapis.com https://cdnjs.cloudflare.com 'unsafe-inline'",
  "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:",
  "img-src 'self' data: https://www.google-analytics.com https://www.googletagmanager.com https://thumbnails.abstractplay.com",
  "connect-src 'self' https://api.abstractplay.com https://alyhqu85me.execute-api.us-east-1.amazonaws.com https://7n1lziet28.execute-api.us-east-1.amazonaws.com wss://qwmw4fb0l6.execute-api.us-east-1.amazonaws.com wss://2ce8ziwh86.execute-api.us-east-1.amazonaws.com https://records.abstractplay.com https://auth.dev.abstractplay.com https://auth.abstractplay.com https://cognito-idp.us-east-1.amazonaws.com https://thumbnails.abstractplay.com https://www.google-analytics.com https://www.google.com https://www.googletagmanager.com https://fcm.googleapis.com https://*.googleapis.com",
  "manifest-src 'self'",
].join("; ");
