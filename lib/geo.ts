import type { Commune } from "./types";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RegionPolygon {
  region: string;
  ring: [number, number][];
}

function convexHull(points: LatLng[]): LatLng[] {
  const pts = points
    .map((p) => ({ x: p.lng, y: p.lat, p }))
    .sort((a, b) => a.x - b.x || a.y - b.y);
  if (pts.length <= 2) return pts.map((t) => t.p);

  const cross = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: typeof pts = [];
  for (let i = 0; i < pts.length; i++) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pts[i]) <= 0) {
      lower.pop();
    }
    lower.push(pts[i]);
  }
  const upper: typeof pts = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pts[i]) <= 0) {
      upper.pop();
    }
    upper.push(pts[i]);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper).map((t) => t.p);
}

function centroid(pts: LatLng[]): LatLng {
  let lat = 0;
  let lng = 0;
  for (const p of pts) {
    lat += p.lat;
    lng += p.lng;
  }
  return { lat: lat / pts.length, lng: lng / pts.length };
}

function inflate(ring: LatLng[], factor: number): [number, number][] {
  const c = centroid(ring);
  return ring.map((p) => [c.lat + (p.lat - c.lat) * factor, c.lng + (p.lng - c.lng) * factor]);
}

function circle(center: LatLng, radius: number, n = 28): [number, number][] {
  const ring: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    ring.push([center.lat + Math.sin(a) * radius, center.lng + Math.cos(a) * radius]);
  }
  return ring;
}

export function buildRegionPolygons(communes: Commune[]): RegionPolygon[] {
  const byRegion = new Map<string, LatLng[]>();
  for (const c of communes) {
    const list = byRegion.get(c.region) ?? [];
    list.push({ lat: c.latitude, lng: c.longitude });
    byRegion.set(c.region, list);
  }

  const result: RegionPolygon[] = [];
  for (const [region, pts] of byRegion) {
    if (pts.length >= 3) {
      const hull = convexHull(pts);
      if (hull.length >= 3) {
        result.push({ region, ring: inflate(hull, 1.5) });
        continue;
      }
    }
    const c = centroid(pts);
    let maxDist = 0;
    for (const p of pts) {
      maxDist = Math.max(maxDist, Math.hypot(p.lat - c.lat, p.lng - c.lng));
    }
    const radius = Math.max(maxDist, 0.12) + 0.18;
    result.push({ region, ring: circle(c, radius) });
  }
  return result;
}
