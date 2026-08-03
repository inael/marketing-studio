import type { LogtoNextConfig } from "@logto/next";

// Config server-only do Logto (SSO padrao IT Booster).
// Endpoint e fachada Traefik (auth.midiaplay.net); baseUrl e o app (midiaplay.net).
export const logtoConfig: LogtoNextConfig = {
  endpoint: process.env.LOGTO_ENDPOINT!,
  appId: process.env.LOGTO_APP_ID!,
  appSecret: process.env.LOGTO_APP_SECRET!,
  baseUrl: process.env.LOGTO_BASE_URL!,
  cookieSecret: process.env.LOGTO_COOKIE_SECRET!,
  cookieSecure: process.env.NODE_ENV === "production",
};
