"use client";

import { useState } from "react";
import {
  generateKey,
  exportKeyB64,
  encrypt,
  base64urlEncode,
} from "@/lib/crypto";

export default function Home() {
  const [content, setContent] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
          maxReads: 1,
          expiresInSeconds: 24 * 60 * 60,
        }),
      });

      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error ?? "could not create secret");
      }

      const { id } = (await res.json()) as { id: string };
      const url = `${window.location.origin}/s/${id}#${keyB64}`;
      setLink(url);
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

          <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
            <p className="font-mono text-xs text-muted uppercase tracking-wider">
              {content.length > 0 ? `${content.length} chars` : "empty"} &middot; 1 read &middot; expires 24h
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
            Send this link through any channel. It works exactly once, then the
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
