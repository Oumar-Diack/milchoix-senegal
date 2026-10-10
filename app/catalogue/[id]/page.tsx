import Link from "next/link";
import { notFound } from "next/navigation";
import { getVariety, getVarietyZones, getVarietyPhotos } from "@/lib/queries";
import { STATUT_LABELS, VALIDATION_LABELS, ZONE_TYPE_LABELS } from "@/lib/labels";
import { PhotoGallery } from "@/components/PhotoGallery";

export default async function VarietyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const variety = getVariety(Number(id));
  if (!variety) notFound();

  const zones = getVarietyZones(variety.id);
  const photos = getVarietyPhotos(variety.id);

  const rows: [string, string][] = [
    ["Type", variety.type_mil],
    ["Durée du cycle", variety.duree_cycle_jours ? `${variety.duree_cycle_jours} jours` : "—"],
    ["Précocité", variety.precocite || "—"],
    [
      "Besoins en eau",
      variety.besoins_pluvio_min_mm != null
        ? `${variety.besoins_pluvio_min_mm}–${variety.besoins_pluvio_max_mm} mm`
        : "—",
    ],
    ["Tolérance à la sécheresse", variety.tolerance_secheresse || "—"],
    ["Maladies", variety.resistances_maladies || "—"],
    ["Ravageurs", variety.reaction_ravageurs || "—"],
    [
      "Rendement potentiel",
      variety.rendement_potentiel_min_kg != null
        ? `${variety.rendement_potentiel_min_kg}–${variety.rendement_potentiel_max_kg} kg/ha`
        : "—",
    ],
    [
      "Rendement observé (moy.)",
      variety.rendement_observe_moyen_kg != null
        ? `${variety.rendement_observe_moyen_kg} kg/ha`
        : "—",
    ],
    ["Caractéristiques du grain", variety.caracteristiques_grain || "—"],
    ["Usages alimentaires", variety.usages_alimentaires || "—"],
    ["Exigences pédologiques", variety.exigences_pedologiques || "—"],
    ["Disponibilité des semences", variety.disponibilite_semences || "—"],
    ["Obtenteur", variety.obtenteur || "—"],
    [
      "Année d'homologation",
      variety.annee_homologation ? String(variety.annee_homologation) : "—",
    ],
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/catalogue" className="text-sm text-mil-700 hover:underline">
        ← Retour au catalogue
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-mil-900">{variety.nom_officiel}</h1>
          {variety.noms_locaux && (
            <p className="text-stone-500">Noms locaux : {variety.noms_locaux}</p>
          )}
        </div>
        <div className="flex gap-2">
          <span className="text-sm px-3 py-1 rounded-full bg-mil-100 text-mil-800">
            {STATUT_LABELS[variety.statut] ?? variety.statut}
          </span>
          <span className="text-sm px-3 py-1 rounded-full bg-stone-100 text-stone-600">
            {VALIDATION_LABELS[variety.statut_validation] ?? variety.statut_validation}
          </span>
        </div>
      </div>

      {variety.description && (
        <p className="mt-4 text-stone-700 leading-relaxed">{variety.description}</p>
      )}

      <PhotoGallery photos={photos.map((p) => ({ id: p.id, legende: p.legende }))} />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-mil-900 text-lg">Caractéristiques</h2>
          <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label} className="border-b border-stone-100 pb-2">
                <dt className="text-xs text-stone-400">{label}</dt>
                <dd className="text-sm text-stone-800">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-mil-900 text-lg">Zones d'adaptation</h2>
          {zones.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">
              Aucune zone d'adaptation enregistrée pour cette variété.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {zones.map((z) => (
                <li key={z.id} className="text-sm flex justify-between gap-2">
                  <span>
                    {z.nom} <span className="text-stone-400">({z.region})</span>
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                      z.zone_type === "officielle"
                        ? "bg-leaf-100 text-leaf-700"
                        : z.zone_type === "historique"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {ZONE_TYPE_LABELS[z.zone_type] ?? z.zone_type}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/carte?variete=${variety.id}`}
            className="mt-4 inline-block text-sm text-mil-700 hover:underline"
          >
            Voir sur la carte →
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-500">
        <p>
          <strong className="text-stone-700">Source :</strong> {variety.source || "—"}
        </p>
        <p className="mt-1">
          <strong className="text-stone-700">Dernière mise à jour :</strong>{" "}
          {variety.date_maj}
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          href={`/comparer?ids=${variety.id}`}
          className="px-4 py-2 rounded-lg bg-mil-700 text-white text-sm font-semibold hover:bg-mil-800"
        >
          Comparer cette variété
        </Link>
        <Link
          href="/recommander"
          className="px-4 py-2 rounded-lg border border-stone-300 text-sm font-semibold hover:bg-stone-100"
        >
          Obtenir une recommandation
        </Link>
      </div>
    </div>
  );
}
