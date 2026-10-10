export default function AProposPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-mil-900">À propos de MilChoix Sénégal</h1>
      <p className="mt-4 text-stone-700 leading-relaxed">
        MilChoix Sénégal est un projet de plateforme numérique d'information, de
        cartographie et d'aide au choix variétal du mil. Son objectif est d'aider
        les producteurs, les organisations paysannes, les conseillers agricoles et
        les autres acteurs du secteur à identifier les variétés potentiellement les
        mieux adaptées à une localité, à une campagne agricole et à des besoins
        particuliers.
      </p>

      <h2 className="mt-10 text-xl font-bold text-mil-900">Approche de recommandation</h2>
      <p className="mt-3 text-stone-700 leading-relaxed">
        Le moteur repose sur une démarche progressive privilégiant la simplicité,
        l'explicabilité et la validation scientifique.
      </p>
      <ol className="mt-4 space-y-3 text-stone-700">
        <li className="flex gap-3">
          <span className="text-mil-600 font-bold">Phase 1.</span>
          <span>
            Des <strong>règles agronomiques explicites</strong> : compatibilité du
            cycle avec la durée probable de la saison, besoins pluviométriques face
            aux précipitations prévues, tolérance à la sécheresse en cas de risque de
            séquences sèches, type de sol, date de semis et disponibilité des
            semences.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-mil-600 font-bold">Phase 2.</span>
          <span>
            Un <strong>système multicritère</strong> combinant plusieurs dimensions
            pondérées, validé par des spécialistes et ajusté à la lumière des
            résultats observés.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-mil-600 font-bold">Phase 3.</span>
          <span>
            L'<strong>apprentissage automatique</strong>, envisagé ultérieurement
            lorsque des données de terrain suffisamment fiables et géolocalisées
            seront disponibles.
          </span>
        </li>
      </ol>

      <h2 className="mt-10 text-xl font-bold text-mil-900">Principes fondamentaux</h2>
      <ul className="mt-4 space-y-3 text-stone-700">
        <li className="flex gap-3">
          <span className="text-leaf-600 font-bold">✓</span>
          <span>
            <strong>Transparence</strong> : chaque recommandation explique les
            critères utilisés, les incertitudes et le niveau de confiance.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-leaf-600 font-bold">✓</span>
          <span>
            <strong>Traçabilité</strong> : chaque information est accompagnée de sa
            source et de sa date de mise à jour.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-leaf-600 font-bold">✓</span>
          <span>
            <strong>Distinction des zones</strong> : zones officielles, historiques
            et potentielles sont clairement différenciées.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-leaf-600 font-bold">✓</span>
          <span>
            <strong>Complémentarité</strong> : la plateforme complète l'expérience
            des producteurs et l'avis des conseillers, sans les remplacer.
          </span>
        </li>
      </ul>

      <div className="mt-10 rounded-xl bg-amber-50 border border-amber-200 p-5 text-sm text-amber-800">
        <p className="font-semibold">Avertissement important</p>
        <p className="mt-1">
          Cette version de démonstration utilise des données fictives réalistes à des
          fins de test. Les recommandations ne constituent pas une garantie de
          résultat et doivent toujours être examinées en tenant compte des conditions
          réelles de la parcelle et des conseils des professionnels compétents.
        </p>
      </div>
    </div>
  );
}
