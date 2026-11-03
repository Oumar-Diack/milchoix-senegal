// Analyse CSV/TSV minimale, sans dépendance.
//
// Utilisée par l'import climat (existant) et par l'import des caractéristiques
// variétales. Le séparateur est détecté sur la première ligne (point-virgule,
// virgule ou tabulation), les champs entre guillemets peuvent contenir le
// séparateur, des retours à la ligne et des guillemets doublés.

/** Retire le BOM Excel et uniformise les fins de ligne. */
export function normalizeCsvText(text: string): string {
  return text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}

export function detectDelimiter(text: string): string {
  const firstLine = normalizeCsvText(text).split("\n")[0] ?? "";
  const candidates = [";", ",", "\t"];
  let best = ";";
  let bestCount = -1;
  for (const delimiter of candidates) {
    const count = firstLine.split(delimiter).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = delimiter;
    }
  }
  return best;
}

export function parseDelimited(text: string): string[][] {
  const normalized = normalizeCsvText(text);
  const delimiter = detectDelimiter(normalized);
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
    } else if (c === '"') {
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

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

/** Clé de comparaison : minuscules, sans accents, espaces normalisés. */
export function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
