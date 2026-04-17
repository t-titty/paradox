import axios, { AxiosError } from "axios";

const TOKEN_KEY = "paradox.token";

export const api = axios.create({
  baseURL: "/api",
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
