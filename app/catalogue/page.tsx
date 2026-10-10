import Link from "next/link";
import { getVarieties, getVarietyCovers } from "@/lib/queries";
import { STATUT_LABELS } from "@/lib/labels";
import { CatalogueFilters } from "@/components/CatalogueFilters";

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; statut?: string; precocite?: string }>;
}) {
  const sp = await searchParams;
  const varietes = getVarieties({
    query: sp.q,
    statut: sp.statut,
    precocite: sp.precocite,
  });
  const covers = new Map(getVarietyCovers().map((c) => [c.variety_id, c.photo_id]));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-mil-900">Catalogue variétal</h1>
      <p className="mt-2 text-stone-600">
        Consultez et comparez les variétés de mil référencées par la plateforme.
      </p>

      <CatalogueFilters />

      <p className="mt-6 mb-3 text-sm text-stone-500">
        {varietes.length} variété{varietes.length > 1 ? "s" : ""}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {varietes.map((v) => {
          const cover = covers.get(v.id);
          return (
          <Link
            key={v.id}
            href={`/catalogue/${v.id}`}
            className="rounded-xl border border-stone-200 bg-white shadow-sm hover:shadow-md hover:border-mil-300 transition overflow-hidden"
          >
            <div className="h-40 bg-stone-100 grid place-items-center overflow-hidden">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/photos/${cover}`}
                  alt={v.nom_officiel}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-stone-300 text-4xl font-bold">M</span>
              )}
            </div>
            <div className="p-5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-bold text-mil-900">{v.nom_officiel}</h2>
              <span
                className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                  v.statut === "homologuee"
                    ? "bg-leaf-100 text-leaf-700"
                    : v.statut === "en_evaluation"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-stone-100 text-stone-600"
                }`}
              >
                {STATUT_LABELS[v.statut] ?? v.statut}
              </span>
            </div>
            {v.noms_locaux && (
              <p className="text-xs text-stone-500 mt-0.5">
                Noms locaux : {v.noms_locaux}
              </p>
            )}
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-stone-400 text-xs">Cycle</dt>
                <dd>{v.duree_cycle_jours ? `${v.duree_cycle_jours} jours` : "—"}</dd>
              </div>
              <div>
                <dt className="text-stone-400 text-xs">Précocité</dt>
                <dd>{v.precocite || "—"}</dd>
              </div>
              <div>
                <dt className="text-stone-400 text-xs">Besoins en eau</dt>
                <dd>
                  {v.besoins_pluvio_min_mm != null
                    ? `${v.besoins_pluvio_min_mm}–${v.besoins_pluvio_max_mm} mm`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-stone-400 text-xs">Tolérance sécheresse</dt>
                <dd>{v.tolerance_secheresse || "—"}</dd>
              </div>
            </dl>
            </div>
          </Link>
          );
        })}
      </div>
    </div>
  );
}
