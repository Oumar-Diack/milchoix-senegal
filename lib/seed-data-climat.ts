import { climatsReels } from "./climat-data";

export interface CommuneSeed {
  nom: string;
  departement: string;
  region: string;
  latitude: number;
  longitude: number;
  zone_sylvopastorale: number;
}

export const communes: CommuneSeed[] = [
  { nom: "Dakar", departement: "Dakar", region: "Dakar", latitude: 14.7232, longitude: -17.4602, zone_sylvopastorale: 0 },
  { nom: "Guédiawaye", departement: "Guédiawaye", region: "Dakar", latitude: 14.776, longitude: -17.3938, zone_sylvopastorale: 0 },
  { nom: "Pikine", departement: "Pikine", region: "Dakar", latitude: 14.7671, longitude: -17.3432, zone_sylvopastorale: 0 },
  { nom: "Rufisque", departement: "Rufisque", region: "Dakar", latitude: 14.7592, longitude: -17.2051, zone_sylvopastorale: 0 },
  { nom: "Bambey", departement: "Bambey", region: "Diourbel", latitude: 14.8023, longitude: -16.4839, zone_sylvopastorale: 0 },
  { nom: "Diourbel", departement: "Diourbel", region: "Diourbel", latitude: 14.7676, longitude: -16.2173, zone_sylvopastorale: 0 },
  { nom: "Mbacké", departement: "Mbacké", region: "Diourbel", latitude: 14.7732, longitude: -15.8331, zone_sylvopastorale: 0 },
  { nom: "Fatick", departement: "Fatick", region: "Fatick", latitude: 14.3183, longitude: -16.4881, zone_sylvopastorale: 0 },
  { nom: "Foundiougne", departement: "Foundiougne", region: "Fatick", latitude: 13.8511, longitude: -16.4286, zone_sylvopastorale: 0 },
  { nom: "Gossas", departement: "Gossas", region: "Fatick", latitude: 14.5288, longitude: -15.8382, zone_sylvopastorale: 0 },
  { nom: "Birkelane", departement: "Birkelane", region: "Kaffrine", latitude: 14.0523, longitude: -15.6841, zone_sylvopastorale: 0 },
  { nom: "Kaffrine", departement: "Kaffrine", region: "Kaffrine", latitude: 14.1287, longitude: -15.4459, zone_sylvopastorale: 0 },
  { nom: "Koungheul", departement: "Koungheul", region: "Kaffrine", latitude: 14.2039, longitude: -14.8584, zone_sylvopastorale: 0 },
  { nom: "Malem-Hodar", departement: "Malem-Hodar", region: "Kaffrine", latitude: 14.3553, longitude: -15.2513, zone_sylvopastorale: 0 },
  { nom: "Guinguinéo", departement: "Guinguinéo", region: "Kaolack", latitude: 14.2842, longitude: -15.917, zone_sylvopastorale: 0 },
  { nom: "Kaolack", departement: "Kaolack", region: "Kaolack", latitude: 14.0656, longitude: -16.067, zone_sylvopastorale: 0 },
  { nom: "Nioro du Rip", departement: "Nioro du Rip", region: "Kaolack", latitude: 13.7303, longitude: -15.8343, zone_sylvopastorale: 0 },
  { nom: "Kolda", departement: "Kolda", region: "Kolda", latitude: 12.8559, longitude: -14.6535, zone_sylvopastorale: 0 },
  { nom: "Médina-Yorofoula", departement: "Médina-Yorofoula", region: "Kolda", latitude: 13.2143, longitude: -14.8662, zone_sylvopastorale: 0 },
  { nom: "Vélingara", departement: "Vélingara", region: "Kolda", latitude: 12.986, longitude: -13.8752, zone_sylvopastorale: 0 },
  { nom: "Kédougou", departement: "Kédougou", region: "Kédougou", latitude: 12.7652, longitude: -12.4346, zone_sylvopastorale: 0 },
  { nom: "Salémata", departement: "Salémata", region: "Kédougou", latitude: 12.6033, longitude: -12.801, zone_sylvopastorale: 0 },
  { nom: "Saraya", departement: "Saraya", region: "Kédougou", latitude: 12.9714, longitude: -11.8325, zone_sylvopastorale: 0 },
  { nom: "Kébémer", departement: "Kébémer", region: "Louga", latitude: 15.3036, longitude: -16.261, zone_sylvopastorale: 0 },
  { nom: "Linguère", departement: "Linguère", region: "Louga", latitude: 15.3391, longitude: -15.1783, zone_sylvopastorale: 1 },
  { nom: "Louga", departement: "Louga", region: "Louga", latitude: 15.741, longitude: -16.0016, zone_sylvopastorale: 0 },
  { nom: "Kanel", departement: "Kanel", region: "Matam", latitude: 14.9763, longitude: -13.13, zone_sylvopastorale: 0 },
  { nom: "Matam", departement: "Matam", region: "Matam", latitude: 15.7215, longitude: -13.6308, zone_sylvopastorale: 0 },
  { nom: "Ranérou", departement: "Ranérou", region: "Matam", latitude: 15.0323, longitude: -14.1331, zone_sylvopastorale: 0 },
  { nom: "Dagana", departement: "Dagana", region: "Saint-Louis", latitude: 16.2779, longitude: -15.8827, zone_sylvopastorale: 0 },
  { nom: "Podor", departement: "Podor", region: "Saint-Louis", latitude: 16.1954, longitude: -14.6064, zone_sylvopastorale: 0 },
  { nom: "Saint-Louis", departement: "Saint-Louis", region: "Saint-Louis", latitude: 15.9577, longitude: -16.3712, zone_sylvopastorale: 0 },
  { nom: "Bounkiling", departement: "Bounkiling", region: "Sédhiou", latitude: 13.1337, longitude: -15.6035, zone_sylvopastorale: 0 },
  { nom: "Goudomp", departement: "Goudomp", region: "Sédhiou", latitude: 12.633, longitude: -15.5132, zone_sylvopastorale: 0 },
  { nom: "Sédhiou", departement: "Sédhiou", region: "Sédhiou", latitude: 12.8068, longitude: -15.6151, zone_sylvopastorale: 0 },
  { nom: "Bakel", departement: "Bakel", region: "Tambacounda", latitude: 14.1676, longitude: -12.2545, zone_sylvopastorale: 0 },
  { nom: "Goudiry", departement: "Goudiry", region: "Tambacounda", latitude: 13.9986, longitude: -12.9297, zone_sylvopastorale: 0 },
  { nom: "Koumpentoum", departement: "Koumpentoum", region: "Tambacounda", latitude: 14.1321, longitude: -14.3395, zone_sylvopastorale: 0 },
  { nom: "Tambacounda", departement: "Tambacounda", region: "Tambacounda", latitude: 13.4914, longitude: -13.4719, zone_sylvopastorale: 0 },
  { nom: "Mbour", departement: "Mbour", region: "Thiès", latitude: 14.4586, longitude: -16.8302, zone_sylvopastorale: 0 },
  { nom: "Thiès", departement: "Thiès", region: "Thiès", latitude: 14.7456, longitude: -16.8698, zone_sylvopastorale: 0 },
  { nom: "Tivaouane", departement: "Tivaouane", region: "Thiès", latitude: 15.0882, longitude: -16.651, zone_sylvopastorale: 0 },
  { nom: "Bignona", departement: "Bignona", region: "Ziguinchor", latitude: 12.8859, longitude: -16.3661, zone_sylvopastorale: 0 },
  { nom: "Oussouye", departement: "Oussouye", region: "Ziguinchor", latitude: 12.475, longitude: -16.6137, zone_sylvopastorale: 0 },
  { nom: "Ziguinchor", departement: "Ziguinchor", region: "Ziguinchor", latitude: 12.5166, longitude: -16.2237, zone_sylvopastorale: 0 },
];

export interface ClimatSeed {
  commune: string;
  annee: number;
  cumul_pluvio_mm: number;
  date_debut_saison: string | null;
  date_fin_saison: string | null;
  duree_saison_jours: number;
  nb_sequences_seches: number;
  duree_max_seche_jours: number | null;
  temperature_moyenne_c: number;
  prevision_saison: string;
}

export const climats: ClimatSeed[] = climatsReels.map(
  ([commune, annee, cumul, saison, seq, tmoy, prevision]) => ({
    commune,
    annee,
    cumul_pluvio_mm: cumul,
    date_debut_saison: null,
    date_fin_saison: null,
    duree_saison_jours: saison,
    nb_sequences_seches: seq,
    duree_max_seche_jours: null,
    temperature_moyenne_c: tmoy,
    prevision_saison: prevision,
  })
);

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

  { variete: "Souna Saloum (SL28)", commune: "Kaolack", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Souna Saloum (SL28)", commune: "Nioro du Rip", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Souna Saloum (SL28)", commune: "Kaffrine", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Souna Saloum (SL28)", commune: "Bambey", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Souna Saloum (SL28)", commune: "Diourbel", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Souna Saloum (SL28)", commune: "Fatick", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Souna Saloum (SL28)", commune: "Gossas", zone_type: "historique", source: "Données de production", niveau_confiance: "moyen" },

  { variete: "Souna Sine (SL169)", commune: "Kaolack", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Souna Sine (SL169)", commune: "Nioro du Rip", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Souna Sine (SL169)", commune: "Kaffrine", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Souna Sine (SL169)", commune: "Koungheul", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Souna Sine (SL169)", commune: "Fatick", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Souna Sine (SL169)", commune: "Tambacounda", zone_type: "potentielle", source: "Estimation moteur", niveau_confiance: "faible" },

  { variete: "Souna Baol (SL423)", commune: "Nioro du Rip", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Souna Baol (SL423)", commune: "Koungheul", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Souna Baol (SL423)", commune: "Fatick", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Souna Baol (SL423)", commune: "Tambacounda", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Souna Baol (SL423)", commune: "Kolda", zone_type: "potentielle", source: "Estimation moteur", niveau_confiance: "faible" },

  { variete: "IBV 8004", commune: "Louga", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "IBV 8004", commune: "Linguère", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "IBV 8004", commune: "Thiès", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "IBV 8004", commune: "Diourbel", zone_type: "historique", source: "Données de production", niveau_confiance: "moyen" },

  { variete: "Thialack 2", commune: "Linguère", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Thialack 2", commune: "Louga", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Thialack 2", commune: "Thiès", zone_type: "historique", source: "Données de production", niveau_confiance: "moyen" },

  { variete: "Gawane", commune: "Louga", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Gawane", commune: "Linguère", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Gawane", commune: "Thiès", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "Gawane", commune: "Kaolack", zone_type: "potentielle", source: "Estimation moteur", niveau_confiance: "faible" },

  { variete: "SOSAT-C88", commune: "Kaolack", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "SOSAT-C88", commune: "Kaffrine", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "SOSAT-C88", commune: "Bambey", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
  { variete: "SOSAT-C88", commune: "Fatick", zone_type: "officielle", source: "Catalogue national", niveau_confiance: "eleve" },
];
