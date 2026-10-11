"use client";

import { useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Popup,
  Tooltip,
} from "react-leaflet";
import { toPng } from "html-to-image";
import "leaflet/dist/leaflet.css";
import type { Commune, Variety, Climat } from "@/lib/types";
import { getRegionPolygons, normalizeName } from "@/lib/regions";

interface Zone {
  variety_id: number;
  commune_id: number;
  zone_type: string;
}

const ZONE_COLORS: Record<string, string> = {
  officielle: "#389139",
  historique: "#2563eb",
  potentielle: "#f59e0b",
};

const ZONE_NAMES: Record<string, string> = {
  officielle: "Zone officielle",
  historique: "Zone historique",
  potentielle: "Zone potentielle",
};

function pluvioColor(mm: number): string {
  if (mm < 350) return "#dc2626";
  if (mm < 450) return "#ea580c";
  if (mm < 550) return "#eab308";
  if (mm < 700) return "#84cc16";
  if (mm < 900) return "#22c55e";
  return "#15803d";
}

const ZONE_PRIORITY: Record<string, number> = {
  officielle: 0,
  historique: 1,
  potentielle: 2,
};

function formatSurface(km2: number): string {
  return `${km2.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km²`;
}

export default function LeafletMap({
  communes,
  varieties,
  zones,
  climats,
  initialVariety,
  initialYear,
}: {
  communes: Commune[];
  varieties: Variety[];
  zones: Zone[];
  climats: Climat[];
  initialVariety: number | null;
  initialYear: number;
}) {
  const [varietyId, setVarietyId] = useState<number | null>(initialVariety);
  const [mode, setMode] = useState<"zones" | "climat">("zones");
  const [year, setYear] = useState<number>(initialYear);
  const [exporting, setExporting] = useState<boolean>(false);
  const mapRef = useRef<HTMLDivElement>(null);

  async function exportImage() {
    if (!mapRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(mapRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      const label = mode === "zones" ? selectedVariety?.nom_officiel ?? "zones" : `climat-${year}`;
      link.download = `carte-varietale-${label}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      alert("Impossible de générer l'image de la carte.");
    } finally {
      setExporting(false);
    }
  }

  const communeById = useMemo(() => {
    const map = new Map<number, Commune>();
    for (const c of communes) map.set(c.id, c);
    return map;
  }, [communes]);

  const regions = useMemo(() => getRegionPolygons(), []);

  const communesByRegion = useMemo(() => {
    const map = new Map<string, Commune[]>();
    for (const c of communes) {
      const key = normalizeName(c.region);
      const list = map.get(key) ?? [];
      list.push(c);
      map.set(key, list);
    }
    return map;
  }, [communes]);

  const zoneByRegion = useMemo(() => {
    const map = new Map<string, string>();
    for (const z of zones) {
      if (z.variety_id !== varietyId) continue;
      const commune = communeById.get(z.commune_id);
      if (!commune) continue;
      const key = normalizeName(commune.region);
      const existing = map.get(key);
      if (!existing || ZONE_PRIORITY[z.zone_type] < ZONE_PRIORITY[existing]) {
        map.set(key, z.zone_type);
      }
    }
    return map;
  }, [zones, varietyId, communeById]);

  const climatByRegion = useMemo(() => {
    const map = new Map<string, { sum: number; n: number; climats: Climat[] }>();
    for (const c of climats) {
      if (c.annee !== year) continue;
      const commune = communeById.get(c.commune_id);
      if (!commune) continue;
      const key = normalizeName(commune.region);
      const entry = map.get(key) ?? { sum: 0, n: 0, climats: [] };
      if (c.cumul_pluvio_mm != null) {
        entry.sum += c.cumul_pluvio_mm;
        entry.n += 1;
      }
      entry.climats.push(c);
      map.set(key, entry);
    }
    return map;
  }, [climats, year, communeById]);

  const years = useMemo(
    () => Array.from(new Set(climats.map((c) => c.annee))).sort((a, b) => b - a),
    [climats]
  );

  const selectedVariety = varieties.find((v) => v.id === varietyId);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-3 items-end rounded-t-xl border border-stone-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-stone-500">Variété</label>
          <select
            value={varietyId ?? ""}
            onChange={(e) => setVarietyId(e.target.value ? Number(e.target.value) : null)}
            className="border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Aucune (vue générale)</option>
            {varieties.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nom_officiel}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-stone-500">Couche</label>
          <div className="flex rounded-lg border border-stone-300 overflow-hidden">
            <button
              onClick={() => setMode("zones")}
              className={`px-3 py-2 text-sm ${mode === "zones" ? "bg-mil-700 text-white" : "bg-white text-stone-600"}`}
            >
              Zones d'adaptation
            </button>
            <button
              onClick={() => setMode("climat")}
              className={`px-3 py-2 text-sm ${mode === "climat" ? "bg-mil-700 text-white" : "bg-white text-stone-600"}`}
            >
              Climat
            </button>
          </div>
        </div>
        {mode === "climat" && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-stone-500">Campagne</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="ml-auto flex items-center gap-3">
          <div className="text-xs text-stone-500">
            {mode === "zones" && selectedVariety
              ? `Zones d'adaptation de « ${selectedVariety.nom_officiel} »`
              : mode === "zones"
              ? "Sélectionnez une variété pour afficher ses zones"
              : `Cumul pluviométrique (${year})`}
          </div>
          <button
            onClick={exportImage}
            disabled={exporting}
            className="flex flex-row flex-nowrap items-center justify-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-lg bg-leaf-600 text-white text-sm font-semibold shadow-sm hover:bg-leaf-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="h-4 w-4 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M10 2a1 1 0 0 1 1 1v7.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L9 10.586V3a1 1 0 0 1 1-1Z" />
              <path d="M3 15a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1a1 1 0 0 1 1-1Z" />
            </svg>
            <span>{exporting ? "Génération…" : "Enregistrer l'image"}</span>
          </button>
        </div>
      </div>

      <div ref={mapRef} className="h-[520px] rounded-b-xl overflow-hidden border border-t-0 border-stone-200">
        <MapContainer center={[14.3, -15.4]} zoom={7} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            crossOrigin="anonymous"
          />
          {regions.map((r) => {
            const key = normalizeName(r.nom);
            const regionCommunes = communesByRegion.get(key) ?? [];

            if (mode === "zones") {
              const zoneType = zoneByRegion.get(key);
              const color = zoneType ? ZONE_COLORS[zoneType] : "#d6d3d1";
              return (
                <Polygon
                  key={r.nom}
                  positions={r.polygons}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.35, weight: 1.5 }}
                >
                  <Tooltip sticky>
                    {r.nom}
                  </Tooltip>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold">Région de {r.nom}</p>
                      <p className="text-stone-400 text-xs mt-0.5">
                        Superficie : {formatSurface(r.surface_km2)}
                      </p>
                      {selectedVariety && (
                        <p className="mt-1">
                          {zoneType ? (
                            <span style={{ color: ZONE_COLORS[zoneType] }} className="font-semibold">
                              {ZONE_NAMES[zoneType]}
                            </span>
                          ) : (
                            <span className="text-stone-400">
                              Aucune zone connue pour cette variété
                            </span>
                          )}
                        </p>
                      )}
                      {regionCommunes.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {regionCommunes.map((c) => {
                            const zt = varietyId
                              ? zones.find(
                                  (z) => z.variety_id === varietyId && z.commune_id === c.id
                                )?.zone_type
                              : undefined;
                            return (
                              <li key={c.id} className="flex items-center gap-2">
                                <span
                                  className="inline-block h-2 w-2 rounded-full"
                                  style={{ backgroundColor: zt ? ZONE_COLORS[zt] : "#d6d3d1" }}
                                />
                                {c.nom}
                                {zt && (
                                  <span className="text-stone-400 text-xs">({ZONE_NAMES[zt]})</span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </Popup>
                </Polygon>
              );
            }

            const agg = climatByRegion.get(key);
            const avg = agg && agg.n > 0 ? agg.sum / agg.n : null;
            const color = avg != null ? pluvioColor(avg) : "#d6d3d1";
            return (
              <Polygon
                key={r.nom}
                positions={r.polygons}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.35, weight: 1.5 }}
              >
                <Tooltip sticky>
                  {r.nom}
                </Tooltip>
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold">Région de {r.nom}</p>
                    <p className="text-stone-400 text-xs mt-0.5">
                      Superficie : {formatSurface(r.surface_km2)}
                    </p>
                    <dl className="mt-2 space-y-1">
                      <div>
                        <dt className="text-stone-400 text-xs">Cumul pluviométrique moyen</dt>
                        <dd>{avg != null ? `${Math.round(avg)} mm` : "—"}</dd>
                      </div>
                    </dl>
                    {regionCommunes.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {regionCommunes.map((c) => {
                          const clim = (agg?.climats ?? []).find((cl) => cl.commune_id === c.id);
                          return (
                            <li key={c.id} className="flex items-center gap-2">
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    clim?.cumul_pluvio_mm != null
                                      ? pluvioColor(clim.cumul_pluvio_mm)
                                      : "#d6d3d1",
                                }}
                              />
                              {c.nom}
                              <span className="text-stone-400 text-xs">
                                {clim?.cumul_pluvio_mm != null ? `${clim.cumul_pluvio_mm} mm` : "—"}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </Popup>
              </Polygon>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
