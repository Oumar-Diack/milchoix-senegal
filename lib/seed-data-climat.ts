export interface CommuneSeed {
  nom: string;
  departement: string;
  region: string;
  latitude: number;
  longitude: number;
  zone_sylvopastorale: number;
}

export const communes: CommuneSeed[] = [
  { nom: "Kaolack", departement: "Kaolack", region: "Kaolack", latitude: 14.182, longitude: -16.253, zone_sylvopastorale: 0 },
  { nom: "Nioro du Rip", departement: "Nioro du Rip", region: "Kaolack", latitude: 13.745, longitude: -15.775, zone_sylvopastorale: 0 },
  { nom: "Kaffrine", departement: "Kaffrine", region: "Kaffrine", latitude: 14.105, longitude: -15.551, zone_sylvopastorale: 0 },
  { nom: "Koungheul", departement: "Koungheul", region: "Kaffrine", latitude: 13.983, longitude: -14.802, zone_sylvopastorale: 0 },
  { nom: "Bambey", departement: "Bambey", region: "Diourbel", latitude: 14.703, longitude: -16.462, zone_sylvopastorale: 0 },
  { nom: "Diourbel", departement: "Diourbel", region: "Diourbel", latitude: 14.652, longitude: -16.232, zone_sylvopastorale: 0 },
  { nom: "Mbacké", departement: "Mbacké", region: "Diourbel", latitude: 14.792, longitude: -15.909, zone_sylvopastorale: 0 },
  { nom: "Louga", departement: "Louga", region: "Louga", latitude: 15.622, longitude: -16.224, zone_sylvopastorale: 0 },
  { nom: "Linguère", departement: "Linguère", region: "Louga", latitude: 15.397, longitude: -15.119, zone_sylvopastorale: 1 },
  { nom: "Dahra", departement: "Linguère", region: "Louga", latitude: 15.351, longitude: -15.478, zone_sylvopastorale: 1 },
  { nom: "Fatick", departement: "Fatick", region: "Fatick", latitude: 14.335, longitude: -16.409, zone_sylvopastorale: 0 },
  { nom: "Gossas", departement: "Gossas", region: "Fatick", latitude: 14.497, longitude: -16.066, zone_sylvopastorale: 0 },
  { nom: "Thiès", departement: "Thiès", region: "Thiès", latitude: 14.789, longitude: -16.926, zone_sylvopastorale: 0 },
  { nom: "Tambacounda", departement: "Tambacounda", region: "Tambacounda", latitude: 13.771, longitude: -13.667, zone_sylvopastorale: 0 },
  { nom: "Kolda", departement: "Kolda", region: "Kolda", latitude: 12.895, longitude: -14.944, zone_sylvopastorale: 0 },
  { nom: "Vélingara", departement: "Vélingara", region: "Kolda", latitude: 13.151, longitude: -14.119, zone_sylvopastorale: 0 },
];

export interface ClimatSeed {
  commune: string;
  annee: number;
  cumul_pluvio_mm: number;
  date_debut_saison: string;
  date_fin_saison: string;
  duree_saison_jours: number;
  nb_sequences_seches: number;
  duree_max_seche_jours: number;
  temperature_moyenne_c: number;
  prevision_saison: string;
}

export const climats: ClimatSeed[] = [
  { commune: "Kaolack", annee: 2024, cumul_pluvio_mm: 620, date_debut_saison: "2024-06-15", date_fin_saison: "2024-10-05", duree_saison_jours: 112, nb_sequences_seches: 2, duree_max_seche_jours: 9, temperature_moyenne_c: 29.5, prevision_saison: "saison normale" },
  { commune: "Kaolack", annee: 2025, cumul_pluvio_mm: 540, date_debut_saison: "2025-06-25", date_fin_saison: "2025-10-01", duree_saison_jours: 98, nb_sequences_seches: 3, duree_max_seche_jours: 14, temperature_moyenne_c: 29.8, prevision_saison: "saison légèrement déficitaire" },
  { commune: "Nioro du Rip", annee: 2024, cumul_pluvio_mm: 680, date_debut_saison: "2024-06-10", date_fin_saison: "2024-10-10", duree_saison_jours: 122, nb_sequences_seches: 2, duree_max_seche_jours: 8, temperature_moyenne_c: 29.2, prevision_saison: "saison normale à excédentaire" },
  { commune: "Nioro du Rip", annee: 2025, cumul_pluvio_mm: 590, date_debut_saison: "2025-06-20", date_fin_saison: "2025-10-05", duree_saison_jours: 107, nb_sequences_seches: 2, duree_max_seche_jours: 11, temperature_moyenne_c: 29.6, prevision_saison: "saison normale" },
  { commune: "Kaffrine", annee: 2024, cumul_pluvio_mm: 610, date_debut_saison: "2024-06-12", date_fin_saison: "2024-10-06", duree_saison_jours: 116, nb_sequences_seches: 2, duree_max_seche_jours: 9, temperature_moyenne_c: 29.4, prevision_saison: "saison normale" },
  { commune: "Kaffrine", annee: 2025, cumul_pluvio_mm: 500, date_debut_saison: "2025-06-28", date_fin_saison: "2025-09-28", duree_saison_jours: 92, nb_sequences_seches: 4, duree_max_seche_jours: 16, temperature_moyenne_c: 29.9, prevision_saison: "saison déficitaire" },
  { commune: "Koungheul", annee: 2024, cumul_pluvio_mm: 650, date_debut_saison: "2024-06-08", date_fin_saison: "2024-10-08", duree_saison_jours: 122, nb_sequences_seches: 2, duree_max_seche_jours: 8, temperature_moyenne_c: 29.3, prevision_saison: "saison normale à excédentaire" },
  { commune: "Koungheul", annee: 2025, cumul_pluvio_mm: 560, date_debut_saison: "2025-06-18", date_fin_saison: "2025-10-02", duree_saison_jours: 106, nb_sequences_seches: 3, duree_max_seche_jours: 12, temperature_moyenne_c: 29.7, prevision_saison: "saison normale" },
  { commune: "Bambey", annee: 2024, cumul_pluvio_mm: 580, date_debut_saison: "2024-06-18", date_fin_saison: "2024-10-03", duree_saison_jours: 107, nb_sequences_seches: 3, duree_max_seche_jours: 10, temperature_moyenne_c: 29.4, prevision_saison: "saison normale" },
  { commune: "Bambey", annee: 2025, cumul_pluvio_mm: 480, date_debut_saison: "2025-07-01", date_fin_saison: "2025-09-26", duree_saison_jours: 87, nb_sequences_seches: 4, duree_max_seche_jours: 15, temperature_moyenne_c: 29.9, prevision_saison: "saison déficitaire" },
  { commune: "Diourbel", annee: 2024, cumul_pluvio_mm: 560, date_debut_saison: "2024-06-20", date_fin_saison: "2024-10-01", duree_saison_jours: 103, nb_sequences_seches: 3, duree_max_seche_jours: 11, temperature_moyenne_c: 29.5, prevision_saison: "saison normale" },
  { commune: "Diourbel", annee: 2025, cumul_pluvio_mm: 470, date_debut_saison: "2025-07-02", date_fin_saison: "2025-09-25", duree_saison_jours: 85, nb_sequences_seches: 5, duree_max_seche_jours: 18, temperature_moyenne_c: 30.0, prevision_saison: "saison déficitaire" },
  { commune: "Mbacké", annee: 2024, cumul_pluvio_mm: 590, date_debut_saison: "2024-06-16", date_fin_saison: "2024-10-04", duree_saison_jours: 110, nb_sequences_seches: 3, duree_max_seche_jours: 10, temperature_moyenne_c: 29.4, prevision_saison: "saison normale" },
  { commune: "Mbacké", annee: 2025, cumul_pluvio_mm: 510, date_debut_saison: "2025-06-26", date_fin_saison: "2025-09-29", duree_saison_jours: 95, nb_sequences_seches: 3, duree_max_seche_jours: 13, temperature_moyenne_c: 29.8, prevision_saison: "saison légèrement déficitaire" },
  { commune: "Louga", annee: 2024, cumul_pluvio_mm: 380, date_debut_saison: "2024-07-10", date_fin_saison: "2024-09-20", duree_saison_jours: 72, nb_sequences_seches: 4, duree_max_seche_jours: 14, temperature_moyenne_c: 29.6, prevision_saison: "saison déficitaire" },
  { commune: "Louga", annee: 2025, cumul_pluvio_mm: 340, date_debut_saison: "2025-07-15", date_fin_saison: "2025-09-18", duree_saison_jours: 65, nb_sequences_seches: 5, duree_max_seche_jours: 20, temperature_moyenne_c: 29.9, prevision_saison: "saison déficitaire" },
  { commune: "Linguère", annee: 2024, cumul_pluvio_mm: 350, date_debut_saison: "2024-07-15", date_fin_saison: "2024-09-18", duree_saison_jours: 65, nb_sequences_seches: 5, duree_max_seche_jours: 16, temperature_moyenne_c: 30.1, prevision_saison: "saison déficitaire" },
  { commune: "Linguère", annee: 2025, cumul_pluvio_mm: 300, date_debut_saison: "2025-07-20", date_fin_saison: "2025-09-15", duree_saison_jours: 57, nb_sequences_seches: 6, duree_max_seche_jours: 22, temperature_moyenne_c: 30.3, prevision_saison: "saison très déficitaire" },
  { commune: "Dahra", annee: 2024, cumul_pluvio_mm: 360, date_debut_saison: "2024-07-12", date_fin_saison: "2024-09-19", duree_saison_jours: 69, nb_sequences_seches: 5, duree_max_seche_jours: 15, temperature_moyenne_c: 30.0, prevision_saison: "saison déficitaire" },
  { commune: "Dahra", annee: 2025, cumul_pluvio_mm: 320, date_debut_saison: "2025-07-18", date_fin_saison: "2025-09-16", duree_saison_jours: 60, nb_sequences_seches: 6, duree_max_seche_jours: 20, temperature_moyenne_c: 30.2, prevision_saison: "saison très déficitaire" },
  { commune: "Fatick", annee: 2024, cumul_pluvio_mm: 700, date_debut_saison: "2024-06-08", date_fin_saison: "2024-10-12", duree_saison_jours: 126, nb_sequences_seches: 2, duree_max_seche_jours: 7, temperature_moyenne_c: 29.0, prevision_saison: "saison normale à excédentaire" },
  { commune: "Fatick", annee: 2025, cumul_pluvio_mm: 640, date_debut_saison: "2025-06-15", date_fin_saison: "2025-10-08", duree_saison_jours: 115, nb_sequences_seches: 2, duree_max_seche_jours: 10, temperature_moyenne_c: 29.3, prevision_saison: "saison normale" },
  { commune: "Gossas", annee: 2024, cumul_pluvio_mm: 630, date_debut_saison: "2024-06-12", date_fin_saison: "2024-10-06", duree_saison_jours: 116, nb_sequences_seches: 2, duree_max_seche_jours: 9, temperature_moyenne_c: 29.3, prevision_saison: "saison normale" },
  { commune: "Gossas", annee: 2025, cumul_pluvio_mm: 570, date_debut_saison: "2025-06-20", date_fin_saison: "2025-10-02", duree_saison_jours: 104, nb_sequences_seches: 3, duree_max_seche_jours: 12, temperature_moyenne_c: 29.6, prevision_saison: "saison normale" },
  { commune: "Thiès", annee: 2024, cumul_pluvio_mm: 540, date_debut_saison: "2024-06-22", date_fin_saison: "2024-09-30", duree_saison_jours: 100, nb_sequences_seches: 3, duree_max_seche_jours: 11, temperature_moyenne_c: 29.0, prevision_saison: "saison normale" },
  { commune: "Thiès", annee: 2025, cumul_pluvio_mm: 460, date_debut_saison: "2025-07-03", date_fin_saison: "2025-09-24", duree_saison_jours: 83, nb_sequences_seches: 4, duree_max_seche_jours: 16, temperature_moyenne_c: 29.4, prevision_saison: "saison déficitaire" },
  { commune: "Tambacounda", annee: 2024, cumul_pluvio_mm: 800, date_debut_saison: "2024-05-25", date_fin_saison: "2024-10-20", duree_saison_jours: 148, nb_sequences_seches: 1, duree_max_seche_jours: 6, temperature_moyenne_c: 29.5, prevision_saison: "saison excédentaire" },
  { commune: "Tambacounda", annee: 2025, cumul_pluvio_mm: 760, date_debut_saison: "2025-05-30", date_fin_saison: "2025-10-18", duree_saison_jours: 141, nb_sequences_seches: 1, duree_max_seche_jours: 8, temperature_moyenne_c: 29.7, prevision_saison: "saison normale à excédentaire" },
  { commune: "Kolda", annee: 2024, cumul_pluvio_mm: 1100, date_debut_saison: "2024-05-15", date_fin_saison: "2024-10-30", duree_saison_jours: 168, nb_sequences_seches: 1, duree_max_seche_jours: 5, temperature_moyenne_c: 28.5, prevision_saison: "saison excédentaire" },
  { commune: "Kolda", annee: 2025, cumul_pluvio_mm: 980, date_debut_saison: "2025-05-20", date_fin_saison: "2025-10-25", duree_saison_jours: 158, nb_sequences_seches: 1, duree_max_seche_jours: 7, temperature_moyenne_c: 28.8, prevision_saison: "saison excédentaire" },
  { commune: "Vélingara", annee: 2024, cumul_pluvio_mm: 1050, date_debut_saison: "2024-05-18", date_fin_saison: "2024-10-28", duree_saison_jours: 163, nb_sequences_seches: 1, duree_max_seche_jours: 6, temperature_moyenne_c: 28.6, prevision_saison: "saison excédentaire" },
  { commune: "Vélingara", annee: 2025, cumul_pluvio_mm: 940, date_debut_saison: "2025-05-22", date_fin_saison: "2025-10-22", duree_saison_jours: 153, nb_sequences_seches: 2, duree_max_seche_jours: 8, temperature_moyenne_c: 28.9, prevision_saison: "saison excédentaire" },
];

export interface VarietyZoneSeed {
  variete: string;
  commune: string;
  zone_type: string;
  source: string;
  niveau_confiance: string;
}

export const varietyZones: VarietyZoneSeed[] = [
  { variete: "Souna 3", commune: "Kaolack", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Souna 3", commune: "Nioro du Rip", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Souna 3", commune: "Kaffrine", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Souna 3", commune: "Bambey", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Souna 3", commune: "Diourbel", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Souna 3", commune: "Mbacké", zone_type: "historique", source: "Données de production", niveau_confiance: "moyen" },
  { variete: "Souna 3", commune: "Fatick", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Souna 3", commune: "Gossas", zone_type: "historique", source: "Données de production", niveau_confiance: "moyen" },

  { variete: "SL 28", commune: "Kaolack", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "SL 28", commune: "Nioro du Rip", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "SL 28", commune: "Kaffrine", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "SL 28", commune: "Bambey", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "SL 28", commune: "Diourbel", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "SL 28", commune: "Fatick", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "SL 28", commune: "Gossas", zone_type: "historique", source: "Données de production", niveau_confiance: "moyen" },

  { variete: "SL 169", commune: "Kaolack", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "SL 169", commune: "Nioro du Rip", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "SL 169", commune: "Kaffrine", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "SL 169", commune: "Koungheul", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "SL 169", commune: "Fatick", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "SL 169", commune: "Tambacounda", zone_type: "potentielle", source: "Estimation moteur", niveau_confiance: "faible" },

  { variete: "SL 423", commune: "Nioro du Rip", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "SL 423", commune: "Koungheul", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "SL 423", commune: "Fatick", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "SL 423", commune: "Tambacounda", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "SL 423", commune: "Kolda", zone_type: "potentielle", source: "Estimation moteur", niveau_confiance: "faible" },

  { variete: "IBV 8004", commune: "Louga", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "IBV 8004", commune: "Linguère", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "IBV 8004", commune: "Dahra", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "IBV 8004", commune: "Thiès", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "IBV 8004", commune: "Diourbel", zone_type: "historique", source: "Données de production", niveau_confiance: "moyen" },

  { variete: "Thialack 2", commune: "Linguère", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Thialack 2", commune: "Dahra", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Thialack 2", commune: "Louga", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Thialack 2", commune: "Thiès", zone_type: "historique", source: "Données de production", niveau_confiance: "moyen" },

  { variete: "Gawane", commune: "Louga", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Gawane", commune: "Linguère", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Gawane", commune: "Dahra", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Gawane", commune: "Thiès", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Gawane", commune: "Kaolack", zone_type: "potentielle", source: "Estimation moteur", niveau_confiance: "faible" },

  { variete: "Sanio", commune: "Tambacounda", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Sanio", commune: "Kolda", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Sanio", commune: "Vélingara", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },

  { variete: "Sossat", commune: "Kaolack", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Sossat", commune: "Kaffrine", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Sossat", commune: "Bambey", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Sossat", commune: "Fatick", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },

  { variete: "ICMV IS 94222", commune: "Kaolack", zone_type: "potentielle", source: "Essais en cours", niveau_confiance: "faible" },
  { variete: "ICMV IS 94222", commune: "Bambey", zone_type: "potentielle", source: "Essais en cours", niveau_confiance: "faible" },
  { variete: "ICMV IS 94222", commune: "Louga", zone_type: "potentielle", source: "Essais en cours", niveau_confiance: "faible" },

  { variete: "Souna 2", commune: "Kaolack", zone_type: "historique", source: "Données de production", niveau_confiance: "moyen" },
  { variete: "Souna 2", commune: "Kaffrine", zone_type: "historique", source: "Données de production", niveau_confiance: "moyen" },
  { variete: "Souna 2", commune: "Diourbel", zone_type: "historique", source: "Données de production", niveau_confiance: "moyen" },

  { variete: "Nano-Souna", commune: "Linguère", zone_type: "potentielle", source: "Essais en cours", niveau_confiance: "faible" },
  { variete: "Nano-Souna", commune: "Dahra", zone_type: "potentielle", source: "Essais en cours", niveau_confiance: "faible" },
];
