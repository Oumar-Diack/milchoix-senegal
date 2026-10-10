import { getDb, createSchema } from "./db";
import { seedAll } from "./seed-run";

const db = getDb();
createSchema(db);
seedAll(db, { reset: true });
console.log("Base de données réinitialisée et re-seedée.");
