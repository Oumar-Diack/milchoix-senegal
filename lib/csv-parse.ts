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

const LOWER_FRENCH = /[àâäçéèêëîïôöùûüÿœæ]/g;
const UPPER_FRENCH = /[ÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸŒÆ]/g;
const SUSPICIOUS = /[ŽŠšžƒ„…†‡ˆ‰‹›•˜™€]/g;

// Les lettres accentuées minuscules sont fréquentes en français ; les
// majuscules accentuées et les symboles rares le sont beaucoup moins.
// Ce score départage les encodages mono-octets (Mac Roman vs Windows-1252)
// quand aucun n'est déclaré.
function frenchScore(text: string): number {
  const lower = text.match(LOWER_FRENCH)?.length ?? 0;
  const upper = text.match(UPPER_FRENCH)?.length ?? 0;
  const suspicious = text.match(SUSPICIOUS)?.length ?? 0;
  return lower * 2 + upper - suspicious;
}

/**
 * Décode un CSV en UTF-8, avec repli sur les encodages mono-octets courants
 * des tableurs (Mac Roman, Windows-1252). Un encodage forcé reste possible
 * pour les fichiers ambigus.
 */
export function decodeCsvBuffer(
  bytes: Uint8Array,
  forcedEncoding?: string
): { text: string; encoding: string } {
  if (forcedEncoding) {
    return { text: new TextDecoder(forcedEncoding).decode(bytes), encoding: forcedEncoding };
  }

  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(bytes), encoding: "utf-8" };
  } catch {
    // Fichier non UTF-8 : on compare les deux replis les plus fréquents.
  }

  const candidates = ["macintosh", "windows-1252"];
  let best = { text: new TextDecoder("utf-8").decode(bytes), encoding: "utf-8", score: -Infinity };

  for (const encoding of candidates) {
    let text: string;
    try {
      text = new TextDecoder(encoding).decode(bytes);
    } catch {
      continue;
    }
    const score = frenchScore(text);
    if (score > best.score) best = { text, encoding, score };
  }

  return { text: best.text, encoding: best.encoding };
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
