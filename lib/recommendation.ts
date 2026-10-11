import type { Variety, Climat, Preferences } from "./types";

export type Classification =
  | "fortement_recommandee"
  | "adaptee"
  | "envisageable"
  | "non_recommandee";

export interface Reason {
  critere: string;
  message: string;
  type: "positif" | "neutre" | "negatif";
}

export interface VarietyResult {
  variety: Variety;
  score: number;
  classification: Classification;
  raisons: Reason[];
  confiance: "elevee" | "moyenne" | "faible";
  confiance_raison: string;
}

export const CLASSIFICATION_LABELS: Record<Classification, string> = {
  fortement_recommandee: "Fortement recommandée",
  adaptee: "Adaptée",
  envisageable: "Envisageable sous conditions",
  non_recommandee: "Non recommandée avec les informations disponibles",
};

const SEUILS = {
  fortement_recommandee: 75,
  adaptee: 60,
  envisageable: 45,
};

function parseDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

function semisEstTardif(dateSemis: string | null): boolean {
  const d = parseDate(dateSemis);
  if (!d) return false;
  return d.getMonth() > 6 || (d.getMonth() === 6 && d.getDate() >= 10); // après le 10 juillet
}

function toleranceLevel(variety: Variety): number {
  const t = `${variety.tolerance_secheresse} ${variety.description}`.toLowerCase();
  if (t.includes("stay-green")) return 3;
  if (
    t.includes("sécheresse terminale") ||
    t.includes("secheresse terminale") ||
    t.includes("très tolérante") ||
    t.includes("tres tolérante") ||
    t.includes("très bonne") ||
    t.includes("tres bonne")
  )
    return 3;
  if (t.includes("tolérante") || t.includes("tolerante") || t.includes("bonne")) return 2;
  if (t.includes("moyenne")) return 1;
  return 0;
}

// Parse une chaîne "Maladie : niveau ; Maladie : niveau" du catalogue en dictionnaire.
function parseResistances(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!text) return out;
  for (const part of text.split(";")) {
    const idx = part.indexOf(":");
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim().toLowerCase();
    const val = part.slice(idx + 1).trim().toLowerCase();
    if (key && val) out[key] = val;
  }
  return out;
}

// Convertit un niveau (résistance/sensibilité) du catalogue en score signé.
function resistanceScore(niveau: string): number {
  const v = (niveau ?? "").toLowerCase();
  if (v.includes("absente") || v.includes("résistante") || v.includes("resistante")) return 3;
  if (v.includes("sensible") || v.includes("sensibilité") || v.includes("sensibilite")) return -3;
  if (v.includes("présente") || v.includes("presente")) return -2;
  if (
    v.includes("tolérante") ||
    v.includes("tolerante") ||
    v.includes("très faible") ||
    v.includes("tres faible") ||
    v.includes("moins de")
  )
    return 2;
  if (v.includes("faible")) return 1;
  if (v.includes("moyen")) return 0;
  return 0;
}

export interface BesoinsPluvio {
  min: number;
  max: number;
  estime: boolean;
}

// Besoins pluviométriques : valeur du catalogue si renseignée, sinon
// estimation agronomique à partir de la précocité (le mil à chandelle exige
// ~300 mm en zone très précoce jusqu'à ~800 mm en zone tardive).
export function besoinsPluvio(variety: Variety): BesoinsPluvio | null {
  if (variety.besoins_pluvio_min_mm != null && variety.besoins_pluvio_max_mm != null) {
    return {
      min: variety.besoins_pluvio_min_mm,
      max: variety.besoins_pluvio_max_mm,
      estime: false,
    };
  }
  const p = (variety.precocite ?? "").toLowerCase();
  if (p.includes("très précoce") || p.includes("tres precoce")) {
    return { min: 300, max: 550, estime: true };
  }
  if (p.includes("semi")) {
    return { min: 400, max: 700, estime: true };
  }
  if (p.includes("précoce") || p.includes("precoce")) {
    return { min: 350, max: 600, estime: true };
  }
  if (p.includes("tardif")) {
    return { min: 500, max: 800, estime: true };
  }
  return null;
}

export function scoreVariety(
  variety: Variety,
  climat: Climat | null,
  prefs: Preferences,
  pluvioAnnuelle: number | null = null
): VarietyResult {
  const raisons: Reason[] = [];
  let score = 55;
  let exclusion: Reason | null = null;

  const cycle = variety.duree_cycle_jours;
  const dureeSaison = climat?.duree_saison_jours ?? null;
  const cumul = climat?.cumul_pluvio_mm ?? null;
  const nbSec = climat?.nb_sequences_seches ?? null;
  const dureeMaxSec = climat?.duree_max_seche_jours ?? null;
  const pluvio = cumul ?? pluvioAnnuelle;
  const pluvioSource =
    cumul != null ? "cumul prévu" : "pluviométrie annuelle moyenne (isohyètes)";
  const resistances = parseResistances(variety.resistances_maladies);
  const tol = toleranceLevel(variety);

  // 1. Durée de cycle vs saison
  if (cycle != null && dureeSaison != null) {
    if (cycle > dureeSaison) {
      exclusion = {
        critere: "Durée du cycle",
        message: `Le cycle (${cycle} j) dépasse la durée probable de la saison (${dureeSaison} j).`,
        type: "negatif",
      };
    } else if (cycle <= dureeSaison - 15) {
      score += 25;
      raisons.push({
        critere: "Durée du cycle",
        message: `Cycle de ${cycle} jours compatible avec une saison de ${dureeSaison} jours (marge de sécurité suffisante).`,
        type: "positif",
      });
    } else if (cycle <= dureeSaison - 5) {
      score += 12;
      raisons.push({
        critere: "Durée du cycle",
        message: `Cycle de ${cycle} jours compatible avec la saison (${dureeSaison} j), marge réduite.`,
        type: "neutre",
      });
    } else {
      score -= 10;
      raisons.push({
        critere: "Durée du cycle",
        message: `Cycle de ${cycle} jours très proche de la durée de la saison (${dureeSaison} j) : risque si la saison se raccourcit.`,
        type: "negatif",
      });
    }
  } else if (cycle == null) {
    raisons.push({
      critere: "Durée du cycle",
      message: "Durée de cycle non renseignée pour cette variété.",
      type: "neutre",
    });
  } else {
    raisons.push({
      critere: "Données climatiques",
      message: "Durée de saison non disponible pour cette localité/campagne : la compatibilité du cycle ne peut pas être vérifiée.",
      type: "neutre",
    });
  }

  // 2. Besoins pluviométriques
  const besoins = besoinsPluvio(variety);
  if (exclusion == null && besoins != null && pluvio != null) {
    const { min, max, estime } = besoins;
    const note = estime ? " (estimés d'après la précocité)" : "";
    if (pluvio >= min && pluvio <= max + 100) {
      score += 20;
      raisons.push({
        critere: "Pluviométrie",
        message: `Besoins en eau${note} (${min}–${max} mm) couverts par le ${pluvioSource} (${pluvio} mm).`,
        type: "positif",
      });
    } else if (pluvio < min) {
      score -= 20;
      raisons.push({
        critere: "Pluviométrie",
        message: `${pluvioSource} (${pluvio} mm) inférieur aux besoins minimaux${note} (${min} mm).`,
        type: "negatif",
      });
    } else {
      const mildiou = resistanceScore(resistances.mildiou ?? "");
      if (mildiou >= 2) {
        score -= 2;
        raisons.push({
          critere: "Pluviométrie",
          message: `${pluvioSource} (${pluvio} mm) supérieur aux besoins${note} (${max} mm) : excès d'eau, atténué par la résistance au mildiou de la variété.`,
          type: "negatif",
        });
      } else if (mildiou <= -2) {
        score -= 14;
        raisons.push({
          critere: "Pluviométrie",
          message: `${pluvioSource} (${pluvio} mm) supérieur aux besoins${note} (${max} mm) : excès d'eau (mildiou), aggravé par la sensibilité de la variété.`,
          type: "negatif",
        });
      } else {
        score -= 8;
        raisons.push({
          critere: "Pluviométrie",
          message: `${pluvioSource} (${pluvio} mm) supérieur aux besoins${note} (${max} mm) : risque d'excès d'eau (mildiou).`,
          type: "negatif",
        });
      }
    }
  } else if (exclusion == null && besoins == null) {
    raisons.push({
      critere: "Pluviométrie",
      message: "Besoins en eau non renseignés.",
      type: "neutre",
    });
  } else if (exclusion == null) {
    raisons.push({
      critere: "Pluviométrie",
      message: "Données pluviométriques non disponibles pour la campagne.",
      type: "neutre",
    });
  }

  // 3. Risque de séquences sèches
  const risqueSec =
    nbSec != null && dureeMaxSec != null && (nbSec >= 4 || dureeMaxSec >= 15);
  if (exclusion == null && risqueSec) {
    if (tol >= 2) {
      score += 15;
      raisons.push({
        critere: "Séquences sèches",
        message: `Risque élevé de séquences sèches (${nbSec} épisodes, jusqu'à ${dureeMaxSec} j) : la tolérance à la sécheresse de la variété est un atout.`,
        type: "positif",
      });
    } else {
      score -= 15;
      raisons.push({
        critere: "Séquences sèches",
        message: `Risque élevé de séquences sèches (${nbSec} épisodes, jusqu'à ${dureeMaxSec} j) et tolérance limitée de la variété.`,
        type: "negatif",
      });
    }
  } else if (exclusion == null && risqueSec === false) {
    score += 5;
  }

  // 4. Date de semis tardive
  if (exclusion == null && semisEstTardif(prefs.dateSemis || null)) {
    if (variety.precocite === "tardif") {
      score -= 12;
      raisons.push({
        critere: "Date de semis",
        message: "Semis tardif : un cycle tardif est déconseillé.",
        type: "negatif",
      });
    } else if (variety.precocite === "précoce" || variety.precocite === "très précoce") {
      score += 8;
      raisons.push({
        critere: "Date de semis",
        message: "Semis tardif : la précocité de la variété permet de boucler le cycle.",
        type: "positif",
      });
    }
  }

  // 5. Préférence de cycle souhaité
  if (exclusion == null && prefs.dureeCycleSouhaitee) {
    const souhait = prefs.dureeCycleSouhaitee;
    if (souhait === "court" && (variety.precocite === "précoce" || variety.precocite === "très précoce")) {
      score += 5;
      raisons.push({ critere: "Préférence de cycle", message: "Correspond au souhait d'un cycle court.", type: "positif" });
    } else if (souhait === "long" && (variety.precocite === "tardif" || variety.precocite === "semi-précoce")) {
      score += 5;
      raisons.push({ critere: "Préférence de cycle", message: "Correspond au souhait d'un cycle long.", type: "positif" });
    } else if (souhait === "court" && variety.precocite === "tardif") {
      score -= 5;
      raisons.push({ critere: "Préférence de cycle", message: "Cycle tardif alors qu'un cycle court est souhaité.", type: "negatif" });
    }
  }

  // 6. Accès aux intrants
  if (exclusion == null && prefs.accesIntrants === "faible") {
    if (tol >= 2) {
      score += 5;
      raisons.push({ critere: "Accès aux intrants", message: "Variété rustique adaptée à un accès limité aux intrants.", type: "positif" });
    } else {
      score -= 5;
      raisons.push({ critere: "Accès aux intrants", message: "Variété exigeante, moins adaptée à un accès limité aux intrants.", type: "negatif" });
    }
  }

  // 7. Disponibilité des semences
  const dispo = variety.disponibilite_semences.toLowerCase();
  if (dispo.includes("largement") || dispo.includes("disponible")) {
    score += 5;
  } else if (dispo.includes("limitée") || dispo.includes("limit")) {
    score -= 5;
    raisons.push({
      critere: "Disponibilité des semences",
      message: `Disponibilité des semences incertaine (« ${variety.disponibilite_semences} »).`,
      type: "negatif",
    });
  }

  // 8. Type de sol
  if (exclusion == null && prefs.typeSol && variety.exigences_pedologiques) {
    const sol = prefs.typeSol.toLowerCase();
    const exig = variety.exigences_pedologiques.toLowerCase();
    const match =
      (sol.includes("sable") && exig.includes("sable")) ||
      (sol.includes("argile") && exig.includes("argile")) ||
      (sol.includes("limon") && exig.includes("limon"));
    if (match) {
      score += 5;
      raisons.push({ critere: "Type de sol", message: "Exigences pédologiques compatibles avec le type de sol indiqué.", type: "positif" });
    }
  }

  // 9. Objectif de production (usage alimentaire / fourrage)
  if (exclusion == null && prefs.objectifProduction === "fourrage" && variety.usages_alimentaires.toLowerCase().includes("fan")) {
    score += 5;
    raisons.push({ critere: "Objectif de production", message: "Valorisation du fan (fourrage) mentionnée pour cette variété.", type: "positif" });
  }

  // 10. Résistance au mildiou (maladie majeure du mil, favorisée par l'humidité)
  if (exclusion == null && resistances.mildiou != null) {
    const niveau = resistanceScore(resistances.mildiou);
    if (niveau >= 2) {
      score += 4;
      raisons.push({
        critere: "Résistance au mildiou",
        message: `Bonne résistance/tolérance au mildiou signalée (« ${resistances.mildiou} »).`,
        type: "positif",
      });
    } else if (niveau <= -2) {
      score -= 4;
      raisons.push({
        critere: "Résistance au mildiou",
        message: `Sensibilité au mildiou signalée (« ${resistances.mildiou} »).`,
        type: "negatif",
      });
    }
  }

  // 11. Résistance aux ravageurs (foreur de tige, chenille de l'épi)
  if (exclusion == null && variety.reaction_ravageurs) {
    const ravageurs = parseResistances(variety.reaction_ravageurs);
    const scores = Object.values(ravageurs).map(resistanceScore);
    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg >= 2) {
        score += 3;
        raisons.push({
          critere: "Résistance aux ravageurs",
          message: "Bonne tolérance aux principaux ravageurs (foreur de tige, chenille de l'épi).",
          type: "positif",
        });
      } else if (avg <= -2) {
        score -= 3;
        raisons.push({
          critere: "Résistance aux ravageurs",
          message: "Sensibilité aux principaux ravageurs (foreur de tige, chenille de l'épi).",
          type: "negatif",
        });
      }
    }
  }

  // 12. Rendement potentiel
  if (exclusion == null && variety.rendement_potentiel_max_kg != null) {
    const rMax = variety.rendement_potentiel_max_kg;
    if (rMax >= 3000) {
      score += 4;
      raisons.push({
        critere: "Rendement potentiel",
        message: `Fort potentiel de rendement (jusqu'à ${rMax} kg/ha).`,
        type: "positif",
      });
    } else if (rMax >= 2000) {
      score += 2;
      raisons.push({
        critere: "Rendement potentiel",
        message: `Rendement potentiel correct (jusqu'à ${rMax} kg/ha).`,
        type: "neutre",
      });
    }
  }

  // 13. Préférence : tolérance à la sécheresse recherchée
  if (exclusion == null && prefs.toleranceSecheresseRecherchee) {
    if (tol >= 2) {
      score += 4;
      raisons.push({
        critere: "Tolérance à la sécheresse",
        message: "Variété tolérante à la sécheresse, conforme à votre recherche.",
        type: "positif",
      });
    } else if (tol === 0) {
      raisons.push({
        critere: "Tolérance à la sécheresse",
        message: "Tolérance à la sécheresse non documentée pour cette variété.",
        type: "neutre",
      });
    }
  }

  // Statut de validation -> impact sur la confiance uniquement
  let confiance: "elevee" | "moyenne" | "faible" = "elevee";
  let confianceRaison = "Données variétales et climatiques disponibles, source officielle.";
  if (climat == null) {
    if (pluvioAnnuelle != null) {
      confiance = "moyenne";
      confianceRaison = "Données climatiques de campagne absentes : pluviométrie estimée via les isohyètes.";
    } else {
      confiance = "faible";
      confianceRaison = "Données climatiques absentes pour la campagne demandée.";
    }
  } else if (variety.statut_validation !== "officiel" || variety.statut === "en_evaluation") {
    confiance = "moyenne";
    confianceRaison = "Variété en évaluation ou données non encore officiellement validées.";
  } else if (variety.rendement_observe_moyen_kg == null) {
    confiance = "moyenne";
    confianceRaison = "Rendements observés non encore disponibles.";
  }

  if (exclusion) {
    raisons.push(exclusion);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let classification: Classification;
  if (exclusion) {
    classification = "non_recommandee";
  } else if (score >= SEUILS.fortement_recommandee) {
    classification = "fortement_recommandee";
  } else if (score >= SEUILS.adaptee) {
    classification = "adaptee";
  } else if (score >= SEUILS.envisageable) {
    classification = "envisageable";
  } else {
    classification = "non_recommandee";
  }

  return { variety, score, classification, raisons, confiance, confiance_raison: confianceRaison };
}

const ORDER: Record<Classification, number> = {
  fortement_recommandee: 0,
  adaptee: 1,
  envisageable: 2,
  non_recommandee: 3,
};

export function sortResults(results: VarietyResult[]): VarietyResult[] {
  return [...results].sort((a, b) => {
    if (ORDER[a.classification] !== ORDER[b.classification]) {
      return ORDER[a.classification] - ORDER[b.classification];
    }
    return b.score - a.score;
  });
}
