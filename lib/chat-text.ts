// Normalisation et correspondance approximative du chat.
//
// Le moteur doit rester déterministe : aucune dépendance externe, aucun modèle.
// On combine trois niveaux de robustesse :
//   1. normalisation (casse, accents, ponctuation) ;
//   2. correspondance par mots entiers (évite « hi » dans « this ») ;
//   3. distance d'édition bornée pour les fautes de frappe et variantes.

/** Minuscules, sans accents, ponctuation réduite à des espaces. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'`´]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function tokenize(text: string): string[] {
  const normalized = normalize(text);
  return normalized ? normalized.split(" ") : [];
}

/**
 * Vrai si `phrase` apparaît comme suite de mots entiers.
 * `normalizedText` doit déjà être passé par `normalize`.
 */
export function hasPhrase(normalizedText: string, phrase: string): boolean {
  const normalizedPhrase = normalize(phrase);
  if (!normalizedPhrase) return false;
  return ` ${normalizedText} `.includes(` ${normalizedPhrase} `);
}

export function hasAnyPhrase(
  normalizedText: string,
  phrases: readonly string[]
): boolean {
  return phrases.some((phrase) => hasPhrase(normalizedText, phrase));
}

/** Distance d'édition bornée : renvoie `max + 1` dès que la borne est dépassée. */
export function levenshtein(a: string, b: string, max = Infinity): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const previous = new Array<number>(b.length + 1);
  const current = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) previous[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    let rowMin = current[0];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost
      );
      if (current[j] < rowMin) rowMin = current[j];
    }
    if (rowMin > max) return max + 1;
    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j];
  }

  return previous[b.length];
}

/**
 * Tolérance de faute proportionnelle à la longueur du terme.
 * En dessous de 5 caractères, aucune approximation : trop de faux positifs
 * (« mil » vs « fil », « sol » vs « col »).
 */
export function allowedDistance(term: string): number {
  if (term.length < 5) return 0;
  if (term.length <= 8) return 1;
  return 2;
}

/**
 * Cherche `term` dans le texte avec tolérance de faute.
 * On compare des fenêtres de 1 à 3 mots consécutifs pour gérer aussi les
 * identifiants collés ou espacés (« SL28 » / « SL 28 »).
 */
export function fuzzyIncludes(normalizedText: string, term: string): boolean {
  const target = normalize(term).replace(/\s+/g, " ");
  if (target.length < 5) return false;

  const targetCompact = target.replace(/ /g, "");
  const max = allowedDistance(targetCompact);
  if (max === 0) return false;

  const words = normalizedText ? normalizedText.split(" ") : [];
  for (let start = 0; start < words.length; start += 1) {
    let window = "";
    for (let size = 1; size <= 3 && start + size <= words.length; size += 1) {
      window += words[start + size - 1];
      if (window.length > targetCompact.length + max) break;
      if (Math.abs(window.length - targetCompact.length) > max) continue;
      // Une faute de frappe conserve presque toujours l'initiale.
      if (window[0] !== targetCompact[0]) continue;
      const distance = levenshtein(window, targetCompact, max);
      if (distance <= max && distance / targetCompact.length <= 0.25) return true;
    }
  }
  return false;
}

/** Premier terme de la liste reconnu exactement ou approximativement. */
export function findTerm(
  normalizedText: string,
  terms: readonly string[]
): string | null {
  for (const term of terms) {
    if (hasPhrase(normalizedText, term)) return term;
  }
  for (const term of terms) {
    if (fuzzyIncludes(normalizedText, term)) return term;
  }
  return null;
}

const STOPWORDS = new Set([
  // français
  "le", "la", "les", "l", "un", "une", "des", "de", "du", "d", "et", "ou",
  "a", "au", "aux", "en", "dans", "sur", "sous", "pour", "par", "avec",
  "sans", "chez", "vers", "entre", "est", "sont", "ete", "etre", "ai", "as",
  "on", "nous", "vous", "je", "tu", "il", "elle", "ils", "elles", "ce",
  "cet", "cette", "ces", "que", "qui", "quoi", "dont", "y", "ne", "pas",
  "plus", "moins", "tres", "bien", "tout", "tous", "toute", "toutes",
  "quel", "quelle", "quels", "quelles", "comment", "pourquoi", "quand",
  "combien", "si", "aussi", "alors", "donc", "mais", "comme", "lutter",
  "combattre", "contre", "faire", "faut", "control", "controlling", "treat",
  "treating",
  // anglais
  "the", "an", "of", "to", "in", "on", "with", "and", "or", "is", "are",
  "was", "were", "be", "been", "for", "from", "by", "at", "as", "that",
  "this", "these", "those", "it", "its", "i", "you", "we", "they", "he",
  "she", "do", "does", "did", "can", "could", "should", "would", "what",
  "which", "how", "why", "when", "who", "there", "their", "my", "your",
  // wolof (marqueurs fréquents)
  "ma", "la", "na", "ngi", "ci", "ak", "bu", "bi", "yi", "mu", "nu",
  "dina", "dafay", "mooy", "walla", "te", "rekk",
  // domaine : trop générique pour discriminer un document
  "mil", "mils", "dugub", "variete", "varietes", "variety", "varieties",
  "senegal", "plateforme", "platform",
]);

export function isStopword(token: string): boolean {
  return STOPWORDS.has(token);
}

/** Tokens porteurs de sens pour la recherche documentaire. */
export function contentTokens(text: string): string[] {
  return tokenize(text).filter(
    (token) => token.length >= 2 && !isStopword(token) && !/^\d+$/.test(token)
  );
}
