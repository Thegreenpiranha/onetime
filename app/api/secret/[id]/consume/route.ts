import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { secrets } from "@/lib/db/schema";
import { base64urlEncode } from "@/lib/crypto";

export const runtime = "nodejs";

// POST not GET, deliberately: GETs get prefetched by browsers, link previewers,
// antivirus scanners. We don't want a Slack preview to burn the link.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const now = Math.floor(Date.now() / 1000);

  const rows = await db.select().from(secrets).where(eq(secrets.id, id)).limit(1);
  const row = rows[0];

  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (row.expiresAt < now || row.readCount >= row.maxReads) {
    await db.delete(secrets).where(eq(secrets.id, id));
    return NextResponse.json({ error: "expired or consumed" }, { status: 410 });
  }

  const nextReadCount = row.readCount + 1;

  // If this is the final read, delete the row. Otherwise, just bump the counter.
  if (nextReadCount >= row.maxReads) {
    await db.delete(secrets).where(eq(secrets.id, id));
  } else {
    await db
      .update(secrets)
      .set({ readCount: nextReadCount })
      .where(eq(secrets.id, id));
  }

  return NextResponse.json({
    ciphertextB64: base64urlEncode(new Uint8Array(row.ciphertext as Buffer)),
    ivB64: base64urlEncode(new Uint8Array(row.iv as Buffer)),
    contentType: row.contentType,
    filename: row.filename,
    mimeType: row.mimeType,
  });
}
