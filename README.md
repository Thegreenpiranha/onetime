# onetime

End-to-end encrypted one-time sharing. Paste text, get a single-use link, recipient opens it once — the server only ever stores ciphertext.

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
  api/
    secret/
      route.ts                          # POST   create secret
      [id]/
        meta/route.ts                   # GET    metadata (no read consumed)
        consume/route.ts                # POST   ciphertext + burn
lib/
  crypto.ts                             # Web Crypto helpers (browser-side)
  db/
    client.ts                           # libsql + drizzle
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
- libsql + Drizzle ORM — SQLite locally, swap URL to host on Turso later
- Web Crypto API — AES-256-GCM, no third-party crypto libraries
- nanoid — 12-character secret IDs

## Status

MVP. Text only. 1MB cap. Single read, 24h expiry. Files, password layer, accounts, audit log, team features all come later.

## Roadmap

- v1.0 — text only, single read, 24h (this)
- v1.0.5 — local history (localStorage on sender)
- v1.1 — file upload, configurable expiry & read count
- v1.2 — optional password layer (PBKDF2 + key wrapping)
- v2.0 — accounts, team features, billing
