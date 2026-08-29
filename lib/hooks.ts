"use client";
import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Returns a debounced value — useful for live-updating countdown timers so we
 * don't re-render the whole dashboard every 30s when nothing meaningful changed.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * Lightweight in-memory fetch with TTL cache. Avoids hammering /api/notifications
 * every time the dashboard toggles, and revalidates in the background.
 */
type CacheEntry<T> = { value: T; expiresAt: number };
const memCache = new Map<string, CacheEntry<any>>();

export async function cachedFetch<T>(url: string, ttlMs = 15_000, init?: RequestInit): Promise<T> {
  const cached = memCache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    // Revalidate in background
    revalidate(url, ttlMs, init);
    return cached.value;
  }
  return freshFetch(url, ttlMs, init);
}

async function freshFetch<T>(url: string, ttlMs: number, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`fetch ${url} failed: ${res.status}`);
  const value = (await res.json()) as T;
  memCache.set(url, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

function revalidate(url: string, ttlMs: number, init?: RequestInit) {
  freshFetch(url, ttlMs, init).catch(() => {});
}

/**
 * Listens for clicks outside the ref element. Returns a stable handler to close menus.
 */
export function useClickOutside<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCloseRef.current();
      }
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escHandler);
    };
  }, []);

  return ref;
}

/**
 * Stops re-firing effect when only the user id changes (avoids reload on session refresh).
 */
export function useStableUserId(userId: string | undefined) {
  const ref = useRef(userId);
  useEffect(() => {
    if (ref.current !== userId) ref.current = userId;
  }, [userId]);
  return ref.current;
}

/**
 * Persist a string in localStorage with SSR safety.
 */
export function useLocalStorage<T extends string>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(key);
      if (v) setValue(v as T);
    } catch {}
  }, [key]);
  const set = useCallback(
    (v: T) => {
      setValue(v);
      try {
        window.localStorage.setItem(key, v);
      } catch {}
    },
    [key]
  );
  return [value, set] as const;
}
