"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { STATUT_LABELS } from "@/lib/labels";

export function CatalogueFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qRef = useRef<HTMLInputElement>(null);

  function apply() {
    const params = new URLSearchParams(searchParams.toString());
    const q = qRef.current?.value?.trim();
    if (q) params.set("q", q);
    else params.delete("q");
    router.push(`/catalogue?${params.toString()}`);
  }

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/catalogue?${params.toString()}`);
  }

  return (
    <div className="mt-6 flex flex-wrap gap-3 items-end rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-stone-500">Recherche</label>
        <input
          ref={qRef}
          defaultValue={searchParams.get("q") ?? ""}
          placeholder="Nom officiel ou local…"
          className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mil-400"
          onKeyDown={(e) => e.key === "Enter" && apply()}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-stone-500">Statut</label>
        <select
          value={searchParams.get("statut") ?? ""}
          onChange={(e) => setParam("statut", e.target.value)}
          className="border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Tous</option>
          {Object.entries(STATUT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-stone-500">Précocité</label>
        <select
          value={searchParams.get("precocite") ?? ""}
          onChange={(e) => setParam("precocite", e.target.value)}
          className="border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Toutes</option>
          <option value="très précoce">Très précoce</option>
          <option value="précoce">Précoce</option>
          <option value="semi-précoce">Semi-précoce</option>
          <option value="tardif">Tardif</option>
        </select>
      </div>
      <button
        onClick={apply}
        className="px-4 py-2 rounded-lg bg-mil-700 text-white text-sm font-semibold hover:bg-mil-800"
      >
        Filtrer
      </button>
    </div>
  );
}
