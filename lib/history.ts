// Local sender history.
// Stored in this browser's localStorage. The server has no record of which
// secrets belong to which sender.
//
// Important: the full URL (which contains the decryption key in its fragment)
// is NEVER persisted here. If it were, anyone with access to localStorage
// could re-open every active secret you've sent. This file only stores
// non-secret metadata: id, timestamps, read count.

const KEY = "onetime:history:v1";
const MAX_ENTRIES = 100;

export type HistoryEntry = {
  id: string;
  createdAt: number; // unix seconds
  expiresAt: number; // unix seconds
  maxReads: number;
};

function isHistoryEntry(x: unknown): x is HistoryEntry {
  if (!x || typeof x !== "object") return false;
  const e = x as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.createdAt === "number" &&
    typeof e.expiresAt === "number" &&
    typeof e.maxReads === "number"
  );
}

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHistoryEntry);
  } catch {
    return [];
  }
}

export function addEntry(entry: HistoryEntry): void {
  if (typeof window === "undefined") return;
  const current = getHistory();
  // Newest first, capped to bound storage growth.
  const next = [entry, ...current].slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // localStorage full or disabled — fail silently
  }
}

export function removeEntry(id: string): void {
  if (typeof window === "undefined") return;
  const current = getHistory();
  const next = current.filter((e) => e.id !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // fail silently
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // fail silently
  }
}

// Remove entries whose expiry has passed. No server call needed.
export function pruneExpired(): void {
  if (typeof window === "undefined") return;
  const now = Math.floor(Date.now() / 1000);
  const current = getHistory();
  const next = current.filter((e) => e.expiresAt >= now);
  if (next.length === current.length) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // fail silently
  }
}
