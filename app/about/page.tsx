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
            A tool for sharing a piece of sensitive text — a password, an API
            key, a recovery phrase, a private note — with one specific person,
            exactly once. They open the link, see the message, and the message
            is destroyed. The server only ever holds encrypted bytes. Even if
            its database were leaked tomorrow, your secret would still be
            unreadable.
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
            the key from the URL fragment, and decrypts locally. Then the
            server deletes the blob.
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
            <dt className="text-ink mb-1.5">Can I send files?</dt>
            <dd className="text-muted">Not yet. Text only for now. Files are on the roadmap.</dd>
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
            <dt className="text-ink mb-1.5">Is the source open?</dt>
            <dd className="text-muted">
              Yes. Link coming when the repo goes public.
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
        </div>
      </section>
    </main>
  );
}
