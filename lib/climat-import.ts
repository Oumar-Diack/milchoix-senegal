import type { DatabaseSync } from "node:sqlite";

// ---------- Parsing CSV / TSV ----------

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function detectDelimiter(text: string): string {
  const firstLine = text.split("\n")[0] ?? "";
  const candidates = [";", ",", "\t"];
  let best = ";";
  let bestCount = -1;
  for (const d of candidates) {
    const count = firstLine.split(d).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = d;
    }
  }
  return best;
}

function parseDelimited(text: string): string[][] {
  const delimiter = detectDelimiter(text);
  const normalized = text.replace(/\r\n?/g, "\n");
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i++) {
    const c = normalized[i];
    if (inQuotes) {
      if (c === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === delimiter) {
        row.push(field);
        field = "";
      } else if (c === "\n") {
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

// ---------- Import climat ----------

export interface ImportResult {
  total: number;
  inserted: number;
  updated: number;
  errors: { row: number; message: string }[];
}

const ALIASES: Record<string, string[]> = {
  commune: ["commune", "nom", "localite", "localité", "name", "ville"],
  departement: ["departement", "département", "dept"],
  annee: ["annee", "année", "year", "campagne", "saison"],
  cumul_pluvio_mm: ["cumul_pluvio_mm", "cumul", "pluviometrie", "pluviométrie", "pluie", "precipitations", "rainfall", "hauteur_pluie"],
  date_debut_saison: ["date_debut_saison", "debut_saison", "debut", "date_debut"],
  date_fin_saison: ["date_fin_saison", "fin_saison", "fin", "date_fin"],
  duree_saison_jours: ["duree_saison_jours", "duree_saison", "duree", "longueur_saison"],
  nb_sequences_seches: ["nb_sequences_seches", "sequences_seches", "nb_secheresses", "poches_secheresse"],
  duree_max_seche_jours: ["duree_max_seche_jours", "duree_max_seche", "secheresse_max", "duree_secheresse"],
  temperature_moyenne_c: ["temperature_moyenne_c", "temperature", "temp", "temperature_moyenne"],
  prevision_saison: ["prevision_saison", "prevision", "forecast"],
  source: ["source"],
};

function buildColumnMap(headers: string[]): Map<string, number> {
  const map = new Map<string, number>();
  headers.forEach((h, i) => {
    const norm = normalize(h);
    if (!norm) return;
    for (const [field, aliases] of Object.entries(ALIASES)) {
      if (aliases.some((a) => normalize(a) === norm)) {
        if (!map.has(field)) map.set(field, i);
      }
    }
  });
  return map;
}

function toNumOrNull(value: string | undefined): number | null {
  if (value == null) return null;
  const t = value.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function toDateOrNull(value: string | undefined): string | null {
  if (value == null) return null;
  const t = value.trim();
  return t === "" ? null : t;
}

export function importClimatCSV(db: DatabaseSync, text: string): ImportResult {
  const parsed = parseDelimited(text);
  if (parsed.length === 0) {
    return { total: 0, inserted: 0, updated: 0, errors: [{ row: 1, message: "Fichier vide." }] };
  }

  const headers = parsed[0];
  const cols = buildColumnMap(headers);

  const communeIdx = cols.get("commune");
  const anneeIdx = cols.get("annee");
  if (communeIdx == null || anneeIdx == null) {
    return {
      total: 0,
      inserted: 0,
      updated: 0,
      errors: [
        {
          row: 1,
          message: "Colonnes requises introuvables. Le fichier doit contenir une colonne « commune » et une colonne « annee ».",
        },
      ],
    };
  }

  // Index des communes par nom (et nom + département)
  const communes = db.prepare("SELECT id, nom, departement FROM communes").all() as {
    id: number;
    nom: string;
    departement: string;
  }[];
  const byName = new Map<string, number>();
  const byNameDept = new Map<string, number>();
  for (const c of communes) {
    const n = normalize(c.nom);
    if (!byName.has(n)) byName.set(n, c.id);
    byNameDept.set(`${n}|${normalize(c.departement)}`, c.id);
  }

  const get = (row: string[], key: string): string | undefined => {
    const idx = cols.get(key);
    if (idx == null) return undefined;
    return row[idx] ?? undefined;
  };

  const upsert = db.prepare(`
    INSERT INTO climat (
      commune_id, annee, cumul_pluvio_mm, date_debut_saison, date_fin_saison,
      duree_saison_jours, nb_sequences_seches, duree_max_seche_jours,
      temperature_moyenne_c, prevision_saison, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(commune_id, annee) DO UPDATE SET
      cumul_pluvio_mm = excluded.cumul_pluvio_mm,
      date_debut_saison = excluded.date_debut_saison,
      date_fin_saison = excluded.date_fin_saison,
      duree_saison_jours = excluded.duree_saison_jours,
      nb_sequences_seches = excluded.nb_sequences_seches,
      duree_max_seche_jours = excluded.duree_max_seche_jours,
      temperature_moyenne_c = excluded.temperature_moyenne_c,
      prevision_saison = excluded.prevision_saison,
      source = excluded.source,
      date_maj = datetime('now')
  `);

  const existsStmt = db.prepare("SELECT id FROM climat WHERE commune_id = ? AND annee = ?");

  let inserted = 0;
  let updated = 0;
  const errors: { row: number; message: string }[] = [];

  db.exec("BEGIN");
  try {
    for (let i = 1; i < parsed.length; i++) {
      const rowNum = i + 1;
      const row = parsed[i];

      const communeName = get(row, "commune")?.trim();
      const anneeStr = get(row, "annee")?.trim();

      if (!communeName) {
        errors.push({ row: rowNum, message: "Commune manquante." });
        continue;
      }
      const dept = get(row, "departement")?.trim();
      let communeId = dept ? byNameDept.get(`${normalize(communeName)}|${normalize(dept)}`) : undefined;
      if (communeId == null) communeId = byName.get(normalize(communeName));
      if (communeId == null) {
        errors.push({ row: rowNum, message: `Commune inconnue : « ${communeName} ».` });
        continue;
      }

      const annee = Number(anneeStr);
      if (!anneeStr || !Number.isInteger(annee) || annee < 1900 || annee > 2100) {
        errors.push({ row: rowNum, message: `Année invalide : « ${anneeStr} ».` });
        continue;
      }

      const existed = existsStmt.get(communeId, annee) != null;

      upsert.run(
        communeId,
        annee,
        toNumOrNull(get(row, "cumul_pluvio_mm")),
        toDateOrNull(get(row, "date_debut_saison")),
        toDateOrNull(get(row, "date_fin_saison")),
        toNumOrNull(get(row, "duree_saison_jours")),
        toNumOrNull(get(row, "nb_sequences_seches")),
        toNumOrNull(get(row, "duree_max_seche_jours")),
        toNumOrNull(get(row, "temperature_moyenne_c")),
        (get(row, "prevision_saison") ?? "").trim(),
        (get(row, "source") ?? "").trim()
      );

      if (existed) updated++;
      else inserted++;
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }

  return { total: parsed.length - 1, inserted, updated, errors };
}
