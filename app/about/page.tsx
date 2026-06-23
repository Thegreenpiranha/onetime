export const metadata = {
  title: "how it works — onetime",
  description:
    "How onetime keeps your one-time secrets private. Plain-language explanation of the encryption, the threat model, and what the server can and cannot see.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 sm:px-8 py-12 sm:py-20">
      <p className="font-mono text-xs uppercase tracking-widest text-muted mb-4">
        // about
      </p>
      <h1 className="font-mono text-3xl sm:text-4xl tracking-tight mb-3">
        how onetime works
      </h1>
      <p className="text-sm text-muted mb-14 max-w-md leading-relaxed">
        A short, honest explanation of what this tool does, what it cannot see,
        and how you can verify the claims yourself.
      </p>

      <section className="mb-12">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted mb-4">
          // what this is
        </h2>
        <div className="text-sm leading-relaxed space-y-4 max-w-prose">
          <p>
            A tool for sharing a piece of sensitive text or a small file — a
            password, an API key, a recovery phrase, a private note, a
            screenshot — with one specific person, exactly once (or up to ten
            times, your choice). They open the link, see the message or
            download the file, and the content is destroyed. The server only
            ever holds encrypted bytes. Even if its database were leaked
            tomorrow, your secret would still be unreadable.
          </p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted mb-4">
          // how it works
        </h2>
        <div className="text-sm leading-relaxed space-y-4 max-w-prose">
          <p>
            When you click <span className="font-mono">encrypt</span>, your
            browser does four things, in this order:
          </p>
          <ol className="list-decimal list-outside pl-5 space-y-2">
            <li>Generates a random 256-bit encryption key.</li>
            <li>
              Encrypts your message with that key, in the browser, using
              AES-256-GCM.
            </li>
            <li>Uploads only the encrypted ciphertext to the server.</li>
            <li>
              Builds a link like{" "}
              <span className="font-mono">/s/abc123#KEY-HERE</span> and shows it
              to you.
            </li>
          </ol>
          <p>
            The part of the link after the <span className="font-mono">#</span>{" "}
            is called a URL fragment. Browsers do not send URL fragments to
            servers — they exist only on the client side. So the encryption
            key never reaches us.
          </p>
          <p>
            When the recipient opens the link, the same thing runs in reverse:
            their browser pulls the encrypted blob from the server, extracts
            the key from the URL fragment, and decrypts locally. When the read
            count is exhausted, the server deletes the blob.
          </p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted mb-4">
          // privacy claims
        </h2>
        <div className="text-sm leading-relaxed space-y-4 max-w-prose">
          <p>
            <span className="text-ink">The server cannot read your secret.</span>{" "}
            It only stores encrypted bytes and never sees the key.
          </p>
          <p>
            <span className="text-ink">The crypto is standard.</span> AES-256-GCM
            is the same NIST-approved algorithm used by HTTPS, banking systems,
            and full-disk encryption. Nothing exotic, nothing rolled by hand.
          </p>
          <p>
            <span className="text-ink">The link is the password.</span> Anyone
            who has the link can decrypt the message. So treat the link like
            the secret itself — share it through a channel you trust (Signal,
            encrypted email, in person).
          </p>
          <p>
            <span className="text-ink">
              Your sender history stays in your browser.
            </span>{" "}
            The list of links you&apos;ve created lives only in this
            browser&apos;s localStorage. The server has no record of which
            secrets were created by whom. And the decryption links themselves
            are never stored — only the IDs and timestamps — so even you
            cannot re-open a secret you&apos;ve already sent.
          </p>
          <p>
            <span className="text-ink">You can verify all of this.</span> The
            source code is open. If you stop trusting this domain, you can
            self-host the same code and use it privately.
          </p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted mb-4">
          // FAQ
        </h2>
        <dl className="space-y-7 text-sm leading-relaxed max-w-prose">
          <div>
            <dt className="text-ink mb-1.5">
              Can the server read my secret?
            </dt>
            <dd className="text-muted">
              No. It stores encrypted bytes only. The decryption key lives in
              the URL fragment, which browsers never transmit.
            </dd>
          </div>
          <div>
            <dt className="text-ink mb-1.5">What if I lose the link?</dt>
            <dd className="text-muted">
              The secret is unrecoverable. The server doesn&apos;t have the
              key — there&apos;s nothing to send you. This is by design.
            </dd>
          </div>
          <div>
            <dt className="text-ink mb-1.5">
              What if someone intercepts the link?
            </dt>
            <dd className="text-muted">
              They have full access to the secret. Share the link through a
              channel you&apos;d trust with the secret itself.
            </dd>
          </div>
          <div>
            <dt className="text-ink mb-1.5">
              How long does the secret live on the server?
            </dt>
            <dd className="text-muted">
              Until it&apos;s read (1 to 10 times, your choice) or the expiry
              passes (5 minutes to 7 days, your choice), whichever comes first.
              Then the row is deleted.
            </dd>
          </div>
          <div>
            <dt className="text-ink mb-1.5">Can I see what I&apos;ve sent?</dt>
            <dd className="text-muted">
              Yes, on the <span className="font-mono">//history</span> page.
              The list is stored only in your browser. The server has no
              record of which secrets are yours. We don&apos;t store the
              decryption links themselves — only metadata (id, when it was
              created, when it expires, how many reads are left). Once
              you&apos;ve navigated away from the create page, even you
              cannot re-open a sent secret. This preserves the one-time
              promise: if your browser is compromised, your past secrets
              aren&apos;t exposed through the history.
            </dd>
          </div>
          <div>
            <dt className="text-ink mb-1.5">Can I send files?</dt>
            <dd className="text-muted">
              Yes, up to 4 MB per file. Drag-and-drop or click to pick. The
              file is encrypted in your browser before upload — the server
              only ever sees ciphertext, exactly like with text. The recipient
              gets a download dialog when they open the link.
            </dd>
          </div>
          <div>
            <dt className="text-ink mb-1.5">
              Is this safe for passwords?
            </dt>
            <dd className="text-muted">
              Yes — passwords are the most common use case. The same crypto
              that protects your bank login protects this.
            </dd>
          </div>
          <div>
            <dt className="text-ink mb-1.5">
              Can you prevent screenshots?
            </dt>
            <dd className="text-muted">
              No. Once a secret is revealed in a browser, the recipient owns
              the content — screenshots, screen recordings, phone cameras
              pointed at the screen, all out of our reach. Any web tool that
              claims to prevent this is misleading. What we do protect: the
              secret in transit, the secret at rest on the server, and the
              ability to re-open the link after it&apos;s been read.
            </dd>
          </div>
          <div>
            <dt className="text-ink mb-1.5">Are there usage limits?</dt>
            <dd className="text-muted">
              Yes — to prevent abuse, there are per-IP rate limits: 20
              creations, 120 metadata reads, and 60 reveals per minute.
              Normal use will never hit these.
            </dd>
          </div>
          <div>
            <dt className="text-ink mb-1.5">Is the source open?</dt>
            <dd className="text-muted">
              Yes —{" "}
              <a
                href="https://github.com/Thegreenpiranha/onetime"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline underline-offset-2 hover:text-burn transition-colors"
              >
                github.com/Thegreenpiranha/onetime
              </a>
              .
            </dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted mb-4">
          // technical
        </h2>
        <div className="text-sm leading-relaxed space-y-4 max-w-prose">
          <p>
            Encryption: AES-256-GCM via the browser&apos;s native Web Crypto
            API. No third-party crypto libraries are loaded.
          </p>
          <p>
            Key: 256 random bits, base64url-encoded into the URL fragment. The
            initialization vector is 12 random bytes, stored alongside the
            ciphertext (IVs are not secret).
          </p>
          <p>
            Storage: a single SQLite table holds the ciphertext, IV, expiry,
            and read counter. Rows are deleted on read or expiry.
          </p>
          <p>
            Limits: 4 MB plaintext per file (5 MB ciphertext on the wire).
            Larger files will need direct-to-storage uploads, which is a
            future change.
          </p>
          <p>
            Rate limiting: in-memory sliding window, per-IP. Defaults are 20
            creates / 120 metadata reads / 60 reveals per minute. Tunable in{" "}
            <span className="font-mono">lib/rate-limit.ts</span>.
          </p>
          <p>
            History: client-side only,{" "}
            <span className="font-mono">localStorage</span> key{" "}
            <span className="font-mono">onetime:history:v1</span>. The server
            has no equivalent record.
          </p>
        </div>
      </section>
    </main>
  );
}
