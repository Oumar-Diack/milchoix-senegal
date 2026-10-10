"use client";

import { useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Tooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Commune, Variety, Climat } from "@/lib/types";

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

function pluvioRadius(mm: number): number {
  return 6 + (Math.min(mm, 1200) - 300) * 0.012;
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

  const zoneByCommune = useMemo(() => {
    const map = new Map<number, string>();
    for (const z of zones) {
      if (z.variety_id === varietyId) map.set(z.commune_id, z.zone_type);
    }
    return map;
  }, [zones, varietyId]);

  const climatByCommune = useMemo(() => {
    const map = new Map<number, Climat>();
    for (const c of climats) {
      if (c.annee === year) map.set(c.commune_id, c);
    }
    return map;
  }, [climats, year]);

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
        <div className="ml-auto text-xs text-stone-500">
          {mode === "zones" && selectedVariety
            ? `Zones d'adaptation de « ${selectedVariety.nom_officiel} »`
            : mode === "zones"
            ? "Sélectionnez une variété pour afficher ses zones"
            : `Cumul pluviométrique (${year})`}
        </div>
      </div>

      <div className="h-[520px] rounded-b-xl overflow-hidden border border-t-0 border-stone-200">
        <MapContainer center={[14.3, -15.4]} zoom={7} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {communes.map((c) => {
            if (mode === "zones") {
              const zoneType = zoneByCommune.get(c.id);
              const color = zoneType ? ZONE_COLORS[zoneType] : "#d6d3d1";
              return (
                <CircleMarker
                  key={c.id}
                  center={[c.latitude, c.longitude]}
                  radius={zoneType ? 8 : 5}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.7 }}
                >
                  <Tooltip direction="top" offset={[0, -8]}>
                    {c.nom}
                  </Tooltip>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold">{c.nom}</p>
                      <p className="text-stone-500">
                        {c.departement}, région de {c.region}
                      </p>
                      {selectedVariety && (
                        <p className="mt-2">
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
                    </div>
                  </Popup>
                </CircleMarker>
              );
            }

            const clim = climatByCommune.get(c.id);
            const color = clim?.cumul_pluvio_mm != null ? pluvioColor(clim.cumul_pluvio_mm) : "#d6d3d1";
            return (
              <CircleMarker
                key={c.id}
                center={[c.latitude, c.longitude]}
                radius={clim?.cumul_pluvio_mm != null ? pluvioRadius(clim.cumul_pluvio_mm) : 5}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.6 }}
              >
                <Tooltip direction="top" offset={[0, -8]}>
                  {c.nom}
                </Tooltip>
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold">{c.nom}</p>
                    <p className="text-stone-500">
                      {c.departement}, région de {c.region}
                    </p>
                    {clim ? (
                      <dl className="mt-2 space-y-1">
                        <div>
                          <dt className="text-stone-400 text-xs">Cumul pluviométrique</dt>
                          <dd>{clim.cumul_pluvio_mm} mm</dd>
                        </div>
                        <div>
                          <dt className="text-stone-400 text-xs">Durée de saison</dt>
                          <dd>{clim.duree_saison_jours} jours</dd>
                        </div>
                        <div>
                          <dt className="text-stone-400 text-xs">Séquences sèches</dt>
                          <dd>
                            {clim.nb_sequences_seches} (max {clim.duree_max_seche_jours} j)
                          </dd>
                        </div>
                        <div>
                          <dt className="text-stone-400 text-xs">Prévision</dt>
                          <dd>{clim.prevision_saison}</dd>
                        </div>
                      </dl>
                    ) : (
                      <p className="text-stone-400 mt-2">Pas de donnée climatique pour {year}.</p>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
