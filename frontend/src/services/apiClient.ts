// Centralized API client. Reads base URL from env so swapping to a real
// backend is a one-line change. Currently routes to a mock adapter that
// persists to localStorage, simulating realistic latency + occasional errors.

import { mockRequest } from "./mockAdapter";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

// Toggle this to `false` once a real backend is available.
const USE_MOCK = false;

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | undefined>;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

export async function apiRequest<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  if (USE_MOCK) {
    return mockRequest<T>(path, opts);
  }

  const url = new URL(path, API_BASE_URL);
  if (opts.query) {
    Object.entries(opts.query).forEach(([k, v]) => {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    });
  }

  const res = await fetch(url.toString(), {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...opts.headers,
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}
