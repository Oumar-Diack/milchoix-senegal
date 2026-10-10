import { getCommunes, getAllClimat } from "@/lib/queries";
import { RecommendationForm } from "@/components/RecommendationForm";

export default function RecommanderPage() {
  const communes = getCommunes();
  const climats = getAllClimat();
  const years = Array.from(new Set(climats.map((c) => c.annee))).sort((a, b) => b - a);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-mil-900">Moteur de recommandation</h1>
      <p className="mt-2 text-stone-600">
        Renseignez votre localité et la campagne agricole pour obtenir une sélection
        classée de variétés de mil, accompagnée d'explications et du niveau de confiance.
      </p>

      <RecommendationForm communes={communes} years={years} />
    </div>
  );
}
