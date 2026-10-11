import { getVarieties, getCommunes, getAllZones, getAllClimat } from "@/lib/queries";
import { VarietyMap } from "@/components/VarietyMap";

export default async function CartePage({
  searchParams,
}: {
  searchParams: Promise<{ variete?: string; annee?: string }>;
}) {
  const sp = await searchParams;
  const varieties = getVarieties();
  const communes = getCommunes();
  const zones = getAllZones();
  const climats = getAllClimat();

  const initialVariety = Number(sp.variete) || varieties[0]?.id || null;
  const years = Array.from(new Set(climats.map((c) => c.annee))).sort((a, b) => b - a);
  const initialYear = Number(sp.annee) || years[0] || 2025;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-mil-900">Carte variétale intelligente</h1>
      <p className="mt-2 text-stone-600">
        Visualisez les zones d'adaptation (officielles, historiques, potentielles) et
        les données climatiques par région. Cliquez sur une région pour plus de détails.
      </p>

      <VarietyMap
        communes={communes}
        varieties={varieties}
        zones={zones}
        climats={climats}
        initialVariety={initialVariety}
        initialYear={initialYear}
        years={years}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3 text-sm">
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="font-semibold text-leaf-700 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-leaf-600 inline-block" /> Zone officielle
          </p>
          <p className="text-stone-500 text-xs mt-1">
            Zone d'adaptation officiellement reconnue (catalogue national).
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="font-semibold text-blue-700 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-blue-600 inline-block" /> Zone historique
          </p>
          <p className="text-stone-500 text-xs mt-1">
            Zone historiquement favorable, issue des données de production.
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="font-semibold text-amber-700 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-500 inline-block" /> Zone potentielle
          </p>
          <p className="text-stone-500 text-xs mt-1">
            Zone potentiellement adaptée, estimée par le moteur ou en cours d'essai.
          </p>
        </div>
      </div>
    </div>
  );
}
