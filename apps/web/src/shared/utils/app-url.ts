/**
 * Resolves the public base URL of the tenant web app.
 * Uses VITE_APP_URL when set at build time; otherwise falls back to the current origin.
 */
export function resolveTenantAppBaseUrl(): string {
  const configured = import.meta.env.VITE_APP_URL?.trim();
  const base = configured || window.location.origin;
  return base.replace(/\/$/, '');
}

/** Full URL for the tenant login screen (password reset instructions, onboarding, etc.). */
export function resolveTenantLoginUrl(): string {
  return `${resolveTenantAppBaseUrl()}/login`;
}
