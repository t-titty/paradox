import axios, { AxiosError } from "axios";

const TOKEN_KEY = "paradox.token";

// VITE_API_BASE_URL is baked in at build time. In production Railway sets
// it to the deployed origin; in dev we fall back to the local server.
// Trailing slashes are trimmed so we never produce "//api".
// Production builds served by the PARADOX server itself (Railway, staging)
// can leave it unset — the API is then the page's own origin.
function resolveApiUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  const onLocalhost = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  if (configured) {
    // A deployed copy built with a localhost API address would send every
    // request to the visitor's own computer. Use the site itself instead.
    if (import.meta.env.PROD && !onLocalhost && /\/\/(localhost|127\.0\.0\.1)[:/]?/.test(configured)) {
      return window.location.origin;
    }
    return configured;
  }
  return import.meta.env.PROD ? window.location.origin : "http://localhost:4000";
}

export const API_URL = resolveApiUrl().replace(/\/+$/, "");

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
  // Free hosting sleeps when idle and takes up to a minute to wake.
  timeout: 90_000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Token storage strategy:
 *   remember=true  → localStorage (survives browser close, up to the JWT's 30d TTL)
 *   remember=false → sessionStorage (dies when the tab closes)
 * We always clear the "other" store on write so only one copy ever exists.
 * Logout (token=null) clears both.
 */
export function setToken(token: string | null, remember: boolean = true): void {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    return;
  }
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

/** Extract a user-facing error message from an axios error. */
export function errorMessage(e: unknown, fallback = "Something went wrong."): string {
  if (e instanceof AxiosError) {
    if (!e.response) {
      // No answer at all: offline, server asleep/restarting, or timed out.
      return e.code === "ECONNABORTED"
        ? "The server took too long to answer. It may be waking up — try again in a moment."
        : "Couldn't reach the PARADOX server. Check your connection, or try again in a minute if it's waking up.";
    }
    const data = e.response.data as
      | { message?: string; error?: string; issues?: { fieldErrors?: Record<string, string[]> } }
      | undefined;
    // Validation errors: surface the first field message instead of "validation_error".
    const fieldErrors = data?.issues?.fieldErrors;
    if (fieldErrors) {
      const first = Object.entries(fieldErrors).find(([, msgs]) => msgs && msgs.length > 0);
      if (first) return `${first[0]}: ${first[1][0]}`;
    }
    return data?.message ?? (data?.error && data.error !== "validation_error" ? data.error : null) ?? e.message ?? fallback;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}
