"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Variety } from "@/lib/types";

export function VarietySelector({
  varieties,
  selectedIds,
}: {
  varieties: Variety[];
  selectedIds: number[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function toggle(id: number) {
    const current = new Set(selectedIds);
    if (current.has(id)) current.delete(id);
    else {
      if (current.size >= 4) return;
      current.add(id);
    }
    const params = new URLSearchParams(searchParams.toString());
    const ids = Array.from(current);
    if (ids.length === 0) params.delete("ids");
    else params.set("ids", ids.join(","));
    router.push(`/comparer?${params.toString()}`);
  }

  return (
    <div className="mt-6 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-stone-500 mb-3">
        {selectedIds.length} sélectionnée{selectedIds.length > 1 ? "s" : ""} sur 4 max.
      </p>
      <div className="flex flex-wrap gap-2">
        {varieties.map((v) => {
          const checked = selectedIds.includes(v.id);
          return (
            <button
              key={v.id}
              onClick={() => toggle(v.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                checked
                  ? "bg-mil-700 text-white border-mil-700"
                  : "bg-white text-stone-600 border-stone-300 hover:border-mil-400"
              }`}
            >
              {v.nom_officiel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
