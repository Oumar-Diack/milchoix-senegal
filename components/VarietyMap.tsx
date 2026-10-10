"use client";

import dynamic from "next/dynamic";
import type { Commune, Variety, Climat } from "@/lib/types";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[520px] rounded-b-xl border border-stone-200 bg-stone-100 grid place-items-center text-stone-500">
      Chargement de la carte…
    </div>
  ),
});

export function VarietyMap(props: {
  communes: Commune[];
  varieties: Variety[];
  zones: { variety_id: number; commune_id: number; zone_type: string }[];
  climats: Climat[];
  initialVariety: number | null;
  initialYear: number;
  years: number[];
}) {
  return <LeafletMap {...props} />;
}
