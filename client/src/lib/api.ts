import axios, { AxiosError } from "axios";

const TOKEN_KEY = "paradox.token";

// VITE_API_BASE_URL is baked in at build time. If unset, fall back to a
// relative path — correct when the server serves the client on the same
// origin (Railway production, Vite dev proxy).
const API_ORIGIN = import.meta.env.VITE_API_BASE_URL ?? "";

export const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** Extract a user-facing error message from an axios error. */
export function errorMessage(e: unknown, fallback = "Something went wrong."): string {
  if (e instanceof AxiosError) {
    const data = e.response?.data as { message?: string; error?: string } | undefined;
    return data?.message ?? data?.error ?? e.message ?? fallback;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}
