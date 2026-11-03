// Vérification de l'import des caractéristiques variétales sur une base en
// mémoire : aucun accès à data/milchoix.db, aucune écriture réelle.

import { DatabaseSync } from "node:sqlite";
import { decodeCsvBuffer } from "../lib/csv-parse";
import {
  buildTraitsTemplate,
  importVarietyTraitsCSV,
} from "../lib/variety-traits-import";

let checks = 0;
let failures = 0;

function check(label: string, condition: boolean, detail?: string): void {
  checks += 1;
  if (condition) {
    console.log(`✓ ${label}`);
  } else {
    failures += 1;
    console.error(`✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function createDatabase(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE varieties (
      id INTEGER PRIMARY KEY,
      nom_officiel TEXT NOT NULL,
      noms_locaux TEXT NOT NULL DEFAULT '',
      type_mil TEXT NOT NULL DEFAULT '',
      duree_cycle_jours TEXT,
      precocite TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      exigences_pedologiques TEXT NOT NULL DEFAULT '',
      usages_alimentaires TEXT NOT NULL DEFAULT '',
      rendement_observe_moyen_kg INTEGER,
      date_maj TEXT NOT NULL DEFAULT ''
    );
  `);
  const insert = db.prepare(
    "INSERT INTO varieties (id, nom_officiel, noms_locaux, description, exigences_pedologiques, usages_alimentaires, rendement_observe_moyen_kg) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  insert.run(1, "Souna 3", "Souna 3", "Variété synthétique; zone sud", "", "", 1100);
  insert.run(2, "Gawane", "Gawane", "", "sols sableux", "", null);
  insert.run(3, "CHAKTI", "CHAKTI", "", "", "biofortifié", null);
  return db;
}

function readRow(db: DatabaseSync, id: number) {
  return db
    .prepare(
      "SELECT exigences_pedologiques, usages_alimentaires, rendement_observe_moyen_kg FROM varieties WHERE id = ?"
    )
    .get(id) as unknown as {
    exigences_pedologiques: string;
    usages_alimentaires: string;
    rendement_observe_moyen_kg: number | null;
  };
}

// 1. Mise à jour complète, accents/casse ignorés, t/ha converti.
{
  const db = createDatabase();
  const csv = [
    "nom_officiel;exigences_pedologiques;usages_alimentaires;rendement_observe_moyen_kg",
    'souna 3;sol sableux et dior;"grain; couscous";1,5 t/ha',
  ].join("\n");

  const result = importVarietyTraitsCSV(db, csv, { apply: true });
  check("1 variété mise à jour", result.updated === 1 && result.errors.length === 0);
  check(
    "3 champs détectés",
    result.changes[0]?.fields.length === 3,
    JSON.stringify(result.changes[0]?.fields)
  );

  const row = readRow(db, 1);
  check("sol enregistré", row.exigences_pedologiques === "sol sableux et dior");
  check("usages enregistrés", row.usages_alimentaires === "grain; couscous");
  check("1,5 t/ha → 1500 kg/ha", row.rendement_observe_moyen_kg === 1500);
}

// 2. Réimport identique : aucun changement.
{
  const db = createDatabase();
  const csv = [
    "nom_officiel;exigences_pedologiques;usages_alimentaires;rendement_observe_moyen_kg",
    "Souna 3;argileux;grain;1200",
  ].join("\n");
  importVarietyTraitsCSV(db, csv, { apply: true });
  const second = importVarietyTraitsCSV(db, csv, { apply: true });
  check(
    "réimport identique = inchangé",
    second.updated === 0 && second.unchanged === 1
  );
}

// 3. Cellules vides : rien n'est effacé.
{
  const db = createDatabase();
  const before = readRow(db, 2);
  const csv = [
    "nom_officiel;exigences_pedologiques;usages_alimentaires;rendement_observe_moyen_kg",
    "Gawane;;;",
  ].join("\n");
  const result = importVarietyTraitsCSV(db, csv, { apply: true });
  const after = readRow(db, 2);
  check("ligne vide ignorée", result.ignored === 1 && result.updated === 0);
  check(
    "sol existant conservé",
    after.exigences_pedologiques === before.exigences_pedologiques
  );
}

// 4. Variété inconnue.
{
  const db = createDatabase();
  const csv = [
    "nom_officiel;exigences_pedologiques",
    "Variété inventée;sableux",
  ].join("\n");
  const result = importVarietyTraitsCSV(db, csv);
  check(
    "variété inconnue refusée",
    result.errors.length === 1 && result.errors[0].message.includes("inconnue")
  );
}

// 5. Rendement illisible ou hors plage.
{
  const db = createDatabase();
  const csv = [
    "nom_officiel;rendement_observe_moyen_kg",
    "Souna 3;beaucoup",
    "Gawane;40",
  ].join("\n");
  const result = importVarietyTraitsCSV(db, csv);
  check("rendement illisible refusé", result.errors.length === 2);
  check(
    "message de plage explicite",
    result.errors[1]?.message.includes("hors plage") === true
  );
}

// 6. Séparateur virgule.
{
  const db = createDatabase();
  const csv = [
    "nom_officiel,exigences_pedologiques,usages_alimentaires,rendement_observe_moyen_kg",
    "Gawane,argileux,,900",
  ].join("\n");
  const result = importVarietyTraitsCSV(db, csv, { apply: true });
  const row = readRow(db, 2);
  check("fichier séparé par des virgules", result.updated === 1);
  check("sol et rendement appliqués", row.exigences_pedologiques === "argileux" && row.rendement_observe_moyen_kg === 900);
  check("usages non renseignés conservés", row.usages_alimentaires === "");
}

// 7. Aperçu sans écriture.
{
  const db = createDatabase();
  const csv = [
    "nom_officiel;exigences_pedologiques",
    "CHAKTI;limoneux",
  ].join("\n");
  const preview = importVarietyTraitsCSV(db, csv, { apply: false });
  check("aperçu compte la modification", preview.updated === 1);
  check(
    "aperçu n'écrit pas en base",
    readRow(db, 3).exigences_pedologiques === ""
  );
}

// 8. Usage libre reconnu : pas d'avertissement, valeur conservée telle quelle.
{
  const db = createDatabase();
  const csv = [
    "nom_officiel;usages_alimentaires",
    'Souna 3;"Couscous (Thiéré), Bouillies (Lakh, Fondé, Rouye), Pâtes et Galettes, Thiakry"',
  ].join("\n");
  const result = importVarietyTraitsCSV(db, csv, { apply: true });
  check("usage libre reconnu sans avertissement", result.warnings.length === 0);
  check(
    "valeur libre enregistrée telle quelle",
    readRow(db, 1).usages_alimentaires ===
      "Couscous (Thiéré), Bouillies (Lakh, Fondé, Rouye), Pâtes et Galettes, Thiakry"
  );
}

// 9. Usage hors vocabulaire : avertissement, valeur conservée.
{
  const db = createDatabase();
  const csv = ["nom_officiel;usages_alimentaires", 'Souna 3;"biere, soda"'].join("\n");
  const result = importVarietyTraitsCSV(db, csv, { apply: true });
  check("usage hors vocabulaire averti", result.warnings.length === 1);
  check(
    "valeur tout de même enregistrée",
    readRow(db, 1).usages_alimentaires === "biere, soda"
  );
}

// 10. Alias ambigu : refus plutôt que mauvaise fiche.
{
  const db = createDatabase();
  db.prepare(
    "INSERT INTO varieties (id, nom_officiel, noms_locaux) VALUES (?, ?, ?)"
  ).run(4, "Souna Saloum (SL28)", "SL28");
  db.prepare(
    "INSERT INTO varieties (id, nom_officiel, noms_locaux) VALUES (?, ?, ?)"
  ).run(5, "Autre variété (SL 28)", "SL 28");

  const csv = ["nom_officiel;exigences_pedologiques", "SL28;sableux"].join("\n");
  const result = importVarietyTraitsCSV(db, csv);
  check(
    "alias ambigu refusé",
    result.errors.length === 1 && result.errors[0].message.includes("ambigu")
  );
}

// 11. Ligne atomique : un rendement invalide annule aussi le sol.
{
  const db = createDatabase();
  const csv = [
    "nom_officiel;exigences_pedologiques;rendement_observe_moyen_kg",
    "Souna 3;limoneux;beaucoup",
  ].join("\n");
  const result = importVarietyTraitsCSV(db, csv, { apply: true });
  const row = readRow(db, 1);
  check("ligne invalide non appliquée", result.updated === 0 && result.errors.length === 1);
  check(
    "aucun champ partiel écrit",
    row.exigences_pedologiques === "" && row.rendement_observe_moyen_kg === 1100
  );
}

// 12. Point-virgule non protégé : erreur explicite de colonnes.
{
  const db = createDatabase();
  const csv = [
    "nom_officiel;exigences_pedologiques;usages_alimentaires;rendement_observe_moyen_kg",
    "Souna 3;sableux;grain; couscous;1200",
  ].join("\n");
  const result = importVarietyTraitsCSV(db, csv);
  check(
    "colonne en trop détectée",
    result.errors.length === 1 && result.errors[0].message.includes("Trop de colonnes")
  );
  check("aucune modification", result.updated === 0);
}

// 13. Modèle prérempli.
{
  const db = createDatabase();
  const csv = buildTraitsTemplate(db);
  const lines = csv.trim().split("\n");
  check("modèle : en-tête présent", lines[0].startsWith("nom_officiel;"));
  check("modèle : une ligne par variété", lines.length === 4);
  check(
    "modèle : colonnes cibles présentes",
    lines[0].includes("exigences_pedologiques") &&
      lines[0].includes("usages_alimentaires") &&
      lines[0].includes("rendement_observe_moyen_kg")
  );
  check("modèle : échappement des points-virgules", csv.includes('"'));
}

// 14. Décodage des CSV exportés par un tableur.
{
  const utf8 = decodeCsvBuffer(new Uint8Array(Buffer.from("Thiéré;1 500", "utf8")));
  check("décodage UTF-8", utf8.encoding === "utf-8" && utf8.text === "Thiéré;1 500");

  const macBytes = Uint8Array.from([0x54, 0x68, 0x69, 0x8e, 0x72, 0x8e]);
  const mac = decodeCsvBuffer(macBytes);
  check("décodage Mac Roman", mac.encoding === "macintosh" && mac.text === "Thiéré");

  const cpBytes = Uint8Array.from([0x54, 0x68, 0x69, 0xe9, 0x72, 0xe9]);
  const cp = decodeCsvBuffer(cpBytes);
  check(
    "décodage Windows-1252",
    cp.encoding === "windows-1252" && cp.text === "Thiéré"
  );

  const forced = decodeCsvBuffer(macBytes, "windows-1252");
  check("encodage forcé respecté", forced.encoding === "windows-1252");
}

// 15. Nom de variété dont la ponctuation a été altérée par l'encodage.
{
  const db = createDatabase();
  db.prepare(
    "INSERT INTO varieties (id, nom_officiel, noms_locaux) VALUES (?, ?, ?)"
  ).run(6, "TAAW (ICMH 177090 × SL175)", "TAAW");

  const csv = [
    "nom_officiel;rendement_observe_moyen_kg",
    "TAAW (ICMH 177090 √ó SL175);3200",
  ].join("\n");
  const result = importVarietyTraitsCSV(db, csv, { apply: true });
  check(
    "nom tolérant à la ponctuation",
    result.updated === 1 && result.errors.length === 0
  );
  check("rendement appliqué", readRow(db, 6).rendement_observe_moyen_kg === 3200);
}

console.log(`\n${checks} contrôles — ${failures === 0 ? "tout passe" : `${failures} échec(s)`}`);
process.exitCode = failures === 0 ? 0 : 1;
