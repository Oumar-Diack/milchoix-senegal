import { getDb, createSchema } from "./db";
import { replaceClimat } from "./seed-run";

const db = getDb();
createSchema(db);
replaceClimat(db);

const count = db.prepare("SELECT COUNT(*) AS c FROM climat").get() as { c: number };
const years = db.prepare("SELECT MIN(annee) AS min, MAX(annee) AS max FROM climat").get() as {
  min: number;
  max: number;
};
console.log(
  `Données climatiques remplacées : ${count.c} lignes (${years.min}–${years.max}).`
);
