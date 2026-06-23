# onetime

End-to-end encrypted one-time sharing. Paste text or drop a file, get a single-use link, recipient opens it once — the server only ever stores ciphertext.

**Repository:** https://github.com/Thegreenpiranha/onetime

## How the security works

- The browser generates a random AES-256 key and encrypts the content **locally** (Web Crypto API, AES-GCM).
- Only the ciphertext + IV are uploaded to the server.
- The encryption key goes in the URL fragment (`/s/abc123#KEY`). Browsers do **not** send URL fragments to servers, so the key never leaves the client.
- The recipient's browser extracts the key from the fragment, fetches the ciphertext, and decrypts locally.
- After being read (or expiring), the row is deleted from the DB.

The server never holds plaintext, never holds the key, and never sees the URL the user shares.

## Local setup

```bash
cp .env.example .env.local
npm install
npm run db:push      # creates ./local.db with the schema
npm run dev          # http://localhost:3000
```

That's it. No accounts, no other services to spin up.

## Project layout

```
app/
  page.tsx                              # sender view (encrypt → link)
  s/[id]/page.tsx                       # recipient view (decrypt)
  history/page.tsx                      # local sender history
  about/page.tsx                        # how it works / FAQ
  api/
    secret/
      route.ts                          # POST   create secret
      [id]/
        meta/route.ts                   # GET    metadata (no read consumed)
        consume/route.ts                # POST   ciphertext + burn
lib/
  crypto.ts                             # Web Crypto helpers (browser-side)
  rate-limit.ts                         # in-memory sliding window per IP
  history.ts                            # localStorage history (browser-side)
  db/
    client.ts                           # better-sqlite3 + drizzle
    schema.ts                           # secrets table
drizzle.config.ts
```

## Useful commands

```bash
npm run dev          # dev server
npm run build        # production build
npm run db:push      # apply schema changes to local DB
npm run db:studio    # GUI at https://local.drizzle.studio
```

## Tech

- Next.js 16 (App Router) — frontend + API in one repo
- TypeScript
- Tailwind 4
- better-sqlite3 + Drizzle ORM — SQLite locally, swap URL to host on Turso/D1 later
- Web Crypto API — AES-256-GCM, no third-party crypto libraries
- nanoid — 12-character secret IDs

## What's shipped

- Text and file secrets (up to 4 MB per file, drag-and-drop in the browser)
- Configurable reads (1 / 3 / 5 / 10) and expiry (5m / 1h / 24h / 7d)
- Single-use links with server-side burn on consume
- Per-IP rate limiting on all endpoints (in-memory sliding window)
- Local sender history (localStorage, no URL/key leakage, never on the server)
- Distinct mono-aesthetic UI with light/dark via system preference

## Roadmap

- v1.0 — text encryption, one-time reveal ✓
- v1.0.5 — configurable reads/expiry, local history, rate limiting ✓
- v1.1 — file upload ✓
- v1.2 — optional password layer (PBKDF2 + key wrapping)
- v2.0 — accounts, team features, billing, distributed rate limiter
