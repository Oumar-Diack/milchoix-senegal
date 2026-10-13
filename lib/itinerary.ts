export interface ItineraireSection {
  titre: string;
  points: string[];
}

export interface ProtectionRow {
  ennemi: string;
  periode: string;
  culturales: string;
  chimiques: string;
  genetiques: string;
}

export const itineraireTechnique: ItineraireSection[] = [
  {
    titre: "Préparation du sol",
    points: [
      "Coupe des arbustes et tiges, mise en tas en bordure de champ pour le compost.",
      "Passage croisé à la houe sine, ou labour au disque ou à la charrue suivi d'un hersage.",
    ],
  },
  {
    titre: "Semis",
    points: [
      "Semences traitées avec 200 g de mélange fongicide–insecticide pour 100 kg de semences.",
      "Semis en sec ou en humide (pluie > 10–20 mm).",
      "Semoir au disque 4 ou 8 trous (avec cache des 4).",
      "Dose : 4 kg de grains/ha (grains de diamètre ≥ 3 mm et poids de 1 000 grains ≥ 9–10 g).",
      "Écartements : 90 cm × 90 cm.",
      "Resemis des poquets manquants quatre jours après la levée.",
    ],
  },
  {
    titre: "Sarclo-binages",
    points: [
      "Premier sarclo-binage : binage mécanique à la houe sine ou occidentale à 7 jours après la levée, puis sarclage manuel à l'hilaire ou à la daba 3 à 5 jours après la phase mécanique.",
      "Deuxième sarclo-binage mécanique 15 jours après le premier.",
      "Troisième sarclo-binage à la demande, surtout en parcelle enherbée ou infestée de striga.",
    ],
  },
  {
    titre: "Démariage",
    points: [
      "Démariage à 3 plants, 10 à 15 jours après la levée.",
      "Démariage à 1 plant en parcelle de production de semences de prébase.",
    ],
  },
  {
    titre: "Fertilisation",
    points: [
      "Engrais de fond : NPK (15-10-10 ou 15-15-15) à la dose de 150 kg/ha, ou 2 t/ha de compost ou de fumier plus 100 kg/ha de phosphate tricalcique avant le hersage (passage croisé).",
      "Engrais de couverture : premier épandage d'urée (50 kg/ha) tout autour des poquets après le démariage, puis deuxième épandage d'urée (50 kg/ha) avant le deuxième sarclo-binage.",
    ],
  },
  {
    titre: "Récolte",
    points: [
      "Récolte à maturité optimale lorsque l'humidité des grains varie de 16 à 20 %.",
      "Dessouchage des pieds.",
      "Coupe des épis ; les épis sont étalés en petits tas sur les tiges.",
      "Mise en bottes de 5 à 10 kg, regroupées en tas dans une aire protégée au champ ou à la ferme.",
      "Séchage sur claies surélevées, tas perpendiculaires aux vents dominants, pour ramener l'humidité à 8–12 % ; durée de 4 à 6 semaines. En cas de prolongement, poudrer à l'insecticide.",
    ],
  },
  {
    titre: "Battage",
    points: [
      "Battage au mortier-pilon (opération traditionnelle suivie de vannage) ou à la batteuse (BS-1000, DAK II de Marot ou BAMBA) : humidité du grain de 13 à 14 %. Ne jamais battre avant la levée du soleil (brume et fraîcheur).",
    ],
  },
  {
    titre: "Stockage",
    points: [
      "Stockage en épis dans des greniers : méthode traditionnelle la plus répandue, avec de faibles pertes dues aux insectes et moisissures.",
      "Stockage en grains en sacs, silos en dur (2 à 5 t), fûts métalliques, magasins ou banques de céréales.",
      "Conditions de bon stockage : grain sec, sain et propre ; structure étanche.",
    ],
  },
];

export const protectionPhytosanitaire: ProtectionRow[] = [
  {
    ennemi: "Mildiou (Sclerospora graminicola)",
    periode: "Tout le cycle",
    culturales: "Destruction des résidus de récolte, arrachage des pieds infectés, labour de fin de cycle",
    chimiques: "Traitement de semences à l'Apron ou tout autre fongicide (métalaxyl)",
    genetiques: "Variétés résistantes",
  },
  {
    ennemi: "Charbon (Tolyposporium penicillariae)",
    periode: "Floraison",
    culturales: "Destruction des résidus de récolte, labour profond, dates optimales de semis, arrachage des pieds infectés, respect de la rotation",
    chimiques: "Traitement de semences au fongicide",
    genetiques: "Variétés résistantes",
  },
  {
    ennemi: "Ergot (Claviceps fusiformis)",
    periode: "Floraison",
    culturales: "Destruction des résidus de récolte, labour profond, dates optimales de semis, arrachage des pieds infectés, respect de la rotation",
    chimiques: "Traitement de semences",
    genetiques: "Variétés résistantes",
  },
  {
    ennemi: "Iules",
    periode: "15–30 j après la 1re pluie",
    culturales: "Couloir de 2 m autour des parcelles",
    chimiques: "Appât de Diallaltox",
    genetiques: "—",
  },
  {
    ennemi: "Chenilles",
    periode: "15–30 j après la 1re pluie",
    culturales: "Couloir de 2 m autour des champs",
    chimiques: "Deltaméthrine ou Endosulfan (800 g m.a. ou 2,5 l/ha)",
    genetiques: "—",
  },
  {
    ennemi: "Chrysomèle (Lema spp.)",
    periode: "10–20 j après la 1re pluie",
    culturales: "—",
    chimiques: "Deltaméthrine ou Endosulfan (800 g m.a. ou 2,5 l/ha)",
    genetiques: "—",
  },
  {
    ennemi: "Foreurs (Acigona ignefusalis et Sesamia calamistis)",
    periode: "Août–septembre",
    culturales: "Destruction des résidus de récolte, labour profond",
    chimiques: "Carbofuran (2 g/poquet) au semis ou Diméthoate (800 g m.a. ou 2,5 l/ha) avant la montaison",
    genetiques: "Variétés résistantes",
  },
  {
    ennemi: "Cantharides",
    periode: "Floraison",
    culturales: "Semis précoce, utilisation de fumée",
    chimiques: "Diméthoate (800 g m.a. ou 2,5 l/ha)",
    genetiques: "—",
  },
  {
    ennemi: "Mineuse des épis (Heliocheilus albipunctella)",
    periode: "Floraison",
    culturales: "Labour de fin de cycle ou de début d'hivernage à sec",
    chimiques: "Diméthoate ou Endosulfan (800 g m.a. ou 2,5 l/ha)",
    genetiques: "Variétés résistantes",
  },
  {
    ennemi: "Striga",
    periode: "Après levée",
    culturales: "Arrachage avant la floraison, apport de fumier, sarclage à 60 jours après levée",
    chimiques: "Herbicide 2,4-D, Trifluraline",
    genetiques: "Variétés résistantes",
  },
];

export const ITINERAIRE_SOURCE =
  "Fiche Technique du Mil (Pennisetum glaucum), ISRA/CNRA Bambey, janvier 2010.";
