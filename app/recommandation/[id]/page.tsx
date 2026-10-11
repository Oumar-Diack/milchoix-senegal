import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecommendation, getCommune, getClimat } from "@/lib/queries";
import { CLASSIFICATION_LABELS, type Classification } from "@/lib/recommendation";
import { pluvioAnnuelle } from "@/lib/isohyetes";
import { FeedbackForm } from "@/components/FeedbackForm";

interface ResultItem {
  variety_id: number;
  nom_officiel: string;
  noms_locaux: string;
  statut: string;
  statut_validation: string;
  precocite: string;
  duree_cycle_jours: number | null;
  besoins_pluvio_min_mm: number | null;
  besoins_pluvio_max_mm: number | null;
  besoins_pluvio_estimes?: boolean;
  tolerance_secheresse: string;
  disponibilite_semences: string;
  rendement_observe_moyen_kg: number | null;
  score: number;
  classification: Classification;
  raisons: { critere: string; message: string; type: string }[];
  confiance: string;
  confiance_raison: string;
}

const BADGE_STYLES: Record<Classification, string> = {
  fortement_recommandee: "bg-leaf-100 text-leaf-700 border-leaf-300",
  adaptee: "bg-emerald-50 text-emerald-700 border-emerald-200",
  envisageable: "bg-amber-50 text-amber-700 border-amber-200",
  non_recommandee: "bg-stone-100 text-stone-500 border-stone-200",
};

const CONF_LABELS: Record<string, string> = {
  elevee: "Confiance élevée",
  moyenne: "Confiance moyenne",
  faible: "Confiance faible",
};

export default async function RecommendationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rec = getRecommendation(Number(id));
  if (!rec) notFound();

  const commune = getCommune(rec.commune_id);
  const climat = getClimat(rec.commune_id, rec.campagne_annee);
  const pluvio = commune ? pluvioAnnuelle(commune.latitude, commune.longitude) : null;
  const results: ResultItem[] = JSON.parse(rec.resultats);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/recommander" className="text-sm text-mil-700 hover:underline">
        ← Nouvelle recommandation
      </Link>

      <div className="mt-2 flex items-start justify-between gap-4">
        <h1 className="text-3xl font-bold text-mil-900">
          Résultats de la recommandation
        </h1>
        <a
          href={`/api/recommandation/${rec.id}/csv`}
          className="px-4 py-2 rounded-lg bg-leaf-600 text-white text-sm font-semibold hover:bg-leaf-700 whitespace-nowrap"
        >
          Exporter en CSV
        </a>
      </div>
      <p className="mt-2 text-stone-600">
        Localité : <strong>{commune?.nom}</strong> ({commune?.departement}, région de{" "}
        {commune?.region}) — Campagne <strong>{rec.campagne_annee}</strong>
      </p>

      {climat ? (
        <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4 text-sm grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-stone-400 text-xs">Cumul pluviométrique</dt>
            <dd className="font-medium">{climat.cumul_pluvio_mm} mm</dd>
          </div>
          <div>
            <dt className="text-stone-400 text-xs">Durée de saison</dt>
            <dd className="font-medium">{climat.duree_saison_jours} jours</dd>
          </div>
          <div>
            <dt className="text-stone-400 text-xs">Séquences sèches</dt>
            <dd className="font-medium">
              {climat.nb_sequences_seches} (max {climat.duree_max_seche_jours} j)
            </dd>
          </div>
          <div>
            <dt className="text-stone-400 text-xs">Prévision saison</dt>
            <dd className="font-medium">{climat.prevision_saison}</dd>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm">
          <p>
            Données climatiques non disponibles pour cette campagne : les résultats reposent
            sur un nombre réduit de critères et la confiance est abaissée.
          </p>
          {pluvio != null && (
            <p className="mt-1 font-medium">
              Pluviométrie annuelle moyenne estimée (isohyètes) : {Math.round(pluvio)} mm.
            </p>
          )}
        </div>
      )}

      <div className="mt-6 space-y-5">
        {results.map((r) => (
          <div
            key={r.variety_id}
            className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 p-5">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-mil-900">{r.nom_officiel}</h2>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full border ${BADGE_STYLES[r.classification]}`}
                  >
                    {CLASSIFICATION_LABELS[r.classification]}
                  </span>
                </div>
                {r.noms_locaux && (
                  <p className="text-xs text-stone-500">Noms locaux : {r.noms_locaux}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-mil-700">{r.score}</p>
                <p className="text-xs text-stone-400">score / 100</p>
              </div>
            </div>

            <div className="p-5 grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-stone-700">
                  Pourquoi ce résultat ?
                </h3>
                <ul className="mt-2 space-y-2">
                  {r.raisons.map((raison, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span
                        className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                          raison.type === "positif"
                            ? "bg-leaf-500"
                            : raison.type === "negatif"
                            ? "bg-red-400"
                            : "bg-stone-300"
                        }`}
                      />
                      <span className="text-stone-700">
                        <strong className="text-stone-800">{raison.critere} :</strong>{" "}
                        {raison.message}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-stone-700">Fiche synthétique</h3>
                <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-stone-400 text-xs">Cycle</dt>
                    <dd>{r.duree_cycle_jours ? `${r.duree_cycle_jours} jours` : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-400 text-xs">Précocité</dt>
                    <dd>{r.precocite || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-400 text-xs">Besoins en eau</dt>
                    <dd>
                      {r.besoins_pluvio_min_mm != null
                        ? `${r.besoins_pluvio_min_mm}–${r.besoins_pluvio_max_mm} mm${r.besoins_pluvio_estimes ? " (estimés)" : ""}`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-stone-400 text-xs">Tolérance sécheresse</dt>
                    <dd>{r.tolerance_secheresse || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-400 text-xs">Semences</dt>
                    <dd>{r.disponibilite_semences || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-400 text-xs">Rendement observé</dt>
                    <dd>
                      {r.rendement_observe_moyen_kg != null
                        ? `${r.rendement_observe_moyen_kg} kg/ha`
                        : "—"}
                    </dd>
                  </div>
                </dl>
                <div className="mt-3 rounded-lg bg-stone-50 p-3 text-xs text-stone-600">
                  <span className="font-semibold text-stone-700">
                    {CONF_LABELS[r.confiance] ?? r.confiance}
                  </span>
                  {" — "}
                  {r.confiance_raison}
                </div>
                <Link
                  href={`/catalogue/${r.variety_id}`}
                  className="mt-3 inline-block text-sm text-mil-700 hover:underline"
                >
                  Voir la fiche complète →
                </Link>
                <FeedbackForm
                  recommendationId={rec.id}
                  varietyId={r.variety_id}
                  kind="pertinence"
                  label="Cette variété est-elle pertinente pour votre situation ?"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-mil-900">Votre avis sur cette recommandation</h2>
        <p className="text-sm text-stone-500 mt-1">
          Aidez-nous à améliorer la qualité des recommandations.
        </p>
        <FeedbackForm
          recommendationId={rec.id}
          varietyId={null}
          kind="comprehension"
          label="Les explications sont-elles compréhensibles ?"
        />
      </div>

      <p className="mt-6 text-xs text-stone-400">
        Avertissement : ces résultats constituent une aide à la décision. Ils ne remplacent
        ni l'expérience du producteur ni l'avis du conseiller agricole, et ne constituent
        pas une garantie de résultat.
      </p>
    </div>
  );
}
