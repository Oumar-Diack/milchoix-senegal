// Évaluation du chat, rejouable hors ligne (`npm run chat:eval`).
//
// Chaque cas vérifie des fragments obligatoires, des fragments interdits, le
// drapeau `matched` (utilisé pour journaliser les échecs) et, pour les
// questions de suivi, le contexte transmis au tour suivant.
//
// L'objectif n'est pas de figer la formulation exacte mais d'empêcher les
// régressions factuelles : chiffres climatiques, variétés attendues, refus
// explicite quand la donnée est absente.

import { answerQuestion, generateReply, type ChatLanguage } from "../lib/chatbot";
import type { ChatContext } from "../lib/chat-context";

interface EvalCase {
  name: string;
  question: string;
  lang: ChatLanguage;
  includes?: string[];
  notIncludes?: string[];
  matched?: boolean;
  /** Nom du cas précédent dont on réutilise le contexte de conversation. */
  after?: string;
  /** Contexte brut injecté (test de revalidation). */
  context?: unknown;
  expectContext?: Partial<ChatContext>;
}

const cases: EvalCase[] = [
  // --- Intentions statiques ------------------------------------------------
  {
    name: "salutation-fr",
    question: "Bonjour",
    lang: "fr",
    includes: ["Bonjour", "MilChoix"],
  },
  {
    name: "remerciement-fr",
    question: "merci beaucoup",
    lang: "fr",
    includes: ["Avec plaisir"],
  },
  {
    name: "aide-fr",
    question: "que peux-tu faire ?",
    lang: "fr",
    includes: ["Je peux", "itinéraire technique"],
  },
  {
    name: "presentation-fr",
    question: "c'est quoi MilChoix ?",
    lang: "fr",
    includes: ["plateforme", "variétal"],
  },
  {
    name: "criteres-fr",
    question: "comment choisissez-vous les variétés ?",
    lang: "fr",
    includes: ["cycle", "tolérance à la sécheresse"],
  },

  // --- Données locales -----------------------------------------------------
  {
    name: "kaolack-liste",
    question: "quelles variétés pour Kaolack ?",
    lang: "fr",
    includes: ["Kaolack", "664", "IBV 8001", "Souna 3"],
    notIncludes: ["Je ne dispose pas"],
    expectContext: { intent: "list" },
  },
  {
    name: "louga-climat",
    question: "climat à Louga",
    lang: "fr",
    includes: ["370", "90 jours", "WorldClim"],
    notIncludes: ["variétés"],
  },
  {
    name: "thies-climat",
    question: "climat à Thiès",
    lang: "fr",
    includes: ["548", "95 jours"],
  },
  {
    name: "faute-de-frappe",
    question: "varietes precosse pour kaolak",
    lang: "fr",
    includes: ["Kaolack", "précoce"],
    notIncludes: ["Je ne dispose pas", "Je ne trouve pas"],
  },
  {
    name: "multi-contraintes-louga",
    question: "quelle variété précoce et adaptée à Louga avec peu de pluie ?",
    lang: "fr",
    includes: [
      "Louga",
      "Critères appliqués",
      "précocité",
      "tolérance à la sécheresse",
    ],
    notIncludes: ["Je ne dispose pas"],
  },
  {
    name: "tolerance-secheresse",
    question: "variétés tolérantes à la sécheresse",
    lang: "fr",
    includes: ["Tolérance à la sécheresse", "Critères appliqués"],
  },
  {
    name: "semences-disponibles",
    question: "variétés avec semences disponibles",
    lang: "fr",
    includes: ["semences disponibles", "Souna 3"],
  },
  {
    name: "cycle-souna3",
    question: "cycle de Souna 3",
    lang: "fr",
    includes: ["85-95 jours", "précoce à semi-précoce"],
    notIncludes: ["Rendement potentiel"],
    expectContext: { field: "cycle", intent: "fact" },
  },
  {
    name: "suivi-rendement",
    question: "et son rendement ?",
    lang: "fr",
    after: "cycle-souna3",
    includes: ["Souna 3", "Rendement potentiel", "non renseigné"],
    expectContext: { field: "rendement" },
  },
  {
    name: "rendement-chakti",
    question: "rendement de CHAKTI",
    lang: "fr",
    includes: ["CHAKTI", "kg/ha"],
  },
  {
    name: "variete-commune",
    question: "Souna 3 est-elle adaptée à Kaolack ?",
    lang: "fr",
    includes: ["Souna 3", "Kaolack", "zone adaptée", "664"],
  },
  {
    name: "comparaison-ou",
    question: "Souna 3 ou Gawane pour Kaolack ?",
    lang: "fr",
    includes: ["Souna 3 vs Gawane", "Zone (Kaolack)"],
    notIncludes: ["Je ne dispose pas"],
  },
  {
    name: "comparaison-verbe",
    question: "comparer Souna 3 et Gawane",
    lang: "fr",
    includes: ["Souna 3 vs Gawane", "Rendement potentiel"],
  },

  // --- Contenu documentaire (BM25) ----------------------------------------
  {
    name: "striga",
    question: "comment lutter contre le striga ?",
    lang: "fr",
    includes: ["Striga", "Arrachage", "ISRA"],
    notIncludes: ["Je ne dispose pas"],
  },
  {
    name: "mildiou",
    question: "comment lutter contre le mildiou ?",
    lang: "fr",
    includes: ["Mildiou", "Sclerospora"],
  },
  {
    name: "semis",
    question: "quand semer le mil ?",
    lang: "fr",
    includes: ["Semis", "90 cm", "semences"],
  },
  {
    name: "fertilisation",
    question: "quel engrais pour le mil ?",
    lang: "fr",
    includes: ["Fertilisation", "NPK", "urée"],
  },
  {
    name: "stockage",
    question: "comment stocker le mil ?",
    lang: "fr",
    includes: ["Stockage", "greniers"],
  },
  {
    name: "preparation-sol",
    question: "comment préparer le sol ?",
    lang: "fr",
    includes: ["Préparation du sol", "houe sine"],
  },
  {
    name: "recolte",
    question: "comment récolter le mil ?",
    lang: "fr",
    includes: ["Récolte"],
  },

  // --- Critères partiellement renseignés ----------------------------------
  {
    name: "biofortifie",
    question: "quelles variétés biofortifiées ?",
    lang: "fr",
    includes: ["CHAKTI", "usages (déduits des descriptions)"],
    notIncludes: ["Gawane"],
  },
  {
    name: "fourrage",
    question: "variétés pour le fourrage",
    lang: "fr",
    includes: ["fourrage", "Souna Saloum"],
  },
  {
    name: "couscous",
    question: "variétés pour le couscous",
    lang: "fr",
    includes: ["usages (déduits des descriptions)"],
  },
  {
    name: "sol-sableux",
    question: "quelle variété pour un sol sableux ?",
    lang: "fr",
    includes: ["exigences de sol ne sont pas renseignées"],
  },
  {
    name: "varietes-tardives",
    question: "quelles variétés sont tardives ?",
    lang: "fr",
    includes: ["Aucune variété"],
  },

  // --- Refus explicites ----------------------------------------------------
  {
    name: "localite-inconnue",
    question: "quelles variétés pour Tombouctou ?",
    lang: "fr",
    includes: ["Je ne trouve pas cette localité", "Communes couvertes"],
  },
  {
    name: "sahel-inconnu",
    question: "quelles variétés pour le Sahel ?",
    lang: "fr",
    includes: ["Je ne trouve pas cette localité"],
  },
  {
    name: "hors-sujet",
    question: "quelle est la capitale du Sénégal ?",
    lang: "fr",
    includes: ["Je ne dispose pas"],
    matched: false,
  },
  {
    name: "contexte-invalide",
    question: "et son rendement ?",
    lang: "fr",
    context: { varietyId: -5, intent: "pirate", field: 42 },
    includes: ["Je ne dispose pas"],
    matched: false,
  },

  // --- Salutation + question de données -----------------------------------
  {
    name: "salutation-et-liste",
    question: "bonjour, quelles variétés pour Kaolack ?",
    lang: "fr",
    includes: ["Variétés correspondant", "664"],
    notIncludes: ["Je suis l'assistant"],
  },
  {
    name: "suivi-commune",
    question: "et pour Thiès ?",
    lang: "fr",
    after: "kaolack-liste",
    includes: ["Thiès", "548"],
    expectContext: { intent: "list" },
  },
  {
    name: "alias-identifiant",
    question: "cycle de la variété SL 28",
    lang: "fr",
    includes: ["Souna Saloum", "95-100 jours"],
  },

  // --- Anglais -------------------------------------------------------------
  {
    name: "en-liste",
    question: "which varieties for Kaolack?",
    lang: "en",
    includes: ["Climate of Kaolack", "664", "adapted zone"],
  },
  {
    name: "en-cycle",
    question: "what is the cycle of Souna 3?",
    lang: "en",
    includes: ["85-95 days", "early to semi-early"],
  },
  {
    name: "en-striga",
    question: "how do I control striga?",
    lang: "en",
    includes: ["Striga", "crop protection"],
  },
  {
    name: "en-precoce",
    question: "early varieties for Louga",
    lang: "en",
    includes: ["Louga", "Criteria applied", "earliness"],
  },
  {
    name: "en-aide",
    question: "what can you do?",
    lang: "en",
    includes: ["I can"],
  },

  // --- Wolof (libellés de données en français) ----------------------------
  {
    name: "wo-liste",
    question: "ban xeet yi bëgg ci Kaolack ?",
    lang: "wo",
    includes: ["Kaolack", "664"],
  },
  {
    name: "wo-fiche",
    question: "naka la Souna 3 di dox ?",
    lang: "wo",
    includes: ["Souna 3", "Cycle"],
  },
  {
    name: "wo-remerciement",
    question: "jërëjëf",
    lang: "wo",
    includes: ["Jërëjëf"],
  },
  {
    name: "wo-salutation",
    question: "salaam aleekum",
    lang: "wo",
    includes: ["Salaam aleekum"],
  },
];

function check(answer: ReturnType<typeof answerQuestion>, test: EvalCase): string[] {
  const errors: string[] = [];
  if (test.matched !== undefined && answer.matched !== test.matched) {
    errors.push(`matched=${answer.matched}, attendu ${test.matched}`);
  }
  for (const fragment of test.includes ?? []) {
    if (!answer.reply.includes(fragment)) errors.push(`fragment absent : « ${fragment} »`);
  }
  for (const fragment of test.notIncludes ?? []) {
    if (answer.reply.includes(fragment)) errors.push(`fragment interdit présent : « ${fragment} »`);
  }
  for (const [key, value] of Object.entries(test.expectContext ?? {})) {
    if (answer.context[key as keyof ChatContext] !== value) {
      errors.push(
        `contexte.${key}=${String(answer.context[key as keyof ChatContext])}, attendu ${String(value)}`
      );
    }
  }
  return errors;
}

let failures = 0;
const contexts = new Map<string, ChatContext>();

for (const test of cases) {
  let context: unknown = test.context;
  if (test.after) {
    if (!contexts.has(test.after)) {
      console.error(`✗ ${test.name} : cas de référence inconnu « ${test.after} »`);
      failures += 1;
      continue;
    }
    context = contexts.get(test.after);
  }

  const answer = answerQuestion(test.question, test.lang, context);
  contexts.set(test.name, answer.context);
  const errors = check(answer, test);

  if (errors.length === 0) {
    console.log(`✓ ${test.name}`);
  } else {
    failures += 1;
    console.error(`✗ ${test.name} — « ${test.question} »`);
    for (const error of errors) console.error(`    ${error}`);
    console.error(
      `    réponse : ${answer.reply.split("\n").slice(0, 4).join(" / ")}`
    );
  }
}

// Compatibilité de l'ancien point d'entrée.
if (typeof generateReply("cycle de Souna 3", "fr") !== "string") {
  failures += 1;
  console.error("✗ generateReply ne renvoie pas une chaîne");
}

console.log(
  `\n${cases.length + 1} contrôles — ${failures === 0 ? "tout passe" : `${failures} échec(s)`}`
);
process.exitCode = failures === 0 ? 0 : 1;
