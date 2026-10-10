import Link from "next/link";
import { getVarieties, getCommunes } from "@/lib/queries";

export default function HomePage() {
  const varietes = getVarieties();
  const communes = getCommunes();

  return (
    <div>
      <section className="bg-gradient-to-br from-mil-800 to-mil-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight max-w-3xl">
            La bonne variété de mil, au bon endroit, pour la bonne saison.
          </h1>
          <p className="mt-5 max-w-2xl text-mil-100 text-lg">
            MilChoix Sénégal est une plateforme d'information, de cartographie
            et d'aide au choix variétal du mil. Elle aide producteurs,
            organisations paysannes et conseillers agricoles à identifier les
            variétés potentiellement les mieux adaptées à leur localité et à la
            campagne agricole.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/recommander"
              className="px-5 py-3 rounded-lg bg-mil-400 text-mil-950 font-semibold hover:bg-mil-300 transition"
            >
              Obtenir une recommandation
            </Link>
            <Link
              href="/catalogue"
              className="px-5 py-3 rounded-lg border border-white/30 hover:bg-white/10 transition"
            >
              Explorer le catalogue
            </Link>
            <Link
              href="/carte"
              className="px-5 py-3 rounded-lg border border-white/30 hover:bg-white/10 transition"
            >
              Voir la carte variétale
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid sm:grid-cols-3 gap-6 text-center">
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-4xl font-extrabold text-mil-700">
              {varietes.length}
            </p>
            <p className="mt-1 text-stone-600">variétés référencées</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-4xl font-extrabold text-mil-700">
              {communes.length}
            </p>
            <p className="mt-1 text-stone-600">localités couvertes</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-4xl font-extrabold text-mil-700">4</p>
            <p className="mt-1 text-stone-600">
              fonctions : informer, cartographier, comparer, recommander
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white border-y border-stone-200">
        <div className="mx-auto max-w-6xl px-4 py-16 grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-mil-900">
              Quatre fonctions intégrées
            </h2>
            <ul className="mt-4 space-y-3 text-stone-700">
              <li className="flex gap-3">
                <span className="text-mil-600 font-bold">1.</span>
                <span>
                  <strong>Informer</strong> : un catalogue structuré des variétés
                  homologuées et leurs caractéristiques.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-mil-600 font-bold">2.</span>
                <span>
                  <strong>Cartographier</strong> : une carte variétale
                  intelligente, interactive et évolutive.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-mil-600 font-bold">3.</span>
                <span>
                  <strong>Comparer</strong> : des outils pour examiner plusieurs
                  variétés côte à côte.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-mil-600 font-bold">4.</span>
                <span>
                  <strong>Recommander</strong> : un moteur de recommandation
                  agronomique explicable.
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-mil-900">
              Transparence et explicabilité
            </h2>
            <p className="mt-4 text-stone-700 leading-relaxed">
              Chaque recommandation explique les critères utilisés, les données
              climatiques prises en compte, les incertitudes et le niveau de
              confiance. La plateforme distingue clairement les zones
              d'adaptation officielles, historiques et potentielles.
            </p>
            <p className="mt-4 text-stone-700 leading-relaxed">
              Les résultats constituent une aide complémentaire à la décision :
              ils ne remplacent ni l'expérience du producteur ni l'avis du
              conseiller agricole.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
