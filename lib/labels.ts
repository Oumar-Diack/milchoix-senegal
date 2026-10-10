export const STATUT_LABELS: Record<string, string> = {
  homologuee: "Homologuée",
  traditionnelle: "Traditionnelle",
  en_evaluation: "En évaluation",
};

export const VALIDATION_LABELS: Record<string, string> = {
  officiel: "Source officielle",
  essai: "Résultat d'essai",
  terrain: "Observation de terrain",
  estimation: "Estimation",
  a_valider: "À valider",
};

export const ZONE_TYPE_LABELS: Record<string, string> = {
  officielle: "Zone officielle",
  historique: "Zone historique",
  potentielle: "Zone potentielle",
};

export const CONFIANCE_LABELS: Record<string, string> = {
  eleve: "Élevé",
  elevee: "Élevée",
  moyen: "Moyen",
  faible: "Faible",
};

export const TYPE_SOLS = [
  "Sols sableux",
  "Sols sablo-argileux",
  "Sols argileux",
  "Sols limoneux",
  "Sols dek-dior",
  "Sols de bas-fonds",
];

export const OBJECTIFS_PRODUCTION = [
  "Grain (alimentation)",
  "Fourrage (fan)",
  "Double usage (grain + fan)",
];

export const ACCES_INTRANTS = [
  { value: "faible", label: "Faible (rusticité recherchée)" },
  { value: "moyen", label: "Moyen" },
  { value: "eleve", label: "Élevé" },
];

export const DUREES_CYCLE = [
  { value: "court", label: "Cycle court" },
  { value: "moyen", label: "Cycle moyen" },
  { value: "long", label: "Cycle long" },
];
