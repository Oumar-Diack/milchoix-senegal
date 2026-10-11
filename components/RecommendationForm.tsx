"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Commune } from "@/lib/types";
import { TYPE_SOLS, OBJECTIFS_PRODUCTION, ACCES_INTRANTS, DUREES_CYCLE } from "@/lib/labels";

export function RecommendationForm({
  communes,
  years,
}: {
  communes: Commune[];
  years: number[];
}) {
  const router = useRouter();
  const [communeId, setCommuneId] = useState<string>("");
  const [campagneAnnee, setCampagneAnnee] = useState<string>(String(new Date().getFullYear()));
  const [dateSemis, setDateSemis] = useState<string>("");
  const [typeSol, setTypeSol] = useState<string>("");
  const [dureeCycleSouhaitee, setDureeCycleSouhaitee] = useState<string>("");
  const [objectifProduction, setObjectifProduction] = useState<string>("");
  const [preferencesAlimentaires, setPreferencesAlimentaires] = useState<string>("");
  const [accesIntrants, setAccesIntrants] = useState<string>("");
  const [toleranceSecheresse, setToleranceSecheresse] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!communeId || !campagneAnnee) {
      setError("Veuillez renseigner au moins la localité et la campagne agricole.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communeId: Number(communeId),
          campagneAnnee: Number(campagneAnnee),
          dateSemis,
          typeSol,
          dureeCycleSouhaitee,
          objectifProduction,
          preferencesAlimentaires,
          accesIntrants,
          toleranceSecheresseRecherchee: toleranceSecheresse,
          sessionId: crypto.randomUUID(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        setLoading(false);
        return;
      }
      router.push(`/recommandation/${data.id}`);
    } catch {
      setError("Impossible de contacter le serveur.");
      setLoading(false);
    }
  }

  const inputCls =
    "w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-mil-400";

  return (
    <form onSubmit={submit} className="mt-6 grid gap-6">
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-mil-900 text-lg">Localisation et campagne</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Localité *</label>
            <select
              value={communeId}
              onChange={(e) => setCommuneId(e.target.value)}
              className={inputCls}
              required
            >
              <option value="">Sélectionnez une localité…</option>
              {communes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} — {c.departement} ({c.region})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Campagne agricole *</label>
            <input
              type="number"
              min={2000}
              max={2100}
              step={1}
              value={campagneAnnee}
              onChange={(e) => setCampagneAnnee(e.target.value)}
              className={inputCls}
              required
              placeholder="Ex. 2026"
            />
            {years.length > 0 && (
              <p className="text-xs text-stone-400">
                Années avec données climatiques : {years.join(", ")}.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Date prévisionnelle de semis</label>
            <input
              type="date"
              value={dateSemis}
              onChange={(e) => setDateSemis(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Type de sol</label>
            <select value={typeSol} onChange={(e) => setTypeSol(e.target.value)} className={inputCls}>
              <option value="">Non précisé</option>
              {TYPE_SOLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-mil-900 text-lg">Préférences du producteur</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Durée de cycle souhaitée</label>
            <select
              value={dureeCycleSouhaitee}
              onChange={(e) => setDureeCycleSouhaitee(e.target.value)}
              className={inputCls}
            >
              <option value="">Indifférent</option>
              {DUREES_CYCLE.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Objectif de production</label>
            <select
              value={objectifProduction}
              onChange={(e) => setObjectifProduction(e.target.value)}
              className={inputCls}
            >
              <option value="">Non précisé</option>
              {OBJECTIFS_PRODUCTION.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Accès aux intrants</label>
            <select
              value={accesIntrants}
              onChange={(e) => setAccesIntrants(e.target.value)}
              className={inputCls}
            >
              <option value="">Non précisé</option>
              {ACCES_INTRANTS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Préférences alimentaires</label>
            <input
              type="text"
              value={preferencesAlimentaires}
              onChange={(e) => setPreferencesAlimentaires(e.target.value)}
              placeholder="Ex. couscous, thiakry, bouillie…"
              className={inputCls}
            />
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={toleranceSecheresse}
            onChange={(e) => setToleranceSecheresse(e.target.checked)}
            className="h-4 w-4 accent-mil-700"
          />
          Je recherche une variété tolérante à la sécheresse
        </label>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 rounded-lg bg-mil-700 text-white font-semibold hover:bg-mil-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Calcul en cours…" : "Obtenir ma recommandation"}
      </button>
    </form>
  );
}
