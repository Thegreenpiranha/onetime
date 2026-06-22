"use client";

import { useEffect, useState, use } from "react";
import { importKeyB64, decrypt, base64urlDecode } from "@/lib/crypto";

type ViewState = "loading" | "ready" | "revealing" | "revealed" | "error";

export default function SecretPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [state, setState] = useState<ViewState>("loading");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [keyB64, setKeyB64] = useState<string | null>(null);

  useEffect(() => {
    const fragment = window.location.hash.slice(1);
    if (!fragment) {
      setError("missing decryption key in url");
      setState("error");
      return;
    }
    setKeyB64(fragment);

    fetch(`/api/secret/${id}/meta`)
      .then(async (res) => {
        if (!res.ok) {
          const e = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(e.error ?? "could not load secret");
        }
        setState("ready");
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "could not load secret");
        setState("error");
      });
  }, [id]);

  async function reveal() {
    if (!keyB64) return;
    setState("revealing");
    try {
      const res = await fetch(`/api/secret/${id}/consume`, { method: "POST" });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error ?? "could not retrieve secret");
      }
      const { ciphertextB64, ivB64 } = (await res.json()) as {
        ciphertextB64: string;
        ivB64: string;
      };

      const key = await importKeyB64(keyB64);
      const ciphertext = base64urlDecode(ciphertextB64);
      const iv = base64urlDecode(ivB64);
      const plaintext = await decrypt(ciphertext, iv, key);

      setContent(new TextDecoder().decode(plaintext));
      setState("revealed");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "decryption failed");
      setState("error");
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 sm:px-8 py-12 sm:py-20">
      {state === "loading" && (
        <>
          <p className="font-mono text-xs uppercase tracking-widest text-muted mb-4">
            // checking link
          </p>
          <p className="font-mono text-sm text-muted">verifying...</p>
        </>
      )}

      {state === "ready" && (
        <>
          <p className="font-mono text-xs uppercase tracking-widest text-muted mb-4">
            // sealed
          </p>
          <h1 className="font-mono text-3xl sm:text-4xl tracking-tight mb-3">
            you have a secret
          </h1>
          <p className="text-sm text-muted mb-10 max-w-md leading-relaxed">
            This link contains an encrypted message. It can be opened exactly
            once. After you reveal it, the link will stop working — for you and
            anyone else.
          </p>

          <button
            onClick={reveal}
            className="border border-ink bg-ink text-bg px-5 py-2.5 font-mono text-sm uppercase tracking-wider hover:bg-bg hover:text-ink transition-colors"
          >
            reveal secret →
          </button>
        </>
      )}

      {state === "revealing" && (
        <>
          <p className="font-mono text-xs uppercase tracking-widest text-muted mb-4">
            // decrypting
          </p>
          <p className="font-mono text-sm text-muted">
            decrypting in your browser...
          </p>
        </>
      )}

      {state === "revealed" && (
        <>
          <p className="font-mono text-xs uppercase tracking-widest text-burn mb-4">
            // revealed &middot; link burned
          </p>
          <h1 className="font-mono text-3xl sm:text-4xl tracking-tight mb-3">
            here it is
          </h1>
          <p className="text-sm text-muted mb-8 max-w-md leading-relaxed">
            Decrypted in your browser. This link will not work again. Copy what
            you need before closing this tab.
          </p>

          <div className="border border-ink bg-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">
              // plaintext
            </p>
            <pre className="font-mono text-sm whitespace-pre-wrap break-words leading-relaxed select-all">
              {content}
            </pre>
          </div>
        </>
      )}

      {state === "error" && (
        <>
          <p className="font-mono text-xs uppercase tracking-widest text-burn mb-4">
            // error
          </p>
          <h1 className="font-mono text-3xl sm:text-4xl tracking-tight mb-3">
            link cannot be opened
          </h1>
          <p className="font-mono text-sm text-muted max-w-md leading-relaxed">
            {error}
          </p>
        </>
      )}
    </main>
  );
}
