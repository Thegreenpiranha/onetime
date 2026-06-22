import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { secrets } from "@/lib/db/schema";

export const runtime = "nodejs";

// Returns metadata without consuming a read. Lets the recipient
// see what they're about to open before committing.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const rows = await db
    .select({
      id: secrets.id,
      contentType: secrets.contentType,
      filename: secrets.filename,
      mimeType: secrets.mimeType,
      sizeBytes: secrets.sizeBytes,
      expiresAt: secrets.expiresAt,
      maxReads: secrets.maxReads,
      readCount: secrets.readCount,
    })
    .from(secrets)
    .where(eq(secrets.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });

  const now = Math.floor(Date.now() / 1000);
  if (row.expiresAt < now || row.readCount >= row.maxReads) {
    return NextResponse.json({ error: "expired or consumed" }, { status: 410 });
  }

  return NextResponse.json({
    contentType: row.contentType,
    filename: row.filename,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    remainingReads: row.maxReads - row.readCount,
    expiresAt: row.expiresAt,
  });
}
