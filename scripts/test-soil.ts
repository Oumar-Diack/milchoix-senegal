// Vérification de la liste des types de sol et de leur correspondance avec
// les exigences pédologiques (moteur de recommandation et chat).

import { TYPE_SOLS } from "../lib/labels";
import { scoreVariety } from "../lib/recommendation";
import { soilsCompatible, soilTextures } from "../lib/soil";
import type { Preferences, Variety } from "../lib/types";

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

const EXPECTED_SOILS = [
  "Sols sableux (Dior)",
  "Sols argileux (Deck)",
  "Sols argileux lourds (Ban)",
  "Sols limoneux (Balègne)",
  "Sols sablo-limoneux (Dior-Balègne)",
  "Sols limono-sableux (Balègne-Dior)",
  "Sols argilo-sableux (Deck-Dior)",
  "Sols argilo-limoneux (Ban-Balègne)",
  "Sols sablo-argileux (Dior-Deck)",
  "Sols limono-argileux (Balègne-Ban)",
];

check(
  "liste officielle des 10 types de sol",
  TYPE_SOLS.length === EXPECTED_SOILS.length &&
    EXPECTED_SOILS.every((soil, index) => TYPE_SOLS[index] === soil),
  JSON.stringify(TYPE_SOLS)
);

const textureCases: { soil: string; textures: string[] }[] = [
  { soil: "Sols sableux (Dior)", textures: ["sable"] },
  { soil: "Sols argileux (Deck)", textures: ["argile"] },
  { soil: "Sols argileux lourds (Ban)", textures: ["argile"] },
  { soil: "Sols limoneux (Balègne)", textures: ["limon"] },
  { soil: "Sols sablo-limoneux (Dior-Balègne)", textures: ["sable", "limon"] },
  { soil: "Sols limono-sableux (Balègne-Dior)", textures: ["limon", "sable"] },
  { soil: "Sols argilo-sableux (Deck-Dior)", textures: ["argile", "sable"] },
  { soil: "Sols argilo-limoneux (Ban-Balègne)", textures: ["argile", "limon"] },
  { soil: "Sols sablo-argileux (Dior-Deck)", textures: ["sable", "argile"] },
  { soil: "Sols limono-argileux (Balègne-Ban)", textures: ["limon", "argile"] },
];

for (const { soil, textures } of textureCases) {
  const found = [...soilTextures(soil)].sort();
  check(
    `${soil} → ${textures.join(" + ")}`,
    found.length === textures.length && found.every((texture) => textures.includes(texture)),
    found.join(" + ")
  );
}

const compatibilityCases: [string, string, boolean][] = [
  ["Sols sableux (Dior)", "sols sablo-limoneux", true],
  ["Sols sableux (Dior)", "sols argileux", false],
  ["Sols argileux (Deck)", "argileux", true],
  ["Sols limoneux (Balègne)", "sols sableux", false],
  ["Sols argileux lourds (Ban)", "sols argilo-limoneux", true],
  ["Sols sablo-argileux (Dior-Deck)", "sols argileux lourds", true],
  ["Sols limono-argileux (Balègne-Ban)", "sols limoneux", true],
  ["Sols limono-argileux (Balègne-Ban)", "sols sableux", false],
  ["Sols dek-dior", "sols sableux", true],
  ["SOLS ARGILEUX", "sols argileux lourds", true],
  ["Sols sableux (Dior)", "", false],
  ["", "sols sableux", false],
];

for (const [selected, requirements, expected] of compatibilityCases) {
  check(
    `compatibilité « ${selected} » / « ${requirements} » = ${expected}`,
    soilsCompatible(selected, requirements) === expected
  );
}

function makeVariety(exigences: string): Variety {
  return {
    id: 1,
    nom_officiel: "Variété test",
    noms_locaux: "",
    statut: "homologuee",
    annee_homologation: null,
    obtenteur: "",
    type_mil: "",
    duree_cycle_jours: "80",
    precocite: "précoce",
    besoins_pluvio_min_mm: null,
    besoins_pluvio_max_mm: null,
    tolerance_secheresse: "bonne",
    resistances_maladies: "",
    reaction_ravageurs: "",
    rendement_potentiel_min_kg: null,
    rendement_potentiel_max_kg: null,
    rendement_observe_moyen_kg: null,
    caracteristiques_grain: "",
    usages_alimentaires: "",
    exigences_pedologiques: exigences,
    disponibilite_semences: "",
    description: "",
    source: "",
    date_maj: "",
    statut_validation: "",
    published: 1,
  };
}

const preferences: Preferences = {
  campagneAnnee: 2026,
  dateSemis: "",
  typeSol: "Sols sablo-limoneux (Dior-Balègne)",
  dureeCycleSouhaitee: "",
  objectifProduction: "",
  preferencesAlimentaires: "",
  accesIntrants: "",
  toleranceSecheresseRecherchee: false,
};

const compatible = scoreVariety(makeVariety("sols sableux"), null, preferences);
check(
  "moteur : +5 si textures compatibles",
  compatible.raisons.some((raison) => raison.critere === "Type de sol")
);

const incompatible = scoreVariety(makeVariety("sols argileux"), null, preferences);
check(
  "moteur : aucun bonus si textures incompatibles",
  incompatible.raisons.every((raison) => raison.critere !== "Type de sol")
);

const noData = scoreVariety(makeVariety(""), null, preferences);
check(
  "moteur : aucun bonus sans donnée pédologique",
  noData.raisons.every((raison) => raison.critere !== "Type de sol")
);

console.log(`\n${checks} contrôles — ${failures === 0 ? "tout passe" : `${failures} échec(s)`}`);
process.exitCode = failures === 0 ? 0 : 1;
