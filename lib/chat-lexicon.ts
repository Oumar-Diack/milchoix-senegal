// Lexique du chat : un concept = un ensemble de formulations (FR/EN/WO).
//
// Les concepts remplacent les listes de mots-clés dispersées dans le moteur.
// La reconnaissance combine phrases exactes (mots entiers) et tolérance de
// faute pour les termes longs (« precosse » → « precoce »).

import { findTerm, hasPhrase, normalize } from "./chat-text";

export type Concept =
  | "greeting"
  | "thanks"
  | "help"
  | "about"
  | "criteria"
  | "howto"
  | "guarantee"
  | "description"
  | "list"
  | "adaptation"
  | "climate"
  | "recommendation"
  | "comparison"
  | "cycle"
  | "precoce"
  | "tardif"
  | "yield"
  | "water"
  | "drought"
  | "seeds"
  | "soil"
  | "usage"
  | "disease"
  | "pest"
  | "technique"
  | "marginal";

/**
 * Termes volontairement sans accents ni apostrophes : ils sont comparés après
 * normalisation (`normalize`).
 */
export const CONCEPT_TERMS: Record<Concept, readonly string[]> = {
  greeting: [
    "bonjour", "bonsoir", "salut", "coucou", "hello", "hey", "salaam",
    "salaam aleekum", "nanga def", "good morning", "good evening",
  ],
  thanks: ["merci", "merci beaucoup", "thanks", "thank you", "jerejef", "jerëjëf"],
  help: [
    "aide", "aider", "help", "assistance", "que peux tu", "que peux tu faire",
    "que sais tu faire", "what can you do", "comment utiliser",
  ],
  about: [
    "c est quoi", "qu est ce que", "qu est ce qu", "what is", "a propos",
    "about", "plateforme", "platform", "milchoix", "presentation",
    "qui es tu", "qui es-tu", "tu es qui", "who are you",
  ],
  criteria: [
    "critere", "criteres", "criteria", "pourquoi", "why", "regle", "regles",
    "comment choisir", "comment choisissez", "choisissez vous", "how choose",
    "comment ca marche", "comment cela marche",
    "fonctionne", "algorithme", "scoring",
  ],
  howto: [
    "comment faire", "comment obtenir", "how do i", "how to", "obtenir une recommandation",
    "get a recommendation", "mode d emploi", "utiliser la plateforme",
  ],
  guarantee: [
    "garantie", "garanti", "garanties", "sure", "risque", "remplace",
    "certitude", "fiabilite", "confiance",
  ],
  description: [
    "description", "decrire", "decrivez", "presente", "presenter",
    "parle moi de", "parlez moi de", "tell me about", "informations sur",
    "fiche", "caracteristiques",
  ],
  list: [
    "liste", "lister", "catalogue", "catalog", "quelles varietes", "quels varietes",
    "quelle variete", "quel variete", "quelles sont les varietes", "varietes",
    "variety", "varieties", "xeet", "ban xeet", "quel xeet", "which varieties",
    "which variety",
  ],
  adaptation: [
    "adapte", "adaptee", "adaptees", "adaptes", "adaptation", "convient",
    "convenable", "pousse", "poussent", "suitable", "bonne pour", "bon pour",
    "good for", "zone", "zones", "se plait",
  ],
  climate: [
    "climat", "climate", "pluie", "pluies", "pluviometrie", "pluvio", "rain",
    "rainfall", "saison", "season", "temperature", "temperatures", "hivernage",
  ],
  recommendation: [
    "recommandation", "recommandations", "recommander", "recommande", "recommend",
    "meilleure", "meilleur", "best", "choisir", "choix", "conseil", "conseiller",
    "que planter", "que semer", "top 3", "trois meilleures",
  ],
  comparison: [
    "comparer", "comparaison", "compare", "versus", "vs", "difference",
    "differences", "ecart", "mieux", "lequel choisir",
  ],
  cycle: [
    "cycle", "duree du cycle", "duree", "combien de jours", "days", "duration",
    "cycle cultural", "maturite",
  ],
  precoce: [
    "precoce", "precoces", "precosse", "tres precoce", "tres precoces",
    "semi precoce", "hatif", "hative", "hatifs", "early", "short cycle",
    "cycle court", "court", "precocite",
  ],
  tardif: [
    "tardif", "tardive", "tardives", "tardifs", "late", "cycle long",
    "long cycle", "long",
  ],
  yield: [
    "rendement", "rendements", "yield", "production", "productivite",
    "kg ha", "tonne", "tonnes", "t ha", "combien produit",
  ],
  water: [
    "besoin en eau", "besoins en eau", "besoin hydrique", "besoins hydriques",
    "water requirement", "water requirements", "consommation en eau", "mm",
  ],
  drought: [
    "secheresse", "drought", "tolerance a la secheresse", "tolerant a la secheresse",
    "tolere la secheresse", "resiste a la secheresse", "resistant a la secheresse",
    "resiste au manque d eau", "manque d eau", "peu d eau", "peu de pluie",
    "faible pluviometrie", "pluviometrie faible", "stress hydrique",
    "dry spell", "gor taw", "góor taw",
  ],
  seeds: [
    "semence", "semences", "seed", "seeds", "disponibilite des semences",
    "approvisionnement", "approvisionnement en semences",
  ],
  soil: [
    "sol", "sols", "sableux", "sable", "argileux", "argile", "limoneux",
    "limon", "dek dior", "dior", "bas fond", "bas fonds", "soil", "sandy", "clay",
  ],
  usage: [
    "usage", "usages", "alimentaire", "alimentation", "consommation", "couscous",
    "thiere", "latchiri", "sankhal", "fourrage", "fan", "double usage",
    "biofortifie", "biofortifiee", "fer", "zinc", "nutrition", "transformation",
  ],
  disease: [
    "maladie", "maladies", "disease", "diseases", "mildiou", "charbon", "ergot",
    "striga", "moisissure", "moisissures",
  ],
  pest: [
    "ravageur", "ravageurs", "insecte", "insectes", "pest", "pests", "chenille",
    "chenilles", "foreur", "foreurs", "cantharide", "cantharides", "iule",
    "iules", "chrysomèle", "chrysomeles", "puceron", "pucerons", "termite",
    "termites", "oiseau", "oiseaux",
  ],
  technique: [
    "itineraire", "itineraire technique", "technique", "comment cultiver",
    "comment semer", "quand semer", "date de semis", "semis", "semer",
    "fertilisation", "engrais", "uree", "npk", "compost", "fumier", "recolte",
    "recolter", "stockage", "stocker", "battage", "battre", "sarclage",
    "sarclo binage", "demariage", "preparation du sol", "preparer le sol",
    "dose de semis",
    "ecartement", "how to grow", "lutter contre", "traitement", "traiter",
    "protection", "phytosanitaire",
  ],
  marginal: ["marginale", "marginales", "marginal", "marginalement"],
};

const INTERPRETATIONS: { concept: Concept; terms: readonly string[] }[] = (
  Object.keys(CONCEPT_TERMS) as Concept[]
).map((concept) => ({ concept, terms: CONCEPT_TERMS[concept] }));

/** Concepts présents dans le texte (exacts d'abord, puis approximatifs). */
export function detectConcepts(text: string): Set<Concept> {
  const normalized = normalize(text);
  const found = new Set<Concept>();

  for (const { concept, terms } of INTERPRETATIONS) {
    if (terms.some((term) => hasPhrase(normalized, term))) found.add(concept);
  }

  // Deuxième passe approximative : uniquement les concepts encore absents et
  // les termes assez longs pour que la distance d'édition reste fiable.
  for (const { concept, terms } of INTERPRETATIONS) {
    if (found.has(concept)) continue;
    const longTerms = terms.filter((term) => normalize(term).length >= 6);
    if (longTerms.length && findTerm(normalized, longTerms)) found.add(concept);
  }

  return found;
}

export function hasConcept(concepts: Set<Concept>, concept: Concept): boolean {
  return concepts.has(concept);
}

export function hasAnyConcept(
  concepts: Set<Concept>,
  candidates: readonly Concept[]
): boolean {
  return candidates.some((concept) => concepts.has(concept));
}
