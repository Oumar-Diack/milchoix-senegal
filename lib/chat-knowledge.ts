// Recherche documentaire locale (BM25) sur le contenu non tabulaire de la
// plateforme : itinéraire technique, protection phytosanitaire et descriptions
// variétales. Aucune dépendance, aucun appel réseau.
//
// Objectif : répondre aux questions agronomiques (« comment lutter contre le
// striga ? », « quand semer ? ») avec un extrait réel et sa source, plutôt que
// de refuser ou d'inventer.

import {
  itineraireTechnique,
  protectionPhytosanitaire,
  ITINERAIRE_SOURCE,
} from "./itinerary";
import { contentTokens, normalize } from "./chat-text";
import type { Variety } from "./types";

export type KnowledgeKind = "technique" | "protection" | "variety";

export interface KnowledgeHit {
  kind: KnowledgeKind;
  title: string;
  lines: string[];
  source: string;
  score: number;
  coverage: number;
}

interface KnowledgeDoc {
  kind: KnowledgeKind;
  title: string;
  lines: string[];
  source: string;
  tokens: string[];
}

const K1 = 1.2;
const B = 0.75;
const MIN_COVERAGE = 0.5;

/** Radicalisation très légère : pluriels et infinitifs suffisent ici. */
function stem(token: string): string {
  let value = token;
  if (value.length > 4 && value.endsWith("s") && !value.endsWith("ss")) {
    value = value.slice(0, -1);
  }
  if (value.length > 6 && /(er|ez|ant|ent)$/.test(value)) {
    value = value.slice(0, -2);
  }
  return value;
}

// Le vocabulaire des questions ne recoupe pas toujours celui des fiches :
// on ajoute quelques équivalents au moment de la requête (pas au corpus).
const QUERY_EXPANSIONS: Record<string, string[]> = {
  semer: ["semis", "semence"],
  semez: ["semis", "semence"],
  semis: ["semis", "semence"],
  planter: ["semis"],
  engrais: ["fertilisation", "fumier", "npk", "uree"],
  fertiliser: ["fertilisation"],
  fumure: ["fertilisation", "fumier"],
  recolter: ["recolte"],
  recolte: ["recolte"],
  stocker: ["stockage"],
  conserver: ["stockage"],
  battre: ["battage"],
  sarcler: ["sarclage"],
  demarier: ["demariage"],
  traiter: ["traitement", "fongicide", "insecticide"],
  traitement: ["traitement", "fongicide", "insecticide"],
  lutter: ["lutte"],
  combattre: ["lutte"],
  maladie: ["mildiou", "charbon", "ergot", "striga"],
  ravageur: ["chenille", "foreur", "cantharide", "iule", "chrysomèle"],
  insecte: ["chenille", "foreur", "cantharide", "iule"],
  preparer: ["preparation", "labour"],
  labour: ["preparation", "labour"],
  dose: ["dose"],
  ecartement: ["ecartement"],
  culture: ["culture"],
  cultiver: ["culture"],
};

function docTokens(title: string, body: string): string[] {
  // Le titre est répété pour lui donner plus de poids (champ « titre »).
  return [...contentTokens(title), ...contentTokens(title), ...contentTokens(body)].map(
    stem
  );
}

function buildDocs(varieties: Variety[]): KnowledgeDoc[] {
  const docs: KnowledgeDoc[] = [];

  for (const section of itineraireTechnique) {
    docs.push({
      kind: "technique",
      title: section.titre,
      lines: section.points,
      source: ITINERAIRE_SOURCE,
      tokens: docTokens(section.titre, section.points.join(" ")),
    });
  }

  for (const row of protectionPhytosanitaire) {
    const lines = [
      `Période : ${row.periode}`,
      `Lutte culturale : ${row.culturales}`,
      `Lutte chimique : ${row.chimiques}`,
      `Variétés résistantes : ${row.genetiques}`,
    ];
    docs.push({
      kind: "protection",
      title: row.ennemi,
      lines,
      source: ITINERAIRE_SOURCE,
      tokens: docTokens(
        `${row.ennemi} ${row.ennemi}`,
        `${row.periode} ${row.culturales} ${row.chimiques} ${row.genetiques}`
      ),
    });
  }

  for (const variety of varieties) {
    if (!variety.description && !variety.caracteristiques_grain) continue;
    const lines: string[] = [];
    if (variety.description) lines.push(variety.description);
    if (variety.type_mil) lines.push(`Type : ${variety.type_mil}`);
    if (variety.caracteristiques_grain) {
      lines.push(`Caractéristiques du grain : ${variety.caracteristiques_grain}`);
    }
    docs.push({
      kind: "variety",
      title: variety.nom_officiel,
      lines,
      source:
        variety.source ||
        "Source : base MilChoix Sénégal — catalogue variétal.",
      tokens: docTokens(
        `${variety.nom_officiel} ${variety.noms_locaux}`,
        `${variety.description} ${variety.caracteristiques_grain} ${variety.usages_alimentaires}`
      ),
    });
  }

  return docs;
}

function expandQuery(tokens: string[]): string[] {
  const expanded: string[] = [];
  for (const token of tokens) {
    expanded.push(stem(token));
    const extra = QUERY_EXPANSIONS[token];
    if (extra) expanded.push(...extra.map(stem));
  }
  return [...new Set(expanded)];
}

/**
 * Retourne les meilleurs extraits pertinents, ou un tableau vide si la
 * question sort du corpus. La couverture (part des termes de la question
 * réellement présents) évite de répondre à côté sur un mot isolé.
 */
export function searchKnowledge(
  query: string,
  varieties: Variety[],
  limit = 1
): KnowledgeHit[] {
  const lexical = contentTokens(query);
  if (lexical.length === 0) return [];

  const docs = buildDocs(varieties);
  if (docs.length === 0) return [];

  const docTokens = docs.map((doc) => doc.tokens);
  const docLengths = docTokens.map((tokens) => tokens.length);
  const averageLength =
    docLengths.reduce((total, length) => total + length, 0) / docs.length;

  const documentFrequency = new Map<string, number>();
  for (const tokens of docTokens) {
    for (const token of new Set(tokens)) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }

  const queryTokens = expandQuery(lexical);
  const total = docs.length;
  const idf = (token: string) => {
    const df = documentFrequency.get(token) ?? 0;
    return Math.log(1 + (total - df + 0.5) / (df + 0.5));
  };

  const results: KnowledgeHit[] = docs.map((doc, index) => {
    const tokens = docTokens[index];
    const frequencies = new Map<string, number>();
    for (const token of tokens) {
      frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
    }

    let score = 0;
    for (const token of queryTokens) {
      const frequency = frequencies.get(token) ?? 0;
      if (frequency === 0) continue;
      const numerator = frequency * (K1 + 1);
      const denominator =
        frequency + K1 * (1 - B + (B * tokens.length) / averageLength);
      score += idf(token) * (numerator / denominator);
    }

    const lexicalStems = lexical.map(stem);
    // Un terme de la question est couvert si lui-même ou l'un de ses
    // équivalents (semer → semis) figure dans le document.
    const matchedIdf = lexical.reduce((sum, token) => {
      const variants = [stem(token), ...(QUERY_EXPANSIONS[token] ?? []).map(stem)];
      const covered = variants.some((variant) => frequencies.has(variant));
      return covered ? sum + idf(stem(token)) : sum;
    }, 0);
    const totalIdf = lexicalStems.reduce((sum, token) => sum + idf(token), 0);
    const coverage = totalIdf > 0 ? matchedIdf / totalIdf : 0;

    return {
      kind: doc.kind,
      title: doc.title,
      lines: doc.lines,
      source: doc.source,
      score,
      coverage,
    };
  });

  const best = results.sort((a, b) => b.score - a.score);

  return best
    .filter((hit) => {
      if (hit.coverage < MIN_COVERAGE) return false;
      // Un seul terme de requête ne suffit que s'il est réellement spécifique
      // (présent dans un ou deux documents), sinon la réponse serait arbitraire.
      if (lexical.length === 1) {
        const token = stem(lexical[0]);
        return (documentFrequency.get(token) ?? 0) <= 2 || hit.kind === "protection";
      }
      return true;
    })
    .slice(0, limit);
}

/** Utilitaire de diagnostic : nombre de documents indexés. */
export function knowledgeSize(varieties: Variety[]): number {
  return buildDocs(varieties).length;
}

export function debugTokens(query: string): string[] {
  return expandQuery(contentTokens(query));
}
