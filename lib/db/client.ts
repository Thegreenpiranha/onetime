import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

// Local SQLite via better-sqlite3. Sync API, native module with ARM64 prebuilds.
const dbPath = (process.env.DATABASE_URL ?? "file:./local.db").replace(/^file:/, "");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
