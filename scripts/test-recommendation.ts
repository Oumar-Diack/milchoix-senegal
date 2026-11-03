// Vérifie le critère « séquences sèches » du moteur de recommandation et son
// alignement sur les données annuelles dans le chat.

import { answerQuestion } from "../lib/chatbot";
import { scoreVariety } from "../lib/recommendation";
import type { Climat, Preferences, Variety } from "../lib/types";

let checks = 0;
let failures = 0;

function check(label: string, condition: boolean, detail?: string): void {
  checks += 1;
  if (condition) {
    console.log(`✓ ${label}`);
  } else {
    failures += 1;
    console.error(`✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function makeVariety(tolerance: string): Variety {
  return {
    id: 1,
    nom_officiel: "Variété test",
    noms_locaux: "",
    statut: "homologuee",
    annee_homologation: null,
    obtenteur: "",
    type_mil: "",
    duree_cycle_jours: "100",
    precocite: "précoce",
    besoins_pluvio_min_mm: 300,
    besoins_pluvio_max_mm: 600,
    tolerance_secheresse: tolerance,
    resistances_maladies: "",
    reaction_ravageurs: "",
    rendement_potentiel_min_kg: null,
    rendement_potentiel_max_kg: null,
    rendement_observe_moyen_kg: null,
    caracteristiques_grain: "",
    usages_alimentaires: "",
    exigences_pedologiques: "",
    disponibilite_semences: "Semences disponibles",
    description: "",
    source: "",
    date_maj: "",
    statut_validation: "",
    published: 1,
  };
}

function climatWith(
  sequences: number | null,
  dureeMax: number | null = null
): Climat {
  return {
    id: 1,
    commune_id: 1,
    annee: 2024,
    cumul_pluvio_mm: 500,
    date_debut_saison: null,
    date_fin_saison: null,
    duree_saison_jours: 110,
    nb_sequences_seches: sequences,
    duree_max_seche_jours: dureeMax,
    temperature_moyenne_c: 29,
    prevision_saison: "Campagne 2024",
    source: "test",
    date_maj: "",
  };
}

const preferences: Preferences = {
  campagneAnnee: 2024,
  dateSemis: "",
  typeSol: "",
  dureeCycleSouhaitee: "",
  objectifProduction: "",
  preferencesAlimentaires: "",
  accesIntrants: "",
  toleranceSecheresseRecherchee: false,
};

const drySpellReason = (result: ReturnType<typeof scoreVariety>) =>
  result.raisons.find((raison) => raison.critere === "Séquences sèches");

// 1. Valeur annuelle au seuil : pénalité si la variété tolère mal.
{
  const result = scoreVariety(makeVariety("moyenne"), climatWith(4), preferences);
  const reason = drySpellReason(result);
  check(
    "4 séquences + tolérance moyenne → raison négative",
    reason?.type === "negatif",
    JSON.stringify(reason)
  );
  check(
    "le message cite les séquences sèches",
    reason?.message.includes("4 séquence(s) sèche(s)") === true,
    reason?.message
  );
}

// 2. Même risque, variété très tolérante : atout.
{
  const result = scoreVariety(makeVariety("très bonne"), climatWith(4), preferences);
  check("4 séquences + très bonne tolérance → raison positive", drySpellReason(result)?.type === "positif");
}

// 3. La durée maximale suffit à déclencher le risque.
{
  const result = scoreVariety(makeVariety("moyenne"), climatWith(null, 20), preferences);
  const reason = drySpellReason(result);
  check(
    "20 jours de sécheresse → risque détecté",
    reason?.type === "negatif" && reason.message.includes("20 j") === true,
    JSON.stringify(reason)
  );
}

// 4. Pas de risque : petit bonus, aucune raison alarmante.
{
  const withData = scoreVariety(makeVariety("moyenne"), climatWith(1), preferences);
  const withoutData = scoreVariety(makeVariety("moyenne"), climatWith(null), preferences);

  check("données annuelles sans risque → bonus", withData.score - withoutData.score === 5);
  check("aucune raison de risque avec 1 séquence", drySpellReason(withData) === undefined);
  check(
    "données absentes → critère non évalué (neutre)",
    drySpellReason(withoutData)?.type === "neutre",
    JSON.stringify(drySpellReason(withoutData))
  );
}

// 5. Chat : la recommandation s'appuie sur la dernière campagne annuelle.
{
  const answer = answerQuestion("recommander les meilleures variétés pour Kaolack", "fr");
  check(
    "recommandation sourcée",
    answer.reply.includes("Recommandation pour Kaolack")
  );
  check(
    "référence annuelle affichée",
    answer.reply.includes("Séquences sèches :") && /campagne \d{4}/.test(answer.reply),
    answer.reply.split("\n").slice(-3).join(" / ")
  );
}

// 6. Le résumé climatique parle de séquences sèches, plus de « mois secs ».
{
  const answer = answerQuestion("climat à Louga", "fr");
  check(
    "libellé aligné sur la donnée",
    answer.reply.includes("Séquences sèches (moyenne annuelle)") &&
      !answer.reply.includes("Mois secs")
  );
}

console.log(`\n${checks} contrôles — ${failures === 0 ? "tout passe" : `${failures} échec(s)`}`);
process.exitCode = failures === 0 ? 0 : 1;
