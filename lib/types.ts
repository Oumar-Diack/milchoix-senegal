export interface Variety {
  id: number;
  nom_officiel: string;
  noms_locaux: string;
  statut: string;
  annee_homologation: number | null;
  obtenteur: string;
  type_mil: string;
  duree_cycle_jours: number | null;
  precocite: string;
  besoins_pluvio_min_mm: number | null;
  besoins_pluvio_max_mm: number | null;
  tolerance_secheresse: string;
  resistances_maladies: string;
  reaction_ravageurs: string;
  rendement_potentiel_min_kg: number | null;
  rendement_potentiel_max_kg: number | null;
  rendement_observe_moyen_kg: number | null;
  caracteristiques_grain: string;
  usages_alimentaires: string;
  exigences_pedologiques: string;
  disponibilite_semences: string;
  description: string;
  source: string;
  date_maj: string;
  statut_validation: string;
  published: number;
}

export interface Commune {
  id: number;
  nom: string;
  departement: string;
  region: string;
  latitude: number;
  longitude: number;
  zone_sylvopastorale: number;
}

export interface Climat {
  id: number;
  commune_id: number;
  annee: number;
  cumul_pluvio_mm: number | null;
  date_debut_saison: string | null;
  date_fin_saison: string | null;
  duree_saison_jours: number | null;
  nb_sequences_seches: number | null;
  duree_max_seche_jours: number | null;
  temperature_moyenne_c: number | null;
  prevision_saison: string;
  source: string;
  date_maj: string;
}

export interface Preferences {
  campagneAnnee: number;
  dateSemis: string;
  typeSol: string;
  dureeCycleSouhaitee: string;
  objectifProduction: string;
  preferencesAlimentaires: string;
  accesIntrants: string;
  toleranceSecheresseRecherchee: boolean;
}
