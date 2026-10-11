import data from "./isohyetes-data.json";

export interface IsohyeteLine {
  contour_mm: number;
  lines: [number, number][][];
}

const isohyetes = data as IsohyeteLine[];

const A = 6378137;
const F = 1 / 298.257223563;
const E2 = F * (2 - F);
const EP2 = E2 / (1 - E2);
const K0 = 0.9996;
const LON0 = (-15 * Math.PI) / 180;
const FE = 500000;

function latlonToUtm(lat: number, lng: number): [number, number] {
  const latr = (lat * Math.PI) / 180;
  const lonr = (lng * Math.PI) / 180;
  const s = Math.sin(latr);
  const cosp = Math.cos(latr);
  const N = A / Math.sqrt(1 - E2 * s * s);
  const T = Math.tan(latr) ** 2;
  const C = EP2 * cosp * cosp;
  const Ad = (lonr - LON0) * cosp;
  const M =
    A *
    ((1 - E2 / 4 - (3 * E2 * E2) / 64 - (5 * E2 ** 3) / 256) * latr -
      ((3 * E2) / 8 + (3 * E2 * E2) / 32 + (45 * E2 ** 3) / 1024) * Math.sin(2 * latr) +
      ((15 * E2 * E2) / 256 + (45 * E2 ** 3) / 1024) * Math.sin(4 * latr) -
      ((35 * E2 ** 3) / 3072) * Math.sin(6 * latr));
  const x =
    FE +
    K0 *
      N *
      (Ad +
        ((1 - T + C) * Ad ** 3) / 6 +
        ((5 - 18 * T + T * T + 72 * C - 58 * EP2) * Ad ** 5) / 120);
  const y =
    K0 *
    (M +
      N *
        Math.tan(latr) *
        ((Ad * Ad) / 2 +
          ((5 - T + 9 * C + 4 * C * C) * Ad ** 4) / 24 +
          ((61 - 58 * T + T * T + 600 * C - 330 * EP2) * Ad ** 6) / 720));
  return [x, y];
}

let utmCache: { contour_mm: number; polylines: [number, number][][] }[] | null = null;

function getUtmIsohyetes(): { contour_mm: number; polylines: [number, number][][] }[] {
  if (!utmCache) {
    utmCache = isohyetes.map((iso) => ({
      contour_mm: iso.contour_mm,
      polylines: iso.lines.map((line) =>
        line.map(([lat, lng]) => latlonToUtm(lat, lng))
      ),
    }));
  }
  return utmCache;
}

function distPointToPolyline(px: number, py: number, line: [number, number][]): number {
  let best = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const [x1, y1] = line[i];
    const [x2, y2] = line[i + 1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    let d: number;
    if (l2 === 0) {
      d = Math.hypot(px - x1, py - y1);
    } else {
      const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
      const cx = x1 + t * dx;
      const cy = y1 + t * dy;
      d = Math.hypot(px - cx, py - cy);
    }
    if (d < best) best = d;
  }
  return best;
}

export function getIsohyetes(): IsohyeteLine[] {
  return isohyetes;
}

/**
 * Pluviométrie annuelle moyenne estimée à partir des isohyètes du Sénégal
 * (interpolation entre les deux courbes les plus proches). Retourne une valeur
 * en mm, ou null si la position est hors de l'emprise des données.
 */
export function pluvioAnnuelle(lat: number, lng: number): number | null {
  const [px, py] = latlonToUtm(lat, lng);
  const distByValue = new Map<number, number>();
  for (const iso of getUtmIsohyetes()) {
    let best = Infinity;
    for (const line of iso.polylines) {
      const d = distPointToPolyline(px, py, line);
      if (d < best) best = d;
    }
    const prev = distByValue.get(iso.contour_mm);
    if (prev == null || best < prev) distByValue.set(iso.contour_mm, best);
  }

  const items = Array.from(distByValue.entries()).sort((a, b) => a[1] - b[1]);
  if (items.length === 0) return null;
  if (items.length === 1) return items[0][0];

  const [v1, d1] = items[0];
  const [v2, d2] = items[1];
  if (d1 + d2 === 0) return v1;
  return (v1 * d2 + v2 * d1) / (d1 + d2);
}
