import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";

// Single table. The server only ever sees ciphertext + metadata —
// never the encryption key, never the plaintext.
export const secrets = sqliteTable("secrets", {
  id: text("id").primaryKey(),
  ciphertext: blob("ciphertext", { mode: "buffer" }).notNull(),
  iv: blob("iv", { mode: "buffer" }).notNull(), // 12 bytes for AES-GCM
  contentType: text("content_type", { enum: ["text", "file"] }).notNull(),
  filename: text("filename"),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: integer("created_at").notNull(), // unix seconds
  expiresAt: integer("expires_at").notNull(), // unix seconds
  maxReads: integer("max_reads").notNull().default(1),
  readCount: integer("read_count").notNull().default(0),
});

export type Secret = typeof secrets.$inferSelect;
export type NewSecret = typeof secrets.$inferInsert;
