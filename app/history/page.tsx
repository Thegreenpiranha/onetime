"use client";

import { useEffect, useState } from "react";
import {
  getHistory,
  removeEntry,
  clearHistory,
  pruneExpired,
  type HistoryEntry,
} from "@/lib/history";

type Status = "checking" | "active" | "burned" | "expired" | "unknown";

type EntryWithStatus = HistoryEntry & {
  status: Status;
  remainingReads?: number;
};

export default function HistoryPage() {
  const [entries, setEntries] = useState<EntryWithStatus[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    pruneExpired();
    const initial = getHistory();
    const now = Math.floor(Date.now() / 1000);

    // Mark locally-expired entries without calling the server.
    const withStatus: EntryWithStatus[] = initial.map((e) => ({
      ...e,
      status: e.expiresAt < now ? "expired" : "checking",
    }));
    setEntries(withStatus);
    setLoaded(true);

    // Check server status for still-alive entries.
    initial.forEach(async (entry) => {
      if (entry.expiresAt < now) return;
      try {
        const res = await fetch(`/api/secret/${entry.id}/meta`);
        if (res.ok) {
          const data = (await res.json()) as { remainingReads?: number };
          updateStatus(entry.id, "active", data.remainingReads);
        } else if (res.status === 410 || res.status === 404) {
          updateStatus(entry.id, "burned");
        } else {
          updateStatus(entry.id, "unknown");
        }
      } catch {
        updateStatus(entry.id, "unknown");
      }
    });
  }, []);

  function updateStatus(id: string, status: Status, remainingReads?: number) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status, remainingReads } : e)),
    );
  }

  function handleForget(id: string) {
    removeEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function handleClear() {
    if (
      !confirm(
        "Forget all entries from this browser?\n\nThis won't affect any secrets on the server — they'll still expire or burn as normal.",
      )
    ) {
      return;
    }
    clearHistory();
    setEntries([]);
  }

  if (!loaded) {
    return (
      <main className="mx-auto max-w-2xl px-6 sm:px-8 py-12 sm:py-20">
        <p className="font-mono text-xs uppercase tracking-widest text-muted mb-4">
          // history
        </p>
        <p className="font-mono text-sm text-muted">loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 sm:px-8 py-12 sm:py-20">
      <p className="font-mono text-xs uppercase tracking-widest text-muted mb-4">
        // history
      </p>
      <h1 className="font-mono text-3xl sm:text-4xl tracking-tight mb-3">
        your secrets
      </h1>
      <p className="text-sm text-muted mb-10 max-w-md leading-relaxed">
        Stored only in this browser. The server has no record of which secrets
        are yours. The decryption links are not saved — once you navigated
        away from the create page, even you cannot re-open them.
      </p>

      {entries.length === 0 ? (
        <p className="font-mono text-sm text-muted">
          // no entries. anything you create will be listed here.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-rule border-y border-rule">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="py-4 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <span className="font-mono text-sm">{entry.id}</span>
                    <StatusBadge status={entry.status} />
                  </div>
                  <p className="font-mono text-xs text-muted">
                    created {formatRelative(entry.createdAt)}
                    {entry.status === "active" &&
                    entry.remainingReads !== undefined
                      ? ` · ${entry.remainingReads}/${entry.maxReads} reads left`
                      : ""}
                    {entry.status !== "expired" &&
                      ` · expires ${formatRelative(entry.expiresAt)}`}
                  </p>
                </div>
                <button
                  onClick={() => handleForget(entry.id)}
                  className="font-mono text-xs text-muted hover:text-burn transition-colors uppercase tracking-wider shrink-0"
                  aria-label={`Forget ${entry.id}`}
                >
                  forget
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex items-center justify-between gap-4 flex-wrap">
            <p className="font-mono text-xs text-muted uppercase tracking-wider">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </p>
            <button
              onClick={handleClear}
              className="border border-rule px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-burn hover:text-bg hover:border-burn transition-colors"
            >
              forget all
            </button>
          </div>
        </>
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const labels: Record<Status, string> = {
    checking: "// checking",
    active: "// active",
    burned: "// burned",
    expired: "// expired",
    unknown: "// unknown",
  };
  const colorClass = status === "burned" ? "text-burn" : "text-muted";
  return (
    <span
      className={`font-mono text-[10px] uppercase tracking-widest ${colorClass}`}
    >
      {labels[status]}
    </span>
  );
}

function formatRelative(unix: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = unix - now;
  const abs = Math.abs(diff);
  const isPast = diff < 0;

  if (abs < 60) return isPast ? "just now" : "in moments";
  if (abs < 3600) {
    const m = Math.round(abs / 60);
    return isPast ? `${m}m ago` : `in ${m}m`;
  }
  if (abs < 86400) {
    const h = Math.round(abs / 3600);
    return isPast ? `${h}h ago` : `in ${h}h`;
  }
  const d = Math.round(abs / 86400);
  return isPast ? `${d}d ago` : `in ${d}d`;
}
