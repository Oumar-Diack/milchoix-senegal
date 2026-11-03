import type { Variety } from "./types";
import { STATUT_LABELS } from "./labels";

// Attributs affichés dans le tableau comparatif (page /comparer et exports).
export const COMPARISON_ATTRIBUTES: { label: string; key: keyof Variety }[] = [
  { label: "Statut", key: "statut" },
  { label: "Année d'homologation", key: "annee_homologation" },
  { label: "Obtenteur", key: "obtenteur" },
  { label: "Type", key: "type_mil" },
  { label: "Cycle", key: "duree_cycle_jours" },
  { label: "Précocité", key: "precocite" },
  { label: "Besoins en eau", key: "besoins_pluvio_min_mm" },
  { label: "Tolérance sécheresse", key: "tolerance_secheresse" },
  { label: "Maladies", key: "resistances_maladies" },
  { label: "Ravageurs", key: "reaction_ravageurs" },
  { label: "Rendement potentiel", key: "rendement_potentiel_max_kg" },
  { label: "Rendement observé", key: "rendement_observe_moyen_kg" },
  { label: "Grain", key: "caracteristiques_grain" },
  { label: "Usages", key: "usages_alimentaires" },
  { label: "Sols", key: "exigences_pedologiques" },
  { label: "Semences", key: "disponibilite_semences" },
];

// Formate la valeur d'un attribut pour une variété donnée.
export function formatComparisonValue(variety: Variety, key: keyof Variety): string {
  const value = variety[key];
  if (value == null || value === "") return "—";

  switch (key) {
    case "statut":
      return STATUT_LABELS[String(value)] ?? String(value);
    case "duree_cycle_jours":
      return `${value} jours`;
    case "besoins_pluvio_min_mm": {
      const max = variety.besoins_pluvio_max_mm;
      if (max == null || max === value) return `${value} mm`;
      return `${value}–${max} mm`;
    }
    case "rendement_potentiel_max_kg": {
      const min = variety.rendement_potentiel_min_kg;
      if (min == null || min === value) return `${value} kg/ha`;
      return `${min}–${value} kg/ha`;
    }
    case "rendement_observe_moyen_kg":
      return `${value} kg/ha`;
    default:
      return String(value);
  }
}

// Lignes complètes du tableau : en-tête + valeurs, prêtes pour l'export.
export function buildComparisonTable(varieties: Variety[]): string[][] {
  const header = ["Caractéristique", ...varieties.map((v) => v.nom_officiel)];
  const rows = COMPARISON_ATTRIBUTES.map((attr) => [
    attr.label,
    ...varieties.map((v) => formatComparisonValue(v, attr.key)),
  ]);
  return [header, ...rows];
}
