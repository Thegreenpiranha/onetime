import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db/client";
import { secrets } from "@/lib/db/schema";
import { base64urlDecode } from "@/lib/crypto";
import {
  checkRateLimit,
  getClientId,
  rateLimitResponse,
  LIMITS,
} from "@/lib/rate-limit";

// Force the node runtime — libsql client uses node APIs, not edge.
export const runtime = "nodejs";

const MAX_CIPHERTEXT_BYTES = 1024 * 1024; // 1 MB cap for MVP
const MAX_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const DEFAULT_TTL_SECONDS = 24 * 60 * 60; // 1 day

export async function POST(req: NextRequest) {
  // Rate limit: protects against creation spam / storage exhaustion.
  const clientId = getClientId(req);
  const rl = checkRateLimit(
    `create:${clientId}`,
    LIMITS.create.limit,
    LIMITS.create.windowMs,
  );
  if (!rl.ok) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const {
    ciphertextB64,
    ivB64,
    contentType,
    filename,
    mimeType,
    maxReads,
    expiresInSeconds,
  } = (body ?? {}) as Record<string, unknown>;

  if (typeof ciphertextB64 !== "string" || typeof ivB64 !== "string") {
    return NextResponse.json({ error: "missing ciphertext or iv" }, { status: 400 });
  }
  if (contentType !== "text" && contentType !== "file") {
    return NextResponse.json({ error: "bad content type" }, { status: 400 });
  }

  let ciphertext: Buffer;
  let iv: Buffer;
  try {
    ciphertext = Buffer.from(base64urlDecode(ciphertextB64));
    iv = Buffer.from(base64urlDecode(ivB64));
  } catch {
    return NextResponse.json({ error: "bad encoding" }, { status: 400 });
  }

  if (ciphertext.length > MAX_CIPHERTEXT_BYTES) {
    return NextResponse.json({ error: "too large" }, { status: 413 });
  }
  if (iv.length !== 12) {
    return NextResponse.json({ error: "iv must be 12 bytes" }, { status: 400 });
  }

  const id = nanoid(12);
  const now = Math.floor(Date.now() / 1000);
  const ttl = Math.min(
    Math.max(Number(expiresInSeconds) || DEFAULT_TTL_SECONDS, 60),
    MAX_TTL_SECONDS,
  );

  await db.insert(secrets).values({
    id,
    ciphertext,
    iv,
    contentType,
    filename: contentType === "file" ? String(filename ?? "file") : null,
    mimeType: contentType === "file" ? String(mimeType ?? "application/octet-stream") : null,
    sizeBytes: ciphertext.length,
    createdAt: now,
    expiresAt: now + ttl,
    maxReads: Math.max(1, Math.min(Number(maxReads) || 1, 10)),
    readCount: 0,
  });

  return NextResponse.json({ id });
}
