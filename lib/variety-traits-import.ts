// Import des trois champs variétaux manquants, à partir d'un CSV édité dans
// un tableur :
//   - exigences_pedologiques
//   - usages_alimentaires
//   - rendement_observe_moyen_kg
//
// Règles volontairement conservatrices :
//   - une cellule vide ne modifie rien (pas d'effacement accidentel) ;
//   - seules les variétés existantes sont mises à jour ;
//   - les valeurs douteuses sont signalées (erreur bloquante ou avertissement) ;
//   - le mode aperçu (par défaut côté CLI) n'écrit jamais en base.

import type { DatabaseSync } from "node:sqlite";
import { normalizeKey, parseDelimited } from "./csv-parse";

export type TraitField =
  | "exigences_pedologiques"
  | "usages_alimentaires"
  | "rendement_observe_moyen_kg";

export interface TraitsChange {
  row: number;
  varietyId: number;
  variety: string;
  fields: TraitField[];
  before: Partial<Record<TraitField, string | number | null>>;
  after: Partial<Record<TraitField, string | number | null>>;
}

export interface TraitsImportResult {
  total: number;
  /** Lignes qui modifient au moins un champ (ou le feraient en aperçu). */
  updated: number;
  /** Lignes valides mais identiques à la base. */
  unchanged: number;
  /** Lignes sans aucune des trois valeurs renseignées. */
  ignored: number;
  errors: { row: number; message: string }[];
  warnings: { row: number; message: string }[];
  changes: TraitsChange[];
}

export interface TraitsImportOptions {
  /** false (défaut) = simulation, aucune écriture. */
  apply?: boolean;
}

interface VarietyRow {
  id: number;
  nom_officiel: string;
  noms_locaux: string;
  exigences_pedologiques: string;
  usages_alimentaires: string;
  rendement_observe_moyen_kg: number | null;
}

const COLUMN_ALIASES: Record<string, string[]> = {
  variete: [
    "variete",
    "variété",
    "nom_officiel",
    "nom",
    "variety",
    "name",
    "nom de la variete",
  ],
  sol: [
    "exigences_pedologiques",
    "exigences_pedologique",
    "exigences_sol",
    "sol",
    "sols",
    "soil",
  ],
  usages: [
    "usages_alimentaires",
    "usages_alimentaire",
    "usages",
    "usage",
    "food_uses",
  ],
  rendement: [
    "rendement_observe_moyen_kg",
    "rendement_observe",
    "rendement_moyen",
    "rendement",
    "yield",
  ],
};

const SOIL_KEYWORDS = ["sable", "argile", "limon"];

const USAGE_VOCABULARY = new Set([
  "grain",
  "mil",
  "couscous",
  "thiere",
  "latchiri",
  "sankhal",
  "bouillie",
  "semoule",
  "farine",
  "fourrage",
  "fan",
  "paille",
  "double usage",
  "biofortifie",
  "fer",
  "zinc",
  "alimentation",
  "consommation",
  "transformation",
]);

function buildColumnMap(headers: string[]): Map<string, number> {
  const map = new Map<string, number>();
  headers.forEach((header, index) => {
    const key = normalizeKey(header);
    if (!key) return;
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.some((alias) => normalizeKey(alias) === key) && !map.has(field)) {
        map.set(field, index);
      }
    }
  });
  return map;
}

/** Casse et accents ignorés, espaces et parenthèses tolérés. */
function varietyKeys(variety: VarietyRow): string[] {
  const keys = new Set<string>();
  const add = (value: string) => {
    const normalized = normalizeKey(value);
    if (normalized) {
      keys.add(normalized);
      keys.add(normalized.replace(/\s+/g, ""));
    }
  };

  add(variety.nom_officiel);
  add(variety.nom_officiel.replace(/\([^)]*\)/g, " "));

  for (const match of variety.nom_officiel.matchAll(/\(([^)]+)\)/g)) {
    add(match[1]);
    for (const part of match[1].split(/[×x/]/)) add(part);
  }
  for (const alias of variety.noms_locaux.split(/[,;/]/)) add(alias);

  return [...keys];
}

function parseYield(raw: string): { value: number | null; error?: string } {
  const compact = raw.replace(/\u00a0/g, " ").replace(/\s+/g, "");
  if (!compact) return { value: null };

  const match = /^([0-9]+(?:[.,][0-9]+)?)(kg|kgs|t|tonne|tonnes)?(?:\/ha)?$/i.exec(compact);
  if (!match) {
    return { value: null, error: `Rendement illisible : « ${raw} ».` };
  }

  let value = Number(match[1].replace(",", "."));
  if ((match[2] ?? "").toLowerCase().startsWith("t")) value *= 1000;

  if (!Number.isFinite(value) || value < 100 || value > 6000) {
    return {
      value: null,
      error: `Rendement hors plage attendue (100 à 6 000 kg/ha) : « ${raw} ».`,
    };
  }
  return { value: Math.round(value) };
}

function soilWarning(value: string): string | null {
  const normalized = normalizeKey(value);
  if (SOIL_KEYWORDS.some((keyword) => normalized.includes(keyword))) return null;
  return "Sol sans mot-clé sable/argile/limon : la valeur est enregistrée mais le filtre sol du chat ne la reconnaîtra pas.";
}

function usageWarnings(value: string): string[] {
  const tokens = value
    .split(/[;|,]/)
    .map((token) => normalizeKey(token))
    .filter(Boolean);
  if (tokens.length === 0) return [];
  const unknown = tokens.filter((token) => !USAGE_VOCABULARY.has(token));
  if (unknown.length === 0) return [];
  return [
    `Usage(s) hors vocabulaire : ${unknown.join(", ")}. Vocabulaire reconnu : ${[
      ...USAGE_VOCABULARY,
    ].join(", ")}.`,
  ];
}

export function importVarietyTraitsCSV(
  db: DatabaseSync,
  text: string,
  options: TraitsImportOptions = {}
): TraitsImportResult {
  const apply = options.apply === true;
  const parsed = parseDelimited(text);

  const empty: TraitsImportResult = {
    total: 0,
    updated: 0,
    unchanged: 0,
    ignored: 0,
    errors: [],
    warnings: [],
    changes: [],
  };

  if (parsed.length === 0) {
    return { ...empty, errors: [{ row: 1, message: "Fichier vide." }] };
  }

  const columns = buildColumnMap(parsed[0]);
  const varietyIndex = columns.get("variete");
  if (varietyIndex == null) {
    return {
      ...empty,
      errors: [
        {
          row: 1,
          message:
            "Colonne « variete » introuvable. En-têtes attendus : nom_officiel, exigences_pedologiques, usages_alimentaires, rendement_observe_moyen_kg.",
        },
      ],
    };
  }
  if (!columns.has("sol") && !columns.has("usages") && !columns.has("rendement")) {
    return {
      ...empty,
      errors: [
        {
          row: 1,
          message:
            "Aucune colonne à importer. Ajoutez au moins une colonne parmi exigences_pedologiques, usages_alimentaires, rendement_observe_moyen_kg.",
        },
      ],
    };
  }

  const varieties = db
    .prepare(
      `SELECT id, nom_officiel, noms_locaux, exigences_pedologiques,
              usages_alimentaires, rendement_observe_moyen_kg
         FROM varieties`
    )
    .all() as unknown as VarietyRow[];

  const byKey = new Map<string, VarietyRow | null>();
  for (const variety of varieties) {
    for (const key of varietyKeys(variety)) {
      const existing = byKey.get(key);
      // Une clé partagée par deux variétés devient ambiguë : on refuse de
      // deviner plutôt que de modifier la mauvaise fiche.
      if (existing === undefined) {
        byKey.set(key, variety);
      } else if (existing === null || existing.id !== variety.id) {
        byKey.set(key, null);
      }
    }
  }

  const result: TraitsImportResult = { ...empty, total: parsed.length - 1 };

  const valueOf = (row: string[], field: string): string | undefined => {
    const index = columns.get(field);
    if (index == null) return undefined;
    return row[index];
  };

  const expectedColumns = parsed[0].length;

  db.exec("BEGIN");
  try {
    for (let i = 1; i < parsed.length; i++) {
      const rowNumber = i + 1;
      const row = parsed[i];

      // Un point-virgule non protégé décale toutes les colonnes suivantes :
      // mieux vaut refuser la ligne que lire un rendement dans une colonne
      // d'usages.
      if (row.length > expectedColumns) {
        result.errors.push({
          row: rowNumber,
          message: `Trop de colonnes (${row.length} au lieu de ${expectedColumns}) : une valeur contenant « ; » n'est probablement pas entre guillemets.`,
        });
        continue;
      }

      const name = (row[varietyIndex] ?? "").trim();

      const rawSoil = valueOf(row, "sol")?.trim() ?? "";
      const rawUsages = valueOf(row, "usages")?.trim() ?? "";
      const rawYield = valueOf(row, "rendement")?.trim() ?? "";

      if (!name) {
        if (rawSoil || rawUsages || rawYield) {
          result.errors.push({ row: rowNumber, message: "Nom de variété manquant." });
        } else {
          result.ignored += 1;
        }
        continue;
      }

      if (!rawSoil && !rawUsages && !rawYield) {
        result.ignored += 1;
        continue;
      }

      const key = normalizeKey(name);
      const compactKey = key.replace(/\s+/g, "");
      const variety = byKey.has(key) ? byKey.get(key) : byKey.get(compactKey);

      if (variety === undefined) {
        result.errors.push({
          row: rowNumber,
          message: `Variété inconnue : « ${name} ». Utilisez le nom officiel du catalogue.`,
        });
        continue;
      }
      if (variety === null) {
        result.errors.push({
          row: rowNumber,
          message: `Nom ambigu, plusieurs variétés correspondent à « ${name} ».`,
        });
        continue;
      }

      const after: Partial<Record<TraitField, string | number | null>> = {};
      const before: Partial<Record<TraitField, string | number | null>> = {};
      const current: Record<TraitField, string | number | null> = {
        exigences_pedologiques: variety.exigences_pedologiques,
        usages_alimentaires: variety.usages_alimentaires,
        rendement_observe_moyen_kg: variety.rendement_observe_moyen_kg,
      };

      // Un champ invalide annule toute la ligne : on ne veut pas enregistrer
      // un sol correct avec un rendement mal saisi.
      const parsedYield: { value: number | null; error?: string } = rawYield
        ? parseYield(rawYield)
        : { value: null };
      if (parsedYield.error) {
        result.errors.push({ row: rowNumber, message: parsedYield.error });
        continue;
      }

      if (rawSoil) {
        after.exigences_pedologiques = rawSoil;
        const warning = soilWarning(rawSoil);
        if (warning) result.warnings.push({ row: rowNumber, message: warning });
      }
      if (rawUsages) {
        after.usages_alimentaires = rawUsages;
        for (const warning of usageWarnings(rawUsages)) {
          result.warnings.push({ row: rowNumber, message: warning });
        }
      }
      if (parsedYield.value != null) {
        after.rendement_observe_moyen_kg = parsedYield.value;
      }

      if (Object.keys(after).length === 0) {
        result.ignored += 1;
        continue;
      }

      const fields = (Object.keys(after) as TraitField[]).filter((field) => {
        const previous = current[field];
        const next = after[field];
        return String(previous ?? "") !== String(next ?? "");
      });

      if (fields.length === 0) {
        result.unchanged += 1;
        continue;
      }

      for (const field of fields) before[field] = current[field];

      result.updated += 1;
      result.changes.push({
        row: rowNumber,
        varietyId: variety.id,
        variety: variety.nom_officiel,
        fields,
        before,
        after,
      });

      if (apply) {
        const assignments = fields.map((field) => `${field} = ?`).join(", ");
        const values = fields.map((field) => after[field] as string | number);
        db.prepare(
          `UPDATE varieties SET ${assignments}, date_maj = datetime('now') WHERE id = ?`
        ).run(...values, variety.id);

        // La fiche en mémoire reflète la mise à jour pour les lignes suivantes
        // du même fichier (une variété ne devrait apparaître qu'une fois).
        for (const field of fields) {
          current[field] = after[field] ?? null;
        }
      }
    }
    db.exec(apply ? "COMMIT" : "ROLLBACK");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return result;
}

// --- Modèle CSV prérempli -------------------------------------------------

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export interface TraitTemplateRow {
  nom_officiel: string;
  type_mil: string;
  duree_cycle_jours: string | null;
  precocite: string;
  description: string;
  exigences_pedologiques: string;
  usages_alimentaires: string;
  rendement_observe_moyen_kg: number | null;
}

/** CSV prêt à éditer : les 13 variétés, colonnes de contexte + 3 colonnes vides. */
export function buildTraitsTemplate(db: DatabaseSync): string {
  const rows = db
    .prepare(
      `SELECT nom_officiel, type_mil, duree_cycle_jours, precocite, description,
              exigences_pedologiques, usages_alimentaires, rendement_observe_moyen_kg
         FROM varieties
        ORDER BY nom_officiel`
    )
    .all() as unknown as TraitTemplateRow[];

  const header = [
    "nom_officiel",
    "type_mil",
    "duree_cycle_jours",
    "precocite",
    "description",
    "exigences_pedologiques",
    "usages_alimentaires",
    "rendement_observe_moyen_kg",
  ];

  const lines = [header.join(";")];
  for (const row of rows) {
    lines.push(
      [
        row.nom_officiel,
        row.type_mil,
        row.duree_cycle_jours,
        row.precocite,
        row.description,
        row.exigences_pedologiques,
        row.usages_alimentaires,
        row.rendement_observe_moyen_kg,
      ]
        .map(csvCell)
        .join(";")
    );
  }

  return `${lines.join("\n")}\n`;
}
