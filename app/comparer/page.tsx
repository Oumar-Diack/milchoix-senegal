import { getAllVarieties, getVariety } from "@/lib/queries";
import { COMPARISON_ATTRIBUTES, formatComparisonValue } from "@/lib/comparison";
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

  const exportQuery = `ids=${selected.map((v) => v.id).join(",")}`;

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
        <>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="text-sm text-stone-500">
              Exporter le tableau comparatif :
            </span>
            <a
              href={`/api/comparer/export/excel?${exportQuery}`}
              className="flex items-center gap-2 rounded-lg bg-leaf-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-leaf-700"
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
              Excel
            </a>
            <a
              href={`/api/comparer/export/pdf?${exportQuery}`}
              className="flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-100"
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
              PDF
            </a>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
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
                {COMPARISON_ATTRIBUTES.map((attr) => (
                  <tr key={attr.key} className="border-t border-stone-100">
                    <td className="sticky left-0 bg-white p-3 text-stone-500 font-medium">
                      {attr.label}
                    </td>
                    {selected.map((v) => (
                      <td key={v.id} className="p-3 align-top text-stone-800">
                        {formatComparisonValue(v, attr.key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
