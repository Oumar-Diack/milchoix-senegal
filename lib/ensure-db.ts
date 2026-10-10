import { getDb, createSchema } from "./db";
import { seedAll } from "./seed-run";

let ensured = false;

export function ensureDatabase(): void {
  if (ensured) return;
  const db = getDb();
  createSchema(db);
  const count = db.prepare("SELECT COUNT(*) AS c FROM varieties").get() as { c: number };
  if (count.c === 0) {
    seedAll(db);
  }
  ensured = true;
}
