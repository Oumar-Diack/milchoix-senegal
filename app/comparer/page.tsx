import { getAllVarieties, getVariety } from "@/lib/queries";
import { VarietySelector } from "@/components/VarietySelector";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const sp = await searchParams;
  const all = getAllVarieties();
  const ids = (sp.ids ?? "")
    .split(",")
    .map((s) => Number(s))
    .filter((n) => !Number.isNaN(n) && n > 0);

  const selected = ids
    .map((id) => getVariety(id))
    .filter((v): v is NonNullable<typeof v> => v != null);

  const attributes: { label: string; key: keyof typeof selected[number] }[] = [
    { label: "Statut", key: "statut" },
    { label: "Année d'homologation", key: "annee_homologation" },
    { label: "Obtenteur", key: "obtenteur" },
    { label: "Type", key: "type_mil" },
    { label: "Cycle", key: "duree_cycle_jours" },
    { label: "Précocité", key: "precocite" },
    { label: "Besoins en eau", key: "besoins_pluvio_min_mm" },
    { label: "Tolérance sécheresse", key: "tolerance_secheresse" },
    { label: "Maladies", key: "resistances_maladies" },
    { label: "Ravageurs", key: "reaction_ravageurs" },
    { label: "Rendement potentiel", key: "rendement_potentiel_max_kg" },
    { label: "Rendement observé", key: "rendement_observe_moyen_kg" },
    { label: "Grain", key: "caracteristiques_grain" },
    { label: "Usages", key: "usages_alimentaires" },
    { label: "Sols", key: "exigences_pedologiques" },
    { label: "Semences", key: "disponibilite_semences" },
  ];

  function formatValue(key: string, v: unknown): string {
    if (v == null || v === "") return "—";
    if (key === "duree_cycle_jours") return `${v} jours`;
    if (key === "besoins_pluvio_min_mm") {
      const min = selected.find((s) => s.besoins_pluvio_min_mm === v);
      return min ? `${v}–${min.besoins_pluvio_max_mm} mm` : String(v);
    }
    if (key === "rendement_potentiel_max_kg") {
      const r = selected.find((s) => s.rendement_potentiel_max_kg === v);
      return r && r.rendement_potentiel_min_kg != null
        ? `${r.rendement_potentiel_min_kg}–${v} kg/ha`
        : String(v);
    }
    if (key === "rendement_observe_moyen_kg") return `${v} kg/ha`;
    return String(v);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-mil-900">Comparer les variétés</h1>
      <p className="mt-2 text-stone-600">
        Sélectionnez de 2 à 4 variétés pour les comparer côte à côte.
      </p>

      <VarietySelector varieties={all} selectedIds={ids} />

      {selected.length < 2 ? (
        <div className="mt-8 rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">
          Sélectionnez au moins deux variétés pour afficher le tableau comparatif.
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50">
                <th className="sticky left-0 bg-stone-50 p-3 text-left text-stone-500 font-medium min-w-[160px]">
                  Caractéristique
                </th>
                {selected.map((v) => (
                  <th key={v.id} className="p-3 text-left font-bold text-mil-900 min-w-[200px]">
                    {v.nom_officiel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr) => (
                <tr key={attr.key} className="border-t border-stone-100">
                  <td className="sticky left-0 bg-white p-3 text-stone-500 font-medium">
                    {attr.label}
                  </td>
                  {selected.map((v) => (
                    <td key={v.id} className="p-3 align-top text-stone-800">
                      {formatValue(attr.key, v[attr.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
