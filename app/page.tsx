"use client";

import { useState } from "react";
import {
  generateKey,
  exportKeyB64,
  encrypt,
  base64urlEncode,
} from "@/lib/crypto";
import { addEntry } from "@/lib/history";

const READS_OPTIONS = [1, 3, 5, 10] as const;

const EXPIRY_OPTIONS = [
  { label: "5m", display: "5 minutes", value: 5 * 60 },
  { label: "1h", display: "1 hour", value: 60 * 60 },
  { label: "24h", display: "24 hours", value: 24 * 60 * 60 },
  { label: "7d", display: "7 days", value: 7 * 24 * 60 * 60 },
] as const;

export default function Home() {
  const [content, setContent] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [maxReads, setMaxReads] = useState<number>(1);
  const [expiresInSeconds, setExpiresInSeconds] = useState<number>(
    24 * 60 * 60,
  );

  const expiryDisplay =
    EXPIRY_OPTIONS.find((o) => o.value === expiresInSeconds)?.display ??
    "24 hours";

  async function handleEncrypt() {
    if (!content.trim()) return;
    setBusy(true);
    setError(null);
    setLink(null);
    try {
      const key = await generateKey();
      const plaintext = new TextEncoder().encode(content);
      const { ciphertext, iv } = await encrypt(plaintext, key);
      const keyB64 = await exportKeyB64(key);

      const res = await fetch("/api/secret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ciphertextB64: base64urlEncode(ciphertext),
          ivB64: base64urlEncode(iv),
          contentType: "text",
          maxReads,
          expiresInSeconds,
        }),
      });

      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error ?? "could not create secret");
      }

      const { id } = (await res.json()) as { id: string };
      const url = `${window.location.origin}/s/${id}#${keyB64}`;
      setLink(url);

      // Record metadata (NOT the URL — that would leak the key) to local
      // history so the sender can see what they've sent and its status.
      const now = Math.floor(Date.now() / 1000);
      addEntry({
        id,
        createdAt: now,
        expiresAt: now + expiresInSeconds,
        maxReads,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function copy() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function reset() {
    // Keep maxReads + expiresInSeconds so the user's preferences persist
    setLink(null);
    setContent("");
    setError(null);
  }

  return (
    <main className="mx-auto max-w-2xl px-6 sm:px-8 py-12 sm:py-20">
      {!link ? (
        <>
          <p className="font-mono text-xs uppercase tracking-widest text-muted mb-4">
            // create
          </p>
          <h1 className="font-mono text-3xl sm:text-4xl tracking-tight mb-3">
            send a one-time secret
          </h1>
          <p className="text-sm text-muted mb-10 max-w-md leading-relaxed">
            Encrypted in your browser before it leaves. The server stores the
            ciphertext; the decryption key lives only in the link you share.
            Once opened, it is gone.
          </p>

          <textarea
            className="w-full h-56 border border-rule bg-surface p-4 font-mono text-sm outline-none focus:border-ink resize-none placeholder:text-muted"
            placeholder="paste your secret here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={busy}
            autoFocus
          />

          <div className="mt-5 flex flex-wrap gap-x-8 gap-y-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1.5">
                // reads
              </p>
              <div className="inline-flex border border-rule">
                {READS_OPTIONS.map((n, i) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMaxReads(n)}
                    disabled={busy}
                    className={`px-3 py-1.5 font-mono text-xs min-w-[2.5rem] ${
                      i !== 0 ? "border-l border-rule" : ""
                    } ${
                      maxReads === n
                        ? "bg-ink text-bg"
                        : "hover:bg-ink hover:text-bg transition-colors"
                    } disabled:opacity-40`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1.5">
                // expires
              </p>
              <div className="inline-flex border border-rule">
                {EXPIRY_OPTIONS.map((opt, i) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExpiresInSeconds(opt.value)}
                    disabled={busy}
                    className={`px-3 py-1.5 font-mono text-xs min-w-[2.5rem] ${
                      i !== 0 ? "border-l border-rule" : ""
                    } ${
                      expiresInSeconds === opt.value
                        ? "bg-ink text-bg"
                        : "hover:bg-ink hover:text-bg transition-colors"
                    } disabled:opacity-40`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between gap-4 flex-wrap">
            <p className="font-mono text-xs text-muted uppercase tracking-wider">
              {content.length > 0 ? `${content.length} chars` : "empty"}
            </p>
            <button
              onClick={handleEncrypt}
              disabled={busy || !content.trim()}
              className="border border-ink bg-ink text-bg px-5 py-2.5 font-mono text-sm uppercase tracking-wider disabled:opacity-40 hover:bg-bg hover:text-ink transition-colors"
            >
              {busy ? "encrypting..." : "encrypt →"}
            </button>
          </div>

          {error && (
            <p className="mt-6 font-mono text-xs text-burn uppercase tracking-wider">
              // error: {error}
            </p>
          )}
        </>
      ) : (
        <>
          <p className="font-mono text-xs uppercase tracking-widest text-muted mb-4">
            // sealed &middot; ready to share
          </p>
          <h1 className="font-mono text-3xl sm:text-4xl tracking-tight mb-3">
            link generated
          </h1>
          <p className="text-sm text-muted mb-10 max-w-md leading-relaxed">
            Send this link through any channel. It works{" "}
            {maxReads === 1 ? "exactly once" : `up to ${maxReads} times`} and
            expires in {expiryDisplay}, whichever comes first. After that, the
            ciphertext is deleted from the server.
          </p>

          <div className="border border-ink bg-surface p-5 mb-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">
              // share url
            </p>
            <p className="font-mono text-sm sm:text-base break-all leading-relaxed select-all">
              {link}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={copy}
              className="border border-ink bg-ink text-bg px-5 py-2.5 font-mono text-sm uppercase tracking-wider hover:bg-bg hover:text-ink transition-colors"
            >
              {copied ? "copied ✓" : "copy link"}
            </button>
            <button
              onClick={reset}
              className="border border-ink px-5 py-2.5 font-mono text-sm uppercase tracking-wider hover:bg-ink hover:text-bg transition-colors"
            >
              send another
            </button>
          </div>

          <p className="mt-10 font-mono text-xs text-muted leading-relaxed max-w-md">
            ⚠ if you lose this link, the secret cannot be recovered. The server
            does not have the key.
          </p>
        </>
      )}
    </main>
  );
}
