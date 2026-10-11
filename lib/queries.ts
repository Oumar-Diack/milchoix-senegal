import { ensureDatabase } from "./ensure-db";
import { getDb } from "./db";
import type { Variety, Commune, Climat, Preferences } from "./types";
import { scoreVariety, sortResults, type VarietyResult } from "./recommendation";
import { pluvioAnnuelle } from "./isohyetes";

function db() {
  ensureDatabase();
  return getDb();
}

// node:sqlite retourne des objets à prototype nul, inutilisables comme props
// de Client Components. Cette fonction normalise vers de simples objets.
function plain<T>(rows: T[]): T[] {
  return rows.map((r) => ({ ...r }));
}

function plainOne<T>(row: T | undefined): T | null {
  return row == null ? null : ({ ...row } as T);
}

export function getVarieties(filter?: { query?: string; statut?: string; precocite?: string }): Variety[] {
  const d = db();
  const clauses: string[] = ["published = 1"];
  const params: string[] = [];
  if (filter?.query) {
    clauses.push("(nom_officiel LIKE ? OR noms_locaux LIKE ?)");
    params.push(`%${filter.query}%`, `%${filter.query}%`);
  }
  if (filter?.statut) {
    clauses.push("statut = ?");
    params.push(filter.statut);
  }
  if (filter?.precocite) {
    clauses.push("precocite = ?");
    params.push(filter.precocite);
  }
  const rows = d.prepare(`SELECT * FROM varieties WHERE ${clauses.join(" AND ")} ORDER BY nom_officiel`).all(...params);
  return plain(rows as unknown as Variety[]);
}

export function getVariety(id: number): Variety | null {
  const d = db();
  const row = d.prepare("SELECT * FROM varieties WHERE id = ?").get(id);
  return plainOne(row as unknown as Variety);
}

export function getAllVarieties(): Variety[] {
  const d = db();
  return plain(d.prepare("SELECT * FROM varieties ORDER BY nom_officiel").all() as unknown as Variety[]);
}

export interface ZoneRow {
  id: number;
  variety_id: number;
  commune_id: number;
  zone_type: string;
  source: string;
  niveau_confiance: string;
  date_maj: string;
  nom: string;
  departement: string;
  region: string;
  latitude: number;
  longitude: number;
}

export function getVarietyZones(varietyId: number): ZoneRow[] {
  const d = db();
  return plain(
    d
      .prepare(
        `SELECT vz.*, c.nom, c.departement, c.region, c.latitude, c.longitude
       FROM variety_zones vz JOIN communes c ON c.id = vz.commune_id
       WHERE vz.variety_id = ? ORDER BY c.nom`
      )
      .all(varietyId) as unknown as ZoneRow[]
  );
}

export function getAllZones(): { variety_id: number; commune_id: number; zone_type: string }[] {
  const d = db();
  return plain(
    d
      .prepare("SELECT variety_id, commune_id, zone_type FROM variety_zones")
      .all() as unknown as { variety_id: number; commune_id: number; zone_type: string }[]
  );
}

export function getAllClimat(): Climat[] {
  const d = db();
  return plain(d.prepare("SELECT * FROM climat ORDER BY commune_id, annee").all() as unknown as Climat[]);
}

export function getCommunes(): Commune[] {
  const d = db();
  return plain(d.prepare("SELECT * FROM communes ORDER BY nom").all() as unknown as Commune[]);
}

export function getCommune(id: number): Commune | null {
  const d = db();
  return plainOne(d.prepare("SELECT * FROM communes WHERE id = ?").get(id) as unknown as Commune);
}

export function getClimat(communeId: number, annee: number): Climat | null {
  const d = db();
  return plainOne(d.prepare("SELECT * FROM climat WHERE commune_id = ? AND annee = ?").get(communeId, annee) as unknown as Climat);
}

export function getClimatYears(communeId: number): number[] {
  const d = db();
  const rows = d.prepare("SELECT DISTINCT annee FROM climat WHERE commune_id = ? ORDER BY annee DESC").all(communeId) as { annee: number }[];
  return rows.map((r) => r.annee);
}

export interface RecommendationRecord {
  id: number;
  commune_id: number;
  campagne_annee: number;
  date_semis: string | null;
  type_sol: string;
  duree_cycle_souhaitee: string;
  objectif_production: string;
  preferences_alimentaires: string;
  acces_intrants: string;
  tolerance_secheresse_recherchee: number;
  resultats: string;
  created_at: string;
}

export function computeRecommendations(
  communeId: number,
  prefs: Preferences
): { results: VarietyResult[]; climat: Climat | null; pluvioAnnuelle: number | null } {
  const climat = getClimat(communeId, prefs.campagneAnnee);
  const commune = getCommune(communeId);
  const pluvio = commune ? pluvioAnnuelle(commune.latitude, commune.longitude) : null;
  const varieties = getVarieties();
  const results = varieties
    .map((v) => scoreVariety(v, climat, prefs, pluvio))
    .filter((r) => r.variety.statut !== "en_evaluation" || r.classification !== "non_recommandee");
  return { results: sortResults(results), climat, pluvioAnnuelle: pluvio };
}

export function saveRecommendation(
  sessionId: string,
  communeId: number,
  prefs: Preferences,
  resultats: string
): number {
  const d = db();
  const res = d
    .prepare(
      `INSERT INTO recommendations (
        session_id, commune_id, campagne_annee, date_semis, type_sol, duree_cycle_souhaitee,
        objectif_production, preferences_alimentaires, acces_intrants,
        tolerance_secheresse_recherchee, resultats
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      sessionId,
      communeId,
      prefs.campagneAnnee,
      prefs.dateSemis || null,
      prefs.typeSol,
      prefs.dureeCycleSouhaitee,
      prefs.objectifProduction,
      prefs.preferencesAlimentaires,
      prefs.accesIntrants,
      prefs.toleranceSecheresseRecherchee ? 1 : 0,
      resultats
    );
  return Number(res.lastInsertRowid);
}

export function getRecommendation(id: number): RecommendationRecord | null {
  const d = db();
  return plainOne(d.prepare("SELECT * FROM recommendations WHERE id = ?").get(id) as unknown as RecommendationRecord);
}

export function saveFeedback(input: {
  recommendation_id: number | null;
  variety_id: number | null;
  note_pertinence: number | null;
  note_comprehension: number | null;
  commentaire: string;
}): void {
  const d = db();
  d.prepare(
    `INSERT INTO feedback (recommendation_id, variety_id, note_pertinence, note_comprehension, commentaire)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    input.recommendation_id,
    input.variety_id,
    input.note_pertinence,
    input.note_comprehension,
    input.commentaire
  );
}

export function logAudit(
  username: string,
  action: string,
  entityType: string,
  entityId: number | null,
  details: string
): void {
  const d = db();
  d.prepare(
    "INSERT INTO audit_log (username, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)"
  ).run(username, action, entityType, entityId, details);
}

export function getAuditLog(): unknown[] {
  const d = db();
  return d.prepare("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 200").all();
}

export function getUsers(): unknown[] {
  const d = db();
  return d.prepare("SELECT id, username, role, created_at FROM users ORDER BY username").all();
}

export function getFeedbacks(): unknown[] {
  const d = db();
  return d
    .prepare(
      `SELECT f.*, v.nom_officiel, r.campagne_annee, c.nom AS commune
       FROM feedback f
       LEFT JOIN varieties v ON v.id = f.variety_id
       LEFT JOIN recommendations r ON r.id = f.recommendation_id
       LEFT JOIN communes c ON c.id = r.commune_id
       ORDER BY f.created_at DESC LIMIT 200`
    )
    .all();
}

export interface PhotoRow {
  id: number;
  variety_id: number;
  mime_type: string;
  legende: string;
  source: string;
  is_cover: number;
  created_at: string;
}

export function getVarietyPhotos(varietyId: number): PhotoRow[] {
  const d = db();
  return plain(
    d
      .prepare(
        `SELECT id, variety_id, mime_type, legende, source, is_cover, created_at
         FROM variety_photos WHERE variety_id = ?
         ORDER BY is_cover DESC, id DESC`
      )
      .all(varietyId) as unknown as PhotoRow[]
  );
}

export function getVarietyCoverPhoto(varietyId: number): PhotoRow | null {
  const d = db();
  const row = d
    .prepare(
      `SELECT id, variety_id, mime_type, legende, source, is_cover, created_at
       FROM variety_photos WHERE variety_id = ?
       ORDER BY is_cover DESC, id DESC LIMIT 1`
    )
    .get(varietyId);
  return plainOne(row as unknown as PhotoRow);
}

export function getVarietyCovers(): { variety_id: number; photo_id: number }[] {
  const d = db();
  return plain(
    d
      .prepare(
        `SELECT variety_id, id AS photo_id FROM variety_photos
         WHERE is_cover = 1
         ORDER BY id`
      )
      .all() as unknown as { variety_id: number; photo_id: number }[]
  );
}

export interface PhotoData {
  id: number;
  variety_id: number;
  data: Uint8Array;
  mime_type: string;
}

export function getPhoto(photoId: number): PhotoData | null {
  const d = db();
  const row = d
    .prepare("SELECT id, variety_id, data, mime_type FROM variety_photos WHERE id = ?")
    .get(photoId) as unknown as PhotoData | undefined;
  return row ? ({ ...row, data: row.data } as PhotoData) : null;
}

export function addVarietyPhoto(
  varietyId: number,
  data: Uint8Array,
  mimeType: string,
  legende: string,
  source: string
): number {
  const d = db();
  const res = d
    .prepare(
      "INSERT INTO variety_photos (variety_id, data, mime_type, legende, source) VALUES (?, ?, ?, ?, ?)"
    )
    .run(varietyId, data, mimeType, legende, source);
  const photoId = Number(res.lastInsertRowid);
  const count = d
    .prepare("SELECT COUNT(*) AS c FROM variety_photos WHERE variety_id = ?")
    .get(varietyId) as { c: number };
  if (count.c === 1) {
    d.prepare("UPDATE variety_photos SET is_cover = 1 WHERE id = ?").run(photoId);
  }
  return photoId;
}

export function deleteVarietyPhoto(photoId: number): void {
  const d = db();
  d.prepare("DELETE FROM variety_photos WHERE id = ?").run(photoId);
}

export function setCoverPhoto(varietyId: number, photoId: number): void {
  const d = db();
  d.prepare("UPDATE variety_photos SET is_cover = 0 WHERE variety_id = ?").run(varietyId);
  d.prepare("UPDATE variety_photos SET is_cover = 1 WHERE id = ?").run(photoId);
}
