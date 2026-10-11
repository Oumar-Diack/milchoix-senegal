import data from "./regions-data.json";

export interface RegionPolygon {
  nom: string;
  surface_km2: number;
  polygons: [number, number][][][];
}

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const regions = (data as RegionPolygon[]).map((r) => ({
  ...r,
  key: normalizeName(r.nom),
}));

export function getRegionPolygons(): RegionPolygon[] {
  return regions;
}

export function matchRegion(name: string): RegionPolygon | null {
  const target = normalizeName(name);
  return regions.find((r) => r.key === target) ?? null;
}
