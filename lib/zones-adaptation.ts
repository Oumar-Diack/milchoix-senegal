// Zones d'adaptation des variétés de mil.
// Source : Catalogue_variétés/Zones d'adaptation.xlsx (tableau de référence).
// Chaque entrée associe une variété (nom_officiel) aux communes où elle est
// « adaptée » ou « marginale ». Les communes non listées sont considérées non adaptées.

export interface ZoneAdaptationSeed {
  variete: string;
  adaptees: string[];
  marginales: string[];
}

export const zonesAdaptation: ZoneAdaptationSeed[] = [
  { variete: "Souna 3", adaptees: ["Louga", "Thiès", "Mbour", "Tivaouane", "Diourbel", "Bambey", "Mbacké", "Fatick", "Foundiougne", "Gossas", "Kaolack", "Nioro du Rip", "Guinguinéo", "Kaffrine", "Birkelane", "Koungheul", "Malem-Hodar"], marginales: ["Saint-Louis", "Dagana", "Podor", "Linguère", "Ranérou"] },
  { variete: "IBV 8001", adaptees: ["Fatick", "Foundiougne", "Gossas", "Kaolack", "Nioro du Rip", "Guinguinéo"], marginales: [] },
  { variete: "IBV 8004", adaptees: ["Thiès", "Mbour", "Tivaouane", "Diourbel", "Bambey", "Mbacké", "Louga"], marginales: [] },
  { variete: "IBMV 8402", adaptees: ["Thiès", "Mbour", "Tivaouane", "Diourbel", "Bambey", "Mbacké"], marginales: [] },
  { variete: "ISMI 9507", adaptees: ["Thiès", "Mbour", "Tivaouane", "Diourbel", "Bambey", "Mbacké"], marginales: [] },
  { variete: "Gawane", adaptees: ["Louga", "Thiès", "Mbour", "Tivaouane", "Diourbel", "Bambey", "Mbacké", "Fatick"], marginales: ["Saint-Louis", "Dagana", "Podor", "Matam", "Kanel", "Ranérou"] },
  { variete: "Thialack 2", adaptees: ["Fatick", "Foundiougne", "Kaolack", "Kaffrine", "Birkelane", "Koungheul", "Malem-Hodar"], marginales: ["Kolda", "Tambacounda", "Médina-Yorofoula", "Vélingara"] },
  { variete: "Souna Saloum (SL28)", adaptees: ["Fatick", "Kaolack", "Nioro du Rip", "Guinguinéo", "Kaffrine", "Birkelane", "Koungheul", "Malem-Hodar"], marginales: ["Kolda", "Tambacounda"] },
  { variete: "Souna Sine (SL169)", adaptees: ["Fatick", "Foundiougne", "Gossas", "Kaolack", "Nioro du Rip", "Guinguinéo"], marginales: ["Kaffrine", "Birkelane", "Koungheul", "Malem-Hodar"] },
  { variete: "Souna Baol (SL423)", adaptees: ["Louga", "Thiès", "Mbour", "Tivaouane", "Diourbel", "Bambey", "Mbacké"], marginales: ["Fatick", "Foundiougne", "Gossas", "Kaolack", "Nioro du Rip", "Guinguinéo", "Kaffrine", "Birkelane", "Koungheul", "Malem-Hodar"] },
  { variete: "TAAW (ICMH 177090 × SL175)", adaptees: ["Louga", "Thiès", "Mbour", "Tivaouane", "Diourbel", "Bambey", "Mbacké"], marginales: ["Fatick", "Foundiougne", "Gossas", "Kaolack", "Nioro du Rip", "Guinguinéo"] },
  { variete: "SOSAT-C88", adaptees: ["Louga", "Thiès", "Mbour", "Tivaouane", "Diourbel", "Bambey", "Mbacké", "Fatick", "Foundiougne", "Gossas"], marginales: ["Kaolack", "Nioro du Rip", "Guinguinéo", "Kaffrine", "Birkelane", "Koungheul", "Malem-Hodar"] },
  { variete: "CHAKTI", adaptees: ["Louga", "Saint-Louis", "Dagana", "Podor", "Matam", "Kanel", "Ranérou"], marginales: ["Thiès", "Mbour", "Tivaouane", "Diourbel", "Bambey", "Mbacké"] },
];
