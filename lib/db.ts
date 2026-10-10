import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const globalForDb = globalThis as unknown as { __milchoixDb?: DatabaseSync };

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "milchoix.db");

export function getDb(): DatabaseSync {
  if (globalForDb.__milchoixDb) return globalForDb.__milchoixDb;

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  globalForDb.__milchoixDb = db;
  return db;
}

export function createSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS varieties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom_officiel TEXT NOT NULL,
      noms_locaux TEXT NOT NULL DEFAULT '',
      statut TEXT NOT NULL DEFAULT 'homologuee',
      annee_homologation INTEGER,
      obtenteur TEXT NOT NULL DEFAULT '',
      type_mil TEXT NOT NULL DEFAULT '',
      duree_cycle_jours INTEGER,
      precocite TEXT NOT NULL DEFAULT '',
      besoins_pluvio_min_mm INTEGER,
      besoins_pluvio_max_mm INTEGER,
      tolerance_secheresse TEXT NOT NULL DEFAULT '',
      resistances_maladies TEXT NOT NULL DEFAULT '',
      reaction_ravageurs TEXT NOT NULL DEFAULT '',
      rendement_potentiel_min_kg REAL,
      rendement_potentiel_max_kg REAL,
      rendement_observe_moyen_kg REAL,
      caracteristiques_grain TEXT NOT NULL DEFAULT '',
      usages_alimentaires TEXT NOT NULL DEFAULT '',
      exigences_pedologiques TEXT NOT NULL DEFAULT '',
      disponibilite_semences TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT '',
      date_maj TEXT NOT NULL DEFAULT (datetime('now')),
      statut_validation TEXT NOT NULL DEFAULT 'officiel',
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS communes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      departement TEXT NOT NULL,
      region TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      zone_sylvopastorale INTEGER NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT '',
      date_maj TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS variety_zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      variety_id INTEGER NOT NULL REFERENCES varieties(id) ON DELETE CASCADE,
      commune_id INTEGER NOT NULL REFERENCES communes(id) ON DELETE CASCADE,
      zone_type TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT '',
      niveau_confiance TEXT NOT NULL DEFAULT 'moyen',
      date_maj TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (variety_id, commune_id, zone_type)
    );

    CREATE TABLE IF NOT EXISTS variety_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      variety_id INTEGER NOT NULL REFERENCES varieties(id) ON DELETE CASCADE,
      data BLOB NOT NULL,
      mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
      legende TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT '',
      is_cover INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS climat (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      commune_id INTEGER NOT NULL REFERENCES communes(id) ON DELETE CASCADE,
      annee INTEGER NOT NULL,
      cumul_pluvio_mm INTEGER,
      date_debut_saison TEXT,
      date_fin_saison TEXT,
      duree_saison_jours INTEGER,
      nb_sequences_seches INTEGER,
      duree_max_seche_jours INTEGER,
      temperature_moyenne_c REAL,
      prevision_saison TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT '',
      date_maj TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (commune_id, annee)
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      commune_id INTEGER NOT NULL REFERENCES communes(id) ON DELETE CASCADE,
      campagne_annee INTEGER NOT NULL,
      date_semis TEXT,
      type_sol TEXT NOT NULL DEFAULT '',
      duree_cycle_souhaitee TEXT NOT NULL DEFAULT '',
      objectif_production TEXT NOT NULL DEFAULT '',
      preferences_alimentaires TEXT NOT NULL DEFAULT '',
      acces_intrants TEXT NOT NULL DEFAULT '',
      tolerance_secheresse_recherchee INTEGER NOT NULL DEFAULT 0,
      resultats TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recommendation_id INTEGER REFERENCES recommendations(id) ON DELETE SET NULL,
      variety_id INTEGER REFERENCES varieties(id) ON DELETE SET NULL,
      note_pertinence INTEGER,
      note_comprehension INTEGER,
      commentaire TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL DEFAULT '',
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export { DB_PATH };
