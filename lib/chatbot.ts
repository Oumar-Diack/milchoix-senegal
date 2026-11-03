import {
  getCommunes,
  getVarieties,
  getClimatNormal,
  getCommuneAdaptationZones,
  getVarietyAdaptation,
  type ClimatNormal,
  type ZoneAdaptationType,
} from "./queries";
import { scoreVariety, sortResults, CLASSIFICATION_LABELS } from "./recommendation";
import { STATUT_LABELS } from "./labels";
import type { Variety, Commune, Climat, Preferences } from "./types";
import { normalize, hasPhrase, hasAnyPhrase, tokenize } from "./chat-text";
import { detectConcepts, hasConcept, type Concept } from "./chat-lexicon";
import {
  sanitizeContext,
  isFollowUp,
  type ChatContext,
  type ChatField,
  type ChatIntent,
  type Precocity,
  type Soil,
  type Usage,
} from "./chat-context";
import { searchKnowledge } from "./chat-knowledge";
import { soilsCompatible } from "./soil";

export type ChatLanguage = "fr" | "en" | "wo";

const STRINGS: Record<ChatLanguage, Record<string, string>> = {
  fr: {
    greeting:
      "Bonjour ! Je suis l'assistant de MilChoix Sénégal. Je réponds à partir des données de la plateforme : variétés, zones d'adaptation, climat et itinéraire technique. Posez-moi une question, par exemple « quelles variétés pour Kaolack ? », « quel est le cycle de Souna 3 ? » ou « comment lutter contre le striga ? ».",
    whatIs:
      "MilChoix Sénégal est une plateforme d'information, de cartographie et d'aide au choix variétal du mil. Elle aide les producteurs, les organisations paysannes et les conseillers agricoles à identifier les variétés les mieux adaptées à une localité et à une campagne agricole. Elle réunit quatre fonctions : informer, cartographier, comparer et recommander.",
    howRecommend:
      "Pour obtenir une recommandation : 1) ouvrez la page « Recommander », 2) renseignez votre localité et la campagne agricole, 3) précisez (facultatif) la date de semis, le type de sol, vos préférences. Le système vous proposera une liste classée de variétés avec des explications et le niveau de confiance.",
    criteria:
      "Le moteur compare notamment : la durée du cycle de la variété face à la durée probable de la saison, les besoins en eau face aux précipitations prévues, la tolérance à la sécheresse en cas de risque de séquences sèches, le type de sol, la date de semis et la disponibilité des semences. Chaque recommandation explique les critères utilisés.",
    disclaimer:
      "Attention : les recommandations constituent une aide à la décision. Elles ne remplacent ni l'expérience du producteur ni l'avis du conseiller agricole, et ne constituent pas une garantie de résultat.",
    thanks: "Avec plaisir ! N'hésitez pas si vous avez d'autres questions.",
    help: "Je peux : lister les variétés, détailler une variété, croiser plusieurs critères (précocité, sécheresse, zone, semences), indiquer les variétés adaptées à une commune, résumer son climat, recommander les trois meilleures variétés, comparer deux variétés, expliquer un point de l'itinéraire technique ou de la protection phytosanitaire. Exemples : « variétés précoces adaptées à Louga », « cycle de Souna 3 », « climat à Thiès », « comment lutter contre le striga ? ».",
    fallback:
      "Je ne dispose pas de cette information dans la base MilChoix Sénégal. Je réponds uniquement à partir des données de la plateforme (catalogue variétal, zones d'adaptation, climat, itinéraire technique). Essayez par exemple : « quelles variétés pour Kaolack ? », « cycle de Souna 3 », « climat à Thiès ».",
    noVarieties: "Je n'ai pas trouvé de variété correspondant à votre demande dans la base.",
    noSoil:
      "Les exigences de sol ne sont pas renseignées dans la base pour les variétés : je ne peux pas filtrer sur ce critère.",
    varietiesIntro: "Voici les variétés référencées qui correspondent (nom — cycle) :",
    noLocalities:
      "Je ne trouve pas cette localité dans la base MilChoix Sénégal. Communes couvertes :",
    disambiguate:
      "Plusieurs variétés correspondent à ce nom. Précisez laquelle :",
    specifyCommune:
      "Précisez une commune pour obtenir une recommandation (par exemple Kaolack, Thiès ou Louga).",
  },
  en: {
    greeting:
      "Hello! I'm the MilChoix Sénégal assistant. I answer from the platform data: varieties, adaptation zones, climate and technical itinerary. Ask me for example « which varieties for Kaolack? », « what is the cycle of Souna 3? » or « how do I control striga? ».",
    whatIs:
      "MilChoix Sénégal is a digital platform for information, mapping and decision support on millet variety choice. It helps farmers, producer organizations and extension agents identify the varieties best suited to a locality and a cropping season. It combines four functions: inform, map, compare and recommend.",
    howRecommend:
      "To get a recommendation: 1) open the « Recommend » page, 2) enter your locality and cropping season, 3) optionally add sowing date, soil type and preferences. The system returns a ranked list of varieties with explanations and a confidence level.",
    criteria:
      "The engine compares: variety cycle length vs expected season length, water requirements vs expected rainfall, drought tolerance vs risk of dry spells, soil type, sowing date and seed availability. Each recommendation explains the criteria used.",
    disclaimer:
      "Note: recommendations are decision support only. They do not replace farmer experience or extension advice, and are not a guarantee of results.",
    thanks: "You're welcome! Feel free to ask more questions.",
    help: "I can: list varieties, detail a variety, combine several criteria (earliness, drought, zone, seed availability), show which varieties suit a commune, summarise its climate, recommend the top three varieties, compare two varieties, or explain a step of the technical itinerary or crop protection. Examples: « early varieties suited to Louga », « cycle of Souna 3 », « climate in Thiès », « how do I control striga? ».",
    fallback:
      "I don't have this information in the MilChoix Sénégal database. I only answer from the platform data (variety catalogue, adaptation zones, climate, technical itinerary). Try for example: « which varieties for Kaolack? », « cycle of Souna 3 », « climate in Thiès ».",
    noVarieties: "I couldn't find a matching variety in the database.",
    noSoil:
      "Soil requirements are not recorded in the database for the varieties: I can't filter on this criterion.",
    varietiesIntro: "Here are the matching referenced varieties (name — cycle):",
    noLocalities:
      "I can't find this locality in the MilChoix Sénégal database. Covered communes:",
    disambiguate: "Several varieties match this name. Please specify which one:",
    specifyCommune:
      "Please specify a commune to get a recommendation (for example Kaolack, Thiès or Louga).",
  },
  wo: {
    greeting:
      "Salaam aleekum ! Man ngi tudd MilChoix Sénégal. Mën naa laa jox xibaar ci xeetu dugub yi, ci goxi yiy tàmbali, ci klimaa bi ak ci itineraire technique bi. Laaj ma misaal : « ban xeet yi bëgg ci Kaolack ? » walla « naka la Souna 3 di dox ? ».",
    whatIs:
      "MilChoix Sénégal mooy jumtukaay bu diggital buy jox xibaar, yoon-wax ak ndimbal ngir tànn xeetu dugub. Mu ngi dimbali ndaw-yi, mbootaay-yi ak ay tëmmkat yu werseg ngir gis xeetu dugub yu bëgg ci seen dëkkuwaay ak seen atum mbey.",
    howRecommend:
      "Ngir am sa tànn : 1) ubbil xët wi tudd « Recommander », 2) bindal sa dëkkuwaay ak atum mbey bi, 3) (manees naa) yokk bésu liir, xeetu suuf ak li ngay bëgg. Sistam bi dina la jox xeetu dugub yuñu natt, ak leeral bi ak ngoorug koolute bi.",
    criteria:
      "Sistam bi dafay nattal : guddig aji sa xeetu dugub ak guddig waxtu wiy naw, lu mu soxla ci ndox ak taw bi ñu tëgg, muñam ci góor-taw, xeetu suuf, bésu liir ak jëm-kanamug sumbi (sémences).",
    disclaimer:
      "Xoolal : tànni yi day defar ngir ndimbal rekk. Ñu nanguul gëm-gëm mu gën ndaw-yi, ak ay téere yu tëmmkat yi, te ñu nanguul njàngum jéego.",
    thanks: "Jërëjëf ! Bu amee laaj yu wuute, laaj ma.",
    help: "Mën naa : lim xeetu dugub yi, leeral benn xeet, boole ay kritèr (précocité, sécheresse, gox, semences), wax ban xeet yi bëgg ci benn dëkkuwaay, wax ci klimaa bi, tànn ñatti xeet yu gën, seetlé ñaari xeet walla leeral itineraire technique bi. Misal : « xeet yu gaaw yu bëgg ci Louga », « naka la Souna 3 di dox », « klimaa ci Thiès ».",
    fallback:
      "Amuma xibaar bi ci koppar MilChoix Sénégal. Damaa di tontu rek ak xibaar yi nekk ci jumtukaay bi (catalogue variétal, goxi yiy tàmbali, klimaa, itineraire technique). Jéemal misaal : « ban xeet yi ngir Kaolack ? », « naka la Souna 3 di dox ? ».",
    noVarieties: "Gisuma benn xeetu dugub bu tëggal ak la nga wax ci koppar bi.",
    noSoil:
      "Xibaar ci xeetu suuf amul ci koppar bi ngir xeetu dugub yi : manuma seetlé ak kritèr bii.",
    varietiesIntro: "Nii ñoo xeetu dugub yi ñu gis (turu — guddig aji) :",
    noLocalities:
      "Gisuma dëkkuwaay bii ci koppar MilChoix Sénégal. Dëkkuwaay yi ñu am :",
    disambiguate: "Ëpp xeet ñoo tëggal ak tur bii. Leeral ban la nga bëgg :",
    specifyCommune:
      "Leeral benn dëkkuwaay ngir am tànn (misaal Kaolack, Thiès walla Louga).",
  },
};

// Libellés des champs de données. Le wolof réutilise les libellés français :
// les termes techniques agricoles (cycle, pluviométrie, rendement) n'ont pas
// de traduction stabilisée et une traduction approximative induirait en erreur.
const FR_DATA = {
  cycle: "Cycle",
  days: "jours",
  maturity: "Précocité",
  water: "Besoins en eau",
  drought: "Tolérance à la sécheresse",
  yieldPotential: "Rendement potentiel",
  yieldObserved: "Rendement observé moyen",
  diseases: "Maladies",
  pests: "Ravageurs",
  seeds: "Semences",
  adaptedIn: "Communes adaptées",
  marginalIn: "Communes marginales",
  zoneAdapted: "zone adaptée",
  zoneMarginal: "zone marginale",
  zoneNotAdapted: "zone non adaptée",
  climate: "Climat de",
  rainfall: "Cumul pluviométrique moyen",
  rainfallUnit: "mm/an",
  season: "Durée moyenne de saison",
  dryMonths: "Mois secs en cœur de saison",
  temperature: "Température moyenne",
  period: "normale",
  years: "ans",
  adaptedVarieties: "Variétés adaptées",
  marginalVarieties: "Variétés marginales",
  regionLabel: "région de",
  departmentLabel: "département de",
  noneAdapted: "Aucune variété listée comme adaptée dans cette commune.",
  recommendation: "Recommandation pour",
  score: "score",
  mainReason: "Critère principal",
  source: "Source : base MilChoix Sénégal — catalogue variétal et zones d'adaptation.",
  sourceClimate:
    "Source : base climatique MilChoix Sénégal — WorldClim (1951-2024).",
  noClimate: "Données climatiques indisponibles pour cette commune.",
  unknown: "Je ne dispose pas de cette information dans la base MilChoix Sénégal.",
  notProvided: "non renseigné",
  andOthers: "autres",
  typeLabel: "Type",
  grain: "Grain",
  usageLabel: "Usages alimentaires",
  usageFilter: "usages",
  inferredFromDescriptions: "déduits des descriptions",
  soilLabel: "sol",
  varietiesWithoutData: "variété(s) sans donnée, exclue(s) du filtre",
  zoneLabel: "Zone",
  criteriaApplied: "Critères appliqués",
  criteriaIgnored: "Critères ignorés (non renseignés en base)",
  listHeader: "Variétés correspondant à vos critères",
  noMatch: "Aucune variété ne réunit tous ces critères.",
  amongAdapted: "Variétés adaptées à",
  adaptationLabel: "adaptation",
  precocityFilter: "précocité",
  droughtFilter: "tolérance à la sécheresse",
  seedFilter: "semences disponibles",
  cycleFilter: "cycle maximum",
  protectionLabel: "protection phytosanitaire",
  descriptionLabel: "Description",
  notAvailableCriteria: "critère non renseigné en base, ignoré",
};

const EN_DATA: typeof FR_DATA = {
  cycle: "Cycle",
  days: "days",
  maturity: "Maturity",
  water: "Water requirement",
  drought: "Drought tolerance",
  yieldPotential: "Potential yield",
  yieldObserved: "Mean observed yield",
  diseases: "Diseases",
  pests: "Pests",
  seeds: "Seed availability",
  adaptedIn: "Adapted communes",
  marginalIn: "Marginal communes",
  zoneAdapted: "adapted zone",
  zoneMarginal: "marginal zone",
  zoneNotAdapted: "not adapted zone",
  climate: "Climate of",
  rainfall: "Mean annual rainfall",
  rainfallUnit: "mm/year",
  season: "Mean season length",
  dryMonths: "Dry months in mid-season",
  temperature: "Mean temperature",
  period: "normal",
  years: "years",
  adaptedVarieties: "Adapted varieties",
  marginalVarieties: "Marginal varieties",
  regionLabel: "region of",
  departmentLabel: "department of",
  noneAdapted: "No variety is listed as adapted in this commune.",
  recommendation: "Recommendation for",
  score: "score",
  mainReason: "Main criterion",
  source: "Source: MilChoix Sénégal database — variety catalogue and adaptation zones.",
  sourceClimate:
    "Source: MilChoix Sénégal climate database — WorldClim (1951-2024).",
  noClimate: "No climate data available for this commune.",
  unknown: "I don't have this information in the MilChoix Sénégal database.",
  notProvided: "not provided",
  andOthers: "others",
  typeLabel: "Type",
  grain: "Grain",
  usageLabel: "Food uses",
  usageFilter: "uses",
  inferredFromDescriptions: "inferred from descriptions",
  soilLabel: "soil",
  varietiesWithoutData: "variety(ies) without data, excluded from the filter",
  zoneLabel: "Zone",
  criteriaApplied: "Criteria applied",
  criteriaIgnored: "Criteria ignored (not recorded in the database)",
  listHeader: "Varieties matching your criteria",
  noMatch: "No variety meets all these criteria.",
  amongAdapted: "Varieties adapted to",
  adaptationLabel: "adaptation",
  precocityFilter: "earliness",
  droughtFilter: "drought tolerance",
  seedFilter: "seed availability",
  cycleFilter: "maximum cycle",
  protectionLabel: "crop protection",
  descriptionLabel: "Description",
  notAvailableCriteria: "criterion not recorded, ignored",
};

const DATA_LABELS: Record<ChatLanguage, typeof FR_DATA> = {
  fr: FR_DATA,
  en: EN_DATA,
  wo: FR_DATA,
};

const ZONE_LABELS: Record<ChatLanguage, Record<ZoneAdaptationType, string>> = {
  fr: {
    adaptee: FR_DATA.zoneAdapted,
    marginale: FR_DATA.zoneMarginal,
    non_adaptee: FR_DATA.zoneNotAdapted,
  },
  en: {
    adaptee: EN_DATA.zoneAdapted,
    marginale: EN_DATA.zoneMarginal,
    non_adaptee: EN_DATA.zoneNotAdapted,
  },
  wo: {
    adaptee: FR_DATA.zoneAdapted,
    marginale: FR_DATA.zoneMarginal,
    non_adaptee: FR_DATA.zoneNotAdapted,
  },
};

function includesAny(text: string, keywords: string[]): boolean {
  return hasAnyPhrase(text, keywords);
}

function fmt(value: number | null, lang: ChatLanguage, digits = 0): string {
  if (value == null) return "—";
  return new Intl.NumberFormat(lang === "en" ? "en-US" : "fr-FR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value);
}

function shortList(items: string[], max: number, lang: ChatLanguage): string {
  if (items.length <= max) return items.join(", ");
  const rest = items.length - max;
  return `${items.slice(0, max).join(", ")} (+${rest} ${DATA_LABELS[lang].andOthers})`;
}

function capitalize(text: string): string {
  return text.length ? text[0].toUpperCase() + text.slice(1) : text;
}

// --- Reconnaissance des entités -------------------------------------------

function varietyAliases(variety: Variety): string[] {
  const aliases = new Set<string>();
  aliases.add(variety.nom_officiel);

  const withoutParens = variety.nom_officiel.replace(/\([^)]*\)/g, " ").trim();
  if (withoutParens) aliases.add(withoutParens);

  for (const match of variety.nom_officiel.matchAll(/\(([^)]+)\)/g)) {
    aliases.add(match[1].trim());
    for (const part of match[1].split(/[×x/]/)) aliases.add(part.trim());
  }

  for (const alias of variety.noms_locaux.split(/[,;/]/)) aliases.add(alias.trim());

  return [...aliases].filter((alias) => normalize(alias).length >= 3);
}

// 1) correspondance exacte par mots entiers ; 2) correspondance compacte
// (« SL 28 » → « sl28 ») ; 3) seulement si rien n'a été trouvé, tolérance de
// faute (« kaolak », « souna3 »). Les alias longs l'emportent sur les courts.
function findVarieties(text: string, varieties: Variety[]): Variety[] {
  const normalized = normalize(text);
  const compact = normalized.replace(/ /g, "");
  const scored: { variety: Variety; length: number }[] = [];

  for (const variety of varieties) {
    let best = 0;
    for (const alias of varietyAliases(variety)) {
      const normalizedAlias = normalize(alias);
      if (hasPhrase(normalized, normalizedAlias)) {
        best = Math.max(best, normalizedAlias.length);
      } else if (compact.includes(normalizedAlias.replace(/ /g, ""))) {
        best = Math.max(best, normalizedAlias.length);
      }
    }
    if (best > 0) scored.push({ variety, length: best });
  }

  if (scored.length === 0) {
    for (const variety of varieties) {
      let best = 0;
      for (const alias of varietyAliases(variety)) {
        const normalizedAlias = normalize(alias);
        if (normalizedAlias.length < 5) continue;
        if (fuzzyAliasMatch(normalized, normalizedAlias)) {
          best = Math.max(best, normalizedAlias.length);
        }
      }
      if (best > 0) scored.push({ variety, length: best });
    }
  }

  scored.sort((a, b) => b.length - a.length);

  const seen = new Set<number>();
  const result: Variety[] = [];
  for (const entry of scored) {
    if (seen.has(entry.variety.id)) continue;
    seen.add(entry.variety.id);
    result.push(entry.variety);
  }
  return result;
}

// Import local pour éviter d'exposer toute la mécanique de chat-text ici.
function fuzzyAliasMatch(normalizedText: string, alias: string): boolean {
  const target = alias.replace(/ /g, "");
  const words = normalizedText.split(" ");
  const max = target.length <= 8 ? 1 : 2;
  for (let start = 0; start < words.length; start += 1) {
    let window = "";
    for (let size = 1; size <= 3 && start + size <= words.length; size += 1) {
      window += words[start + size - 1];
      if (Math.abs(window.length - target.length) > max) continue;
      if (window[0] !== target[0]) continue;
      let distance = 0;
      let i = 0;
      let j = 0;
      // Programmation dynamique complète mais bornée : les alias sont courts.
      const rows = target.length + 1;
      const cols = window.length + 1;
      const matrix = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
      for (i = 0; i < rows; i += 1) matrix[i][0] = i;
      for (j = 0; j < cols; j += 1) matrix[0][j] = j;
      for (i = 1; i < rows; i += 1) {
        for (j = 1; j < cols; j += 1) {
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + (target[i - 1] === window[j - 1] ? 0 : 1)
          );
        }
      }
      distance = matrix[rows - 1][cols - 1];
      if (distance <= max && distance / target.length <= 0.25) return true;
    }
  }
  return false;
}

function findCommune(text: string, communes: Commune[]): Commune | null {
  const normalized = normalize(text);
  const compact = normalized.replace(/ /g, "");
  let best: { commune: Commune; length: number } | null = null;

  for (const commune of communes) {
    const name = normalize(commune.nom);
    if (name.length < 3) continue;
    if (hasPhrase(normalized, name) || compact.includes(name.replace(/ /g, ""))) {
      if (!best || name.length > best.length) best = { commune, length: name.length };
    }
  }
  if (best) return best.commune;

  for (const commune of communes) {
    const name = normalize(commune.nom);
    if (name.length < 5) continue;
    if (fuzzyAliasMatch(normalized, name)) {
      if (!best || name.length > best.length) best = { commune, length: name.length };
    }
  }
  return best?.commune ?? null;
}

// Repère un nom de lieu introduit par une préposition (« pour Kaolack »,
// « à Thiès ») afin de pouvoir dire explicitement qu'il est absent de la base,
// au lieu de répondre à côté de la question.
function extractLocalityCandidate(text: string): string | null {
  const match = text.match(
    /\b(?:pour|dans|à|a|for|in)\s+(?:(?:le|la|les|l'|the)\s+)?([A-ZÀ-ÖØ-Þ][\w'’-]*(?:\s+[A-ZÀ-ÖØ-Þ][\w'’-]*)*)/
  );
  return match ? match[1].trim() : null;
}

// --- Réponses fondées sur les données -------------------------------------

function climatLines(normal: ClimatNormal, lang: ChatLanguage): string[] {
  const L = DATA_LABELS[lang];
  const lines: string[] = [];
  if (normal.cumul_mm != null) {
    lines.push(
      `• ${L.rainfall} : ${fmt(Math.round(normal.cumul_mm), lang)} ${L.rainfallUnit}`
    );
  }
  if (normal.saison_jours != null) {
    lines.push(`• ${L.season} : ${fmt(Math.round(normal.saison_jours), lang)} ${L.days}`);
  }
  if (normal.mois_secs != null) {
    lines.push(`• ${L.dryMonths} : ${fmt(Math.round(normal.mois_secs), lang)}`);
  }
  if (normal.temperature_c != null) {
    lines.push(`• ${L.temperature} : ${fmt(normal.temperature_c, lang, 1)} °C`);
  }
  return lines;
}

function normalPeriod(normal: ClimatNormal, lang: ChatLanguage): string {
  const L = DATA_LABELS[lang];
  return `${L.period} ${normal.annee_debut}-${normal.annee_fin}, ${normal.nb_annees} ${L.years}`;
}

function cycleLabel(variety: Variety, lang: ChatLanguage): string {
  return variety.duree_cycle_jours
    ? `${variety.duree_cycle_jours} ${DATA_LABELS[lang].days}`
    : DATA_LABELS[lang].notProvided;
}

function waterLabel(variety: Variety, lang: ChatLanguage): string {
  const min = variety.besoins_pluvio_min_mm;
  const max = variety.besoins_pluvio_max_mm;
  if (min == null || max == null) return DATA_LABELS[lang].notProvided;
  return min === max ? `${min} mm` : `${min}–${max} mm`;
}

function yieldLabel(variety: Variety): string {
  if (variety.rendement_potentiel_max_kg == null) return "—";
  const min = variety.rendement_potentiel_min_kg;
  const max = variety.rendement_potentiel_max_kg;
  return `${min != null && min !== max ? `${min}–${max}` : `${max}`} kg/ha`;
}

function varietyDescription(variety: Variety, lang: ChatLanguage): string {
  const L = DATA_LABELS[lang];
  const lines: string[] = [`${variety.nom_officiel} — ${L.descriptionLabel}`];

  lines.push(variety.description || L.notProvided);
  if (variety.type_mil) lines.push(`• ${L.typeLabel} : ${variety.type_mil}`);
  if (variety.caracteristiques_grain) {
    lines.push(`• ${L.grain} : ${variety.caracteristiques_grain}`);
  }
  if (variety.usages_alimentaires) {
    lines.push(`• ${L.usageLabel} : ${variety.usages_alimentaires}`);
  }

  lines.push(L.source);
  return lines.join("\n");
}

function varietyDetails(variety: Variety, lang: ChatLanguage): string {
  const L = DATA_LABELS[lang];
  const status = STATUT_LABELS[variety.statut] ?? variety.statut;
  const breeder = [variety.obtenteur, variety.annee_homologation]
    .filter((value) => value != null && value !== "")
    .join(", ");

  const lines: string[] = [
    `${variety.nom_officiel} — ${status}${breeder ? ` (${breeder})` : ""}`,
  ];

  if (variety.duree_cycle_jours) {
    lines.push(`• ${L.cycle} : ${variety.duree_cycle_jours} ${L.days}`);
  }
  if (variety.precocite) {
    lines.push(`• ${L.maturity} : ${precocityValue(variety.precocite, lang)}`);
  }
  if (variety.besoins_pluvio_min_mm != null && variety.besoins_pluvio_max_mm != null) {
    lines.push(`• ${L.water} : ${waterLabel(variety, lang)}`);
  }
  if (variety.tolerance_secheresse) {
    lines.push(`• ${L.drought} : ${variety.tolerance_secheresse}`);
  }
  if (variety.rendement_potentiel_max_kg != null) {
    lines.push(`• ${L.yieldPotential} : ${yieldLabel(variety)}`);
  }
  if (variety.resistances_maladies) {
    lines.push(`• ${L.diseases} : ${variety.resistances_maladies}`);
  }
  if (variety.disponibilite_semences) {
    lines.push(`• ${L.seeds} : ${variety.disponibilite_semences}`);
  }
  if (variety.description) {
    lines.push(`• ${L.descriptionLabel} : ${variety.description}`);
  }

  const adaptation = getVarietyAdaptation(variety.id);
  if (adaptation?.adaptees.length) {
    lines.push(
      `• ${L.adaptedIn} (${adaptation.adaptees.length}) : ${shortList(
        adaptation.adaptees,
        8,
        lang
      )}`
    );
  }
  if (adaptation?.marginales.length) {
    lines.push(
      `• ${L.marginalIn} (${adaptation.marginales.length}) : ${shortList(
        adaptation.marginales,
        8,
        lang
      )}`
    );
  }

  lines.push(L.source);
  return lines.join("\n");
}

function detectVarietyField(concepts: Set<Concept>): ChatField | null {
  if (hasConcept(concepts, "yield")) return "rendement";
  if (
    hasConcept(concepts, "cycle") ||
    hasConcept(concepts, "precoce") ||
    hasConcept(concepts, "tardif")
  ) {
    return "cycle";
  }
  if (hasConcept(concepts, "water")) return "eau";
  if (hasConcept(concepts, "drought")) return "tolerance";
  if (hasConcept(concepts, "seeds")) return "semences";
  if (hasConcept(concepts, "disease") || hasConcept(concepts, "pest")) return "maladies";
  if (hasConcept(concepts, "usage")) return "usage";
  if (hasConcept(concepts, "description")) return "description";
  return null;
}

// Réponse ciblée sur un seul champ : plus courte, plus précise et strictement
// limitée aux valeurs présentes en base.
function varietyFact(
  variety: Variety,
  field: ChatField,
  lang: ChatLanguage
): string {
  const L = DATA_LABELS[lang];
  const lines: string[] = [`${variety.nom_officiel} :`];

  switch (field) {
    case "cycle":
      lines.push(
        `• ${L.cycle} : ${
          variety.duree_cycle_jours ? `${variety.duree_cycle_jours} ${L.days}` : L.notProvided
        }`
      );
      lines.push(
        `• ${L.maturity} : ${
          variety.precocite ? precocityValue(variety.precocite, lang) : L.notProvided
        }`
      );
      break;
    case "rendement":
      lines.push(`• ${L.yieldPotential} : ${yieldLabel(variety)}`);
      lines.push(
        `• ${L.yieldObserved} : ${
          variety.rendement_observe_moyen_kg != null
            ? `${variety.rendement_observe_moyen_kg} kg/ha`
            : L.notProvided
        }`
      );
      break;
    case "eau":
      lines.push(`• ${L.water} : ${waterLabel(variety, lang)}`);
      break;
    case "tolerance":
      lines.push(`• ${L.drought} : ${variety.tolerance_secheresse || L.notProvided}`);
      break;
    case "semences":
      lines.push(`• ${L.seeds} : ${variety.disponibilite_semences || L.notProvided}`);
      break;
    case "maladies":
      lines.push(`• ${L.diseases} : ${variety.resistances_maladies || L.notProvided}`);
      if (variety.reaction_ravageurs) {
        lines.push(`• ${L.pests} : ${variety.reaction_ravageurs}`);
      }
      break;
    case "usage":
      lines.push(`• ${L.usageLabel} : ${variety.usages_alimentaires || L.notProvided}`);
      if (variety.caracteristiques_grain) {
        lines.push(`• ${L.grain} : ${variety.caracteristiques_grain}`);
      }
      break;
    case "description":
      return varietyDescription(variety, lang);
  }

  lines.push(L.source);
  return lines.join("\n");
}

function varietyCommuneAnswer(
  variety: Variety,
  commune: Commune,
  lang: ChatLanguage,
  field: ChatField | null = null
): string {
  const L = DATA_LABELS[lang];
  const zone = getCommuneAdaptationZones(commune.id).find(
    (entry) => entry.variety_id === variety.id
  );
  const zoneLabel = zone ? ZONE_LABELS[lang][zone.zone_type] : L.zoneNotAdapted;

  const lines: string[] = [`${variety.nom_officiel} — ${commune.nom} : ${zoneLabel}.`];

  if (field === "cycle" || !field) {
    if (variety.duree_cycle_jours) {
      lines.push(`• ${L.cycle} : ${variety.duree_cycle_jours} ${L.days}`);
    }
    if (variety.precocite) {
      lines.push(`• ${L.maturity} : ${precocityValue(variety.precocite, lang)}`);
    }
  }
  if (field === "eau" || !field) {
    if (variety.besoins_pluvio_min_mm != null && variety.besoins_pluvio_max_mm != null) {
      lines.push(`• ${L.water} : ${waterLabel(variety, lang)}`);
    }
  }
  if (field === "tolerance") {
    lines.push(`• ${L.drought} : ${variety.tolerance_secheresse || L.notProvided}`);
  }
  if (field === "rendement") {
    lines.push(`• ${L.yieldPotential} : ${yieldLabel(variety)}`);
  }
  if (field === "semences") {
    lines.push(`• ${L.seeds} : ${variety.disponibilite_semences || L.notProvided}`);
  }
  if (field === "maladies") {
    lines.push(`• ${L.diseases} : ${variety.resistances_maladies || L.notProvided}`);
  }

  const normal = getClimatNormal(commune.id);
  if (normal) {
    lines.push(`${L.climate} ${commune.nom} (${normalPeriod(normal, lang)}) :`);
    lines.push(...climatLines(normal, lang));
    lines.push(L.sourceClimate);
  } else {
    lines.push(L.noClimate);
  }

  return lines.join("\n");
}

function communeOverview(
  commune: Commune,
  varieties: Variety[],
  lang: ChatLanguage
): string {
  const L = DATA_LABELS[lang];
  const byId = new Map(varieties.map((variety) => [variety.id, variety]));
  const zones = getCommuneAdaptationZones(commune.id);

  const adapted = zones
    .filter((zone) => zone.zone_type === "adaptee")
    .map((zone) => byId.get(zone.variety_id)?.nom_officiel)
    .filter((name): name is string => Boolean(name));
  const marginal = zones
    .filter((zone) => zone.zone_type === "marginale")
    .map((zone) => byId.get(zone.variety_id)?.nom_officiel)
    .filter((name): name is string => Boolean(name));

  const lines: string[] = [
    `${commune.nom} — ${L.regionLabel} ${commune.region}, ${L.departmentLabel} ${commune.departement}`,
  ];

  const normal = getClimatNormal(commune.id);
  if (normal) {
    lines.push(`${L.climate} ${commune.nom} (${normalPeriod(normal, lang)}) :`);
    lines.push(...climatLines(normal, lang));
  } else {
    lines.push(L.noClimate);
  }

  if (adapted.length) {
    lines.push(`• ${L.adaptedVarieties} (${adapted.length}) : ${shortList(adapted, 10, lang)}`);
  } else {
    lines.push(`• ${L.noneAdapted}`);
  }
  if (marginal.length) {
    lines.push(
      `• ${L.marginalVarieties} (${marginal.length}) : ${shortList(marginal, 10, lang)}`
    );
  }

  lines.push(L.source);
  return lines.join("\n");
}

function climateAnswer(commune: Commune, lang: ChatLanguage): string {
  const L = DATA_LABELS[lang];
  const normal = getClimatNormal(commune.id);
  if (!normal) return L.noClimate;

  return [
    `${L.climate} ${commune.nom} (${normalPeriod(normal, lang)}) :`,
    ...climatLines(normal, lang),
    L.sourceClimate,
  ].join("\n");
}

function defaultPreferences(campagneAnnee: number): Preferences {
  return {
    campagneAnnee,
    dateSemis: "",
    typeSol: "",
    dureeCycleSouhaitee: "",
    objectifProduction: "",
    preferencesAlimentaires: "",
    accesIntrants: "",
    toleranceSecheresseRecherchee: false,
  };
}

// Convertit une normale climatique en objet Climat utilisable par le moteur de
// recommandation (les champs journaliers ne sont pas disponibles).
function normalToClimat(normal: ClimatNormal): Climat {
  return {
    id: -1,
    commune_id: normal.commune_id,
    annee: normal.annee_fin,
    cumul_pluvio_mm: normal.cumul_mm == null ? null : Math.round(normal.cumul_mm),
    date_debut_saison: null,
    date_fin_saison: null,
    duree_saison_jours:
      normal.saison_jours == null ? null : Math.round(normal.saison_jours),
    nb_sequences_seches: normal.mois_secs == null ? null : Math.round(normal.mois_secs),
    duree_max_seche_jours: null,
    temperature_moyenne_c: normal.temperature_c,
    prevision_saison: `Normale ${normal.annee_debut}-${normal.annee_fin}`,
    source: "WorldClim",
    date_maj: "",
  };
}

function recommendationAnswer(
  commune: Commune,
  varieties: Variety[],
  lang: ChatLanguage
): string {
  const L = DATA_LABELS[lang];
  const normal = getClimatNormal(commune.id);
  if (!normal) return L.noClimate;

  const climat = normalToClimat(normal);
  const prefs = defaultPreferences(normal.annee_fin);
  const results = sortResults(
    varieties
      .map((variety) => scoreVariety(variety, climat, prefs))
      .filter(
        (result) =>
          result.variety.statut !== "en_evaluation" ||
          result.classification !== "non_recommandee"
      )
  );
  const top = results.slice(0, 3);

  const lines: string[] = [
    `${L.recommendation} ${commune.nom} (${normalPeriod(normal, lang)}) :`,
  ];

  top.forEach((result, index) => {
    lines.push(
      `${index + 1}. ${result.variety.nom_officiel} — ${
        CLASSIFICATION_LABELS[result.classification]
      } (${L.score} ${result.score}/100)`
    );
  });

  const main = top[0]?.raisons.find((raison) => raison.type === "positif") ?? top[0]?.raisons[0];
  if (main) {
    lines.push(`• ${L.mainReason} : ${main.message}`);
  }

  lines.push(L.source);
  return lines.join("\n");
}

function compareRow(label: string, first: string, second: string): string {
  return `• ${label} : ${first} | ${second}`;
}

function compareVarieties(
  first: Variety,
  second: Variety,
  lang: ChatLanguage,
  commune: Commune | null = null
): string {
  const L = DATA_LABELS[lang];
  const lines: string[] = [`${first.nom_officiel} vs ${second.nom_officiel} :`];

  if (commune) {
    const zones = getCommuneAdaptationZones(commune.id);
    const zoneOf = (id: number) => {
      const zone = zones.find((entry) => entry.variety_id === id);
      return zone ? ZONE_LABELS[lang][zone.zone_type] : L.zoneNotAdapted;
    };
    lines.push(`• ${L.zoneLabel} (${commune.nom}) : ${zoneOf(first.id)} | ${zoneOf(second.id)}`);
  }

  lines.push(
    compareRow(
      L.cycle,
      first.duree_cycle_jours ? `${first.duree_cycle_jours} ${L.days}` : "—",
      second.duree_cycle_jours ? `${second.duree_cycle_jours} ${L.days}` : "—"
    )
  );
  lines.push(
    compareRow(
      L.maturity,
      first.precocite ? precocityValue(first.precocite, lang) : "—",
      second.precocite ? precocityValue(second.precocite, lang) : "—"
    )
  );
  lines.push(
    compareRow(L.water, waterLabel(first, lang), waterLabel(second, lang))
  );
  lines.push(
    compareRow(
      L.drought,
      first.tolerance_secheresse || "—",
      second.tolerance_secheresse || "—"
    )
  );
  lines.push(
    compareRow(L.yieldPotential, yieldLabel(first), yieldLabel(second))
  );

  if (commune) {
    const normal = getClimatNormal(commune.id);
    if (normal) {
      lines.push(`${L.climate} ${commune.nom} (${normalPeriod(normal, lang)}) :`);
      lines.push(...climatLines(normal, lang));
      lines.push(L.sourceClimate);
    }
  }

  lines.push(L.source);
  return lines.join("\n");
}

// --- Analyse de la question ------------------------------------------------

interface ParsedQuery {
  concepts: Set<Concept>;
  varieties: Variety[];
  commune: Commune | null;
  field: ChatField | null;
  precocite: Precocity | null;
  tolerance: boolean;
  maxCycle: number | null;
  soil: Soil | null;
  usage: Usage | null;
  marginal: boolean;
  comparison: boolean;
  wants: ChatIntent | null;
}

function parseNumberBeforeUnit(text: string, units: string[]): number | null {
  const unitPattern = units.join("|");
  const patterns = [
    new RegExp(`(?:moins de|moins d|maximum|maxi?|inferieur a|sous)\\s+(\\d{2,4})\\s*(?:${unitPattern})`),
    new RegExp(`(\\d{2,4})\\s*(?:${unitPattern})\\s*(?:maximum|maxi?|au plus)`),
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = Number.parseInt(match[1], 10);
      if (Number.isFinite(value)) return value;
    }
  }
  return null;
}

function parseSoil(text: string): Soil | null {
  if (
    text.includes("sablo") ||
    hasPhrase(text, "sable") ||
    hasPhrase(text, "sableux") ||
    hasPhrase(text, "dior")
  ) {
    return "sable";
  }
  if (
    text.includes("argilo") ||
    hasPhrase(text, "argile") ||
    hasPhrase(text, "argileux") ||
    hasAnyPhrase(text, ["deck", "dek", "ban"])
  ) {
    return "argile";
  }
  if (
    text.includes("limono") ||
    hasPhrase(text, "limon") ||
    hasPhrase(text, "limoneux") ||
    hasPhrase(text, "balegne")
  ) {
    return "limon";
  }
  return null;
}

function parseUsage(text: string): Usage | null {
  if (
    hasAnyPhrase(text, ["biofortifie", "biofortifiee", "fer", "zinc"]) ||
    text.includes("biofortifi")
  ) {
    return "biofortifie";
  }
  if (hasAnyPhrase(text, ["fourrage", "fan", "double usage"])) return "fourrage";
  if (
    hasAnyPhrase(text, [
      "alimentaire",
      "alimentation",
      "consommation",
      "couscous",
      "thiere",
      "latchiri",
      "sankhal",
    ])
  ) {
    return "grain";
  }
  return null;
}

function inferIntent(
  concepts: Set<Concept>,
  varieties: Variety[],
  commune: Commune | null,
  field: ChatField | null,
  hasFilters: boolean
): ChatIntent | null {
  // Une question « méta » (aide, fonctionnement, présentation) ne doit pas être
  // détournée par un concept de données présent dans la même phrase.
  if (
    varieties.length === 0 &&
    !commune &&
    !hasConcept(concepts, "technique") &&
    !hasConcept(concepts, "disease") &&
    !hasConcept(concepts, "pest") &&
    (hasConcept(concepts, "howto") ||
      hasConcept(concepts, "criteria") ||
      hasConcept(concepts, "about") ||
      hasConcept(concepts, "greeting") ||
      hasConcept(concepts, "thanks") ||
      hasConcept(concepts, "help") ||
      hasConcept(concepts, "guarantee"))
  ) {
    return null;
  }

  const comparison = hasConcept(concepts, "comparison");
  if (comparison) return "comparison";
  if (hasConcept(concepts, "recommendation")) return "recommendation";
  if (
    hasConcept(concepts, "technique") ||
    ((hasConcept(concepts, "disease") || hasConcept(concepts, "pest")) &&
      varieties.length === 0)
  ) {
    return "technique";
  }
  if (
    hasConcept(concepts, "climate") &&
    !hasConcept(concepts, "list") &&
    !hasConcept(concepts, "adaptation")
  ) {
    return "climate";
  }

  // Une variété identifiée est traitée comme une fiche (ou un champ précis),
  // même si la phrase contient « variété » qui est aussi un mot de liste.
  if (field && varieties.length === 1) return "fact";
  if (varieties.length === 1) return "detail";

  if (
    hasConcept(concepts, "list") ||
    hasConcept(concepts, "adaptation") ||
    hasFilters
  ) {
    return "list";
  }
  if (field && varieties.length > 0) return "fact";
  if (varieties.length > 0) return "detail";
  if (commune) return "overview";
  return null;
}
function parseQuery(
  text: string,
  communes: Commune[],
  varieties: Variety[]
): ParsedQuery {
  const normalized = normalize(text);
  const concepts = detectConcepts(text);
  const mentionedVarieties = findVarieties(text, varieties);
  const commune = findCommune(text, communes);

  const precocite: Precocity | null = hasConcept(concepts, "tardif")
    ? "tardif"
    : hasConcept(concepts, "precoce")
    ? "precoce"
    : null;

  const maxCycleDays = parseNumberBeforeUnit(normalized, ["jours", "jour", "j"]);
  // « Peu de pluie » est un critère de tolérance quand on cherche des variétés,
  // mais reste une question climatique quand on interroge le climat d'un lieu.
  const tolerance =
    hasConcept(concepts, "drought") &&
    (hasConcept(concepts, "list") ||
      hasConcept(concepts, "adaptation") ||
      hasConcept(concepts, "recommendation") ||
      !hasConcept(concepts, "climate"));
  const soil = parseSoil(normalized);
  const usage = parseUsage(normalized);
  const field = detectVarietyField(concepts);
  const marginal = hasConcept(concepts, "marginal");

  const comparison =
    hasConcept(concepts, "comparison") ||
    (mentionedVarieties.length >= 2 && hasPhrase(normalized, "ou"));

  return {
    concepts,
    varieties: mentionedVarieties,
    commune,
    field,
    precocite,
    tolerance,
    maxCycle: maxCycleDays,
    soil,
    usage,
    marginal,
    comparison,
    // L'intention est recalculée après héritage du contexte conversationnel.
    wants: null,
  };
}

function hasQueryFilters(query: ParsedQuery): boolean {
  return (
    query.precocite != null ||
    query.tolerance ||
    query.maxCycle != null ||
    query.soil != null ||
    query.usage != null ||
    hasConcept(query.concepts, "seeds")
  );
}

function applyContext(
  query: ParsedQuery,
  context: ChatContext,
  followUp: boolean,
  varieties: Variety[],
  communes: Commune[]
): void {
  if (!followUp) return;

  if (query.varieties.length === 0 && context.varietyId) {
    const variety = varieties.find((entry) => entry.id === context.varietyId);
    if (variety) query.varieties = [variety];
  }
  if (!query.commune && context.communeId) {
    const commune = communes.find((entry) => entry.id === context.communeId);
    if (commune) query.commune = commune;
  }
  if (!query.precocite && context.precocite) query.precocite = context.precocite;
  if (!query.tolerance && context.tolerance) query.tolerance = true;
  if (!query.soil && context.soil) query.soil = context.soil;
  if (!query.usage && context.usage) query.usage = context.usage;
}

// --- Listes filtrées -------------------------------------------------------

type PrecocityRank = "tres" | "precoce" | "semi" | "tardif" | null;

function precocityRank(variety: Variety): PrecocityRank {
  const value = normalize(variety.precocite);
  if (!value) return null;
  if (value.includes("tardif")) return "tardif";
  if (value.includes("tres precoce")) return "tres";
  if (value.includes("semi precoce")) {
    const withoutSemi = value.replace(/semi precoce/g, "").trim();
    return hasPhrase(withoutSemi, "precoce") ? "precoce" : "semi";
  }
  if (hasPhrase(value, "precoce")) return "precoce";
  return null;
}

function isDroughtTolerant(variety: Variety): boolean {
  const value = normalize(variety.tolerance_secheresse);
  return hasPhrase(value, "bonne") || value.includes("tres bonne");
}

function isSeedAvailable(variety: Variety): boolean {
  const value = normalize(variety.disponibilite_semences);
  return value.startsWith("semences disponibles");
}

// Vocabulaire des usages : il doit accepter aussi bien une valeur saisie en
// base (« grain, couscous, fourrage ») qu'un texte de description.
const GRAIN_PRODUCTS = [
  "couscous",
  "thiere",
  "latchiri",
  "sankhal",
  "bouillie",
  "semoule",
  "farine",
  "alimentation",
  "consommation",
  "transformation",
];

function matchesUsage(haystack: string, usage: Usage): boolean {
  if (usage === "biofortifie") return haystack.includes("biofortifie");
  if (usage === "fourrage") {
    return hasAnyPhrase(haystack, ["fourrage", "double usage", "paille", "fan"]);
  }
  return hasAnyPhrase(haystack, ["grain", ...GRAIN_PRODUCTS]);
}

// Dans une description, « grain » est trop générique (« gros grains ») : on
// n'accepte que les produits et préparations réellement alimentaires.
function descriptionMatchesUsage(haystack: string, usage: Usage): boolean {
  if (usage === "grain") return hasAnyPhrase(haystack, GRAIN_PRODUCTS);
  return matchesUsage(haystack, usage);
}

function cycleUpperBound(variety: Variety): number | null {
  if (!variety.duree_cycle_jours) return null;
  const numbers = variety.duree_cycle_jours.match(/\d+/g);
  if (!numbers) return null;
  return Math.max(...numbers.map((value) => Number.parseInt(value, 10)));
}

function precocityDisplay(precocite: Precocity, lang: ChatLanguage): string {
  if (lang === "en") return precocite === "precoce" ? "early" : "late";
  return precocite === "precoce" ? "précoce" : "tardif";
}

/** Traduit les valeurs de précocité de la base (français) en anglais. */
function precocityValue(value: string, lang: ChatLanguage): string {
  if (lang !== "en" || !value) return value;
  const normalized = normalize(value);
  if (normalized.includes("precoce a semi precoce")) return "early to semi-early";
  if (normalized.includes("tres precoce")) return "very early";
  if (normalized.includes("semi precoce")) return "semi-early";
  if (hasPhrase(normalized, "precoce")) return "early";
  if (normalized.includes("tardif")) return "late";
  return value;
}

function usageDisplay(usage: Usage, lang: ChatLanguage): string {
  if (lang === "en") {
    return usage === "biofortifie"
      ? "biofortified"
      : usage === "fourrage"
      ? "fodder"
      : "grain";
  }
  return usage === "biofortifie"
    ? "biofortifié"
    : usage === "fourrage"
    ? "fourrage"
    : "grain";
}

function filteredListAnswer(
  query: ParsedQuery,
  varieties: Variety[],
  lang: ChatLanguage
): string {
  const L = DATA_LABELS[lang];
  const applied: string[] = [];
  const ignored: string[] = [];
  let list = [...varieties];

  if (query.precocite) {
    const wanted: PrecocityRank[] =
      query.precocite === "tardif" ? ["tardif"] : ["tres", "precoce"];
    list = list.filter((variety) => {
      const rank = precocityRank(variety);
      return rank != null && wanted.includes(rank);
    });
    applied.push(`${L.precocityFilter} (${precocityDisplay(query.precocite, lang)})`);
  }

  if (query.tolerance) {
    list = list.filter(isDroughtTolerant);
    applied.push(L.droughtFilter);
  }

  if (hasConcept(query.concepts, "seeds")) {
    if (list.some(isSeedAvailable)) {
      list = list.filter(isSeedAvailable);
      applied.push(L.seedFilter);
    } else {
      ignored.push(L.seedFilter);
    }
  }

  if (query.maxCycle != null) {
    list = list.filter((variety) => {
      const bound = cycleUpperBound(variety);
      return bound != null && bound <= query.maxCycle!;
    });
    applied.push(`${L.cycleFilter} ${query.maxCycle} ${L.days}`);
  }

  if (query.soil) {
    const withSoil = varieties.filter((variety) => variety.exigences_pedologiques.trim());
    if (withSoil.length > 0) {
      list = list.filter((variety) =>
        soilsCompatible(query.soil as string, variety.exigences_pedologiques)
      );
      applied.push(`${L.soilLabel} : ${query.soil}`);
      const missing = varieties.length - withSoil.length;
      if (missing > 0) {
        ignored.push(`${L.soilLabel} : ${missing} ${L.varietiesWithoutData}`);
      }
    } else {
      ignored.push(`${L.soilLabel} : ${L.notAvailableCriteria}`);
    }
  }

  if (query.usage) {
    const usage = query.usage;
    const structured = varieties.some((variety) => variety.usages_alimentaires.trim());

    list = list.filter((variety) => {
      const stored = normalize(variety.usages_alimentaires);
      if (stored && matchesUsage(stored, usage)) return true;

      // Repli sur les textes disponibles (description, type, grain). On ne
      // devine rien : seuls les mots présents dans la fiche sont utilisés.
      // L'union avec le champ structuré évite qu'une donnée incomplète (par
      // exemple « biofortifié » absent des usages) masque une variété qui
      // est pourtant décrite comme telle.
      const haystack = normalize(
        [
          variety.description,
          variety.type_mil,
          variety.caracteristiques_grain,
        ].join(" ")
      );
      return descriptionMatchesUsage(haystack, usage);
    });

    applied.push(
      `${L.usageFilter} : ${usageDisplay(usage, lang)}${
        structured ? "" : ` (${L.inferredFromDescriptions})`
      }`
    );
  }

  let zones: { variety_id: number; zone_type: ZoneAdaptationType }[] = [];
  if (query.commune) {
    zones = getCommuneAdaptationZones(query.commune.id);
    const accepted: ZoneAdaptationType[] = query.marginal
      ? ["adaptee", "marginale"]
      : ["adaptee"];
    const allowed = new Set(
      zones
        .filter((zone) => accepted.includes(zone.zone_type))
        .map((zone) => zone.variety_id)
    );
    list = list.filter((variety) => allowed.has(variety.id));
    applied.push(
      `${L.adaptationLabel} : ${
        query.marginal ? `${L.zoneAdapted} / ${L.zoneMarginal}` : L.zoneAdapted
      } ${query.commune.nom}`
    );
  }

  const lines: string[] = [];

  if (list.length === 0) {
    lines.push(`${capitalize(L.noMatch)}${query.commune ? ` (${query.commune.nom})` : ""}`);

    if (query.commune) {
      const byId = new Map(varieties.map((variety) => [variety.id, variety]));
      const adapted = zones
        .filter((zone) => zone.zone_type === "adaptee" || (query.marginal && zone.zone_type === "marginale"))
        .map((zone) => byId.get(zone.variety_id))
        .filter((variety): variety is Variety => Boolean(variety));

      if (adapted.length) {
        lines.push(
          `${L.amongAdapted} ${query.commune.nom} (${adapted.length}) : ${shortList(
            adapted.map((variety) => variety.nom_officiel),
            8,
            lang
          )}`
        );
        const details = adapted
          .slice(0, 6)
          .map(
            (variety) =>
              `• ${variety.nom_officiel} — ${cycleLabel(variety, lang)} (${precocityValue(variety.precocite, lang)})`
          )
          .join("\n");
        lines.push(details);
      }
    }
  } else {
    lines.push(`${L.listHeader} (${list.length}) :`);
    for (const variety of list.slice(0, 8)) {
      const parts = [
        `• ${variety.nom_officiel}`,
        cycleLabel(variety, lang),
        variety.precocite ? `(${precocityValue(variety.precocite, lang)})` : "",
      ].filter(Boolean);

      if (query.commune) {
        const zone = zones.find((entry) => entry.variety_id === variety.id);
        if (zone) parts.push(`— ${L.zoneLabel.toLowerCase()} : ${ZONE_LABELS[lang][zone.zone_type]}`);
      }
      if (query.tolerance) {
        parts.push(`— ${L.drought} : ${variety.tolerance_secheresse}`);
      }
      lines.push(parts.join(" "));
    }
    if (list.length > 8) {
      lines.push(`• (+${list.length - 8} ${L.andOthers})`);
    }

    const normal = query.commune ? getClimatNormal(query.commune.id) : null;
    if (query.commune && normal && normal.cumul_mm != null) {
      lines.push(
        `${L.climate} ${query.commune.nom} (${normalPeriod(normal, lang)}) : ${fmt(
          Math.round(normal.cumul_mm),
          lang
        )} ${L.rainfallUnit}, ${fmt(Math.round(normal.saison_jours ?? 0), lang)} ${L.days}.`
      );
    }

    // Une liste filtrée sur les variétés adaptées ne doit pas masquer les
    // variétés simplement marginales dans la commune.
    if (query.commune && !query.marginal) {
      const byId = new Map(varieties.map((variety) => [variety.id, variety]));
      const marginal = zones
        .filter((zone) => zone.zone_type === "marginale")
        .map((zone) => byId.get(zone.variety_id)?.nom_officiel)
        .filter((name): name is string => Boolean(name));
      if (marginal.length) {
        lines.push(
          `• ${L.marginalVarieties} (${marginal.length}) : ${shortList(marginal, 8, lang)}`
        );
      }
    }
  }

  if (applied.length) lines.push(`• ${L.criteriaApplied} : ${applied.join(" ; ")}`);
  if (ignored.length) lines.push(`• ${L.criteriaIgnored} : ${ignored.join(" ; ")}`);

  lines.push(L.source);
  return lines.join("\n");
}

// --- Réponses documentaires (BM25) ----------------------------------------

function knowledgeAnswer(
  text: string,
  varieties: Variety[],
  lang: ChatLanguage
): string | null {
  const hits = searchKnowledge(text, varieties, 1);
  if (hits.length === 0) return null;
  const hit = hits[0];
  const L = DATA_LABELS[lang];
  const lines: string[] = [];

  if (hit.kind === "protection") {
    lines.push(`${hit.title} — ${L.protectionLabel} :`);
    for (const line of hit.lines) lines.push(`• ${line}`);
  } else if (hit.kind === "technique") {
    lines.push(`${hit.title} :`);
    for (const line of hit.lines) lines.push(`• ${line}`);
  } else {
    lines.push(`${hit.title} — ${L.descriptionLabel} :`);
    for (const line of hit.lines) lines.push(`• ${line}`);
  }

  lines.push(`Source : ${hit.source}`);
  return lines.join("\n");
}

// --- Détection d'intention statique ---------------------------------------

const EN_MARKERS = [
  "hello", "hi", "hey", "what is", "which varieties", "varieties", "how do",
  "how to", "recommendation", "recommend", "help", "thank", "thanks", "list",
  "platform", "about", "early", "yield", "drought", "seed", "climate",
];

const WO_MARKERS = [
  "salaam", "salaam aleekum", "nanga def", "jerejef", "jërëjëf", "degguma",
  "wolof", "baal ma", "naka", "xibaar", "xeet", "dugub", "dëkk",
];

export function detectLanguage(text: string): ChatLanguage {
  const normalized = normalize(text);
  if (includesAny(normalized, WO_MARKERS)) return "wo";
  if (includesAny(normalized, EN_MARKERS)) return "en";
  return "fr";
}

interface StaticIntent {
  type:
    | "greeting"
    | "whatIs"
    | "howRecommend"
    | "criteria"
    | "disclaimer"
    | "thanks"
    | "help"
    | "fallback";
}

function detectStaticIntent(concepts: Set<Concept>): StaticIntent {
  // L'ordre compte : une salutation explicite reste une salutation, même si
  // la phrase contient un mot polysémique (« bonjour, quel est le cycle… »
  // contient une entité et ne passe pas par ici).
  if (hasConcept(concepts, "greeting")) return { type: "greeting" };
  if (hasConcept(concepts, "thanks")) return { type: "thanks" };
  if (hasConcept(concepts, "guarantee")) return { type: "disclaimer" };
  if (hasConcept(concepts, "about")) return { type: "whatIs" };
  if (hasConcept(concepts, "criteria")) return { type: "criteria" };
  if (hasConcept(concepts, "howto")) return { type: "howRecommend" };
  if (hasConcept(concepts, "help")) return { type: "help" };
  return { type: "fallback" };
}

function varietyLine(variety: Variety, lang: ChatLanguage): string {
  const cycle = variety.duree_cycle_jours
    ? `${variety.duree_cycle_jours} ${DATA_LABELS[lang].days}`
    : "?";
  return `• ${variety.nom_officiel} — ${cycle}${
    variety.precocite ? ` (${precocityValue(variety.precocite, lang)})` : ""
  }`;
}

// --- Point d'entrée -------------------------------------------------------

export interface ChatAnswer {
  reply: string;
  language: ChatLanguage;
  context: ChatContext;
  /** false uniquement quand la réponse est le refus générique (à journaliser). */
  matched: boolean;
}

export function answerQuestion(
  text: string,
  lang: ChatLanguage,
  rawContext?: unknown
): ChatAnswer {
  const s = STRINGS[lang];
  const communes = getCommunes();
  const varieties = getVarieties();
  const context = sanitizeContext(rawContext);
  const followUp = isFollowUp(text);
  const query = parseQuery(text, communes, varieties);
  const normalized = normalize(text);

  applyContext(query, context, followUp, varieties, communes);

  // Réévaluation après héritage : « et pour Thiès ? » doit reprendre
  // l'intention précédente (liste, climat, recommandation) même sans mot-clé.
  const filters = hasQueryFilters(query);
  const inferred = inferIntent(
    query.concepts,
    query.varieties,
    query.commune,
    query.field,
    filters
  );
  query.wants =
    followUp && context.intent && query.concepts.size === 0 && !filters
      ? context.intent
      : inferred;
  if (query.comparison) query.wants = "comparison";

  const nextContext: ChatContext = { ...context };
  if (query.varieties[0]) nextContext.varietyId = query.varieties[0].id;
  if (query.commune) nextContext.communeId = query.commune.id;
  if (query.precocite) nextContext.precocite = query.precocite;
  if (query.tolerance) nextContext.tolerance = true;
  if (query.soil) nextContext.soil = query.soil;
  if (query.usage) nextContext.usage = query.usage;
  if (query.field) nextContext.field = query.field;

  const finish = (reply: string, matched = true): ChatAnswer => {
    if (query.wants) nextContext.intent = query.wants;
    return {
      reply,
      language: lang,
      context: nextContext,
      matched,
    };
  };

  // 1. Comparaison de deux variétés (éventuellement dans une commune).
  if (query.varieties.length >= 2) {
    if (query.comparison || query.varieties.length === 2) {
      return finish(
        compareVarieties(query.varieties[0], query.varieties[1], lang, query.commune)
      );
    }
    // Plus de deux variétés citées : demander laquelle.
    return finish(
      [
        s.disambiguate,
        ...query.varieties.slice(0, 8).map((variety) => varietyLine(variety, lang)),
      ].join("\n")
    );
  }

  // 2. Une variété.
  if (query.varieties.length === 1) {
    const variety = query.varieties[0];
    if (query.commune) {
      // Une variété + une commune : adaptation, éventuellement précisée par un
      // champ (« cycle de Souna 3 à Kaolack »).
      return finish(varietyCommuneAnswer(variety, query.commune, lang, query.field));
    }
    if (query.field) return finish(varietyFact(variety, query.field, lang));
    return finish(varietyDetails(variety, lang));
  }

  // 3. Question documentaire (itinéraire technique, protection, description).
  if (query.wants === "technique") {
    const answer = knowledgeAnswer(text, varieties, lang);
    if (answer) return finish(answer);
  }

  // 4. Une commune.
  if (query.commune) {
    if (query.wants === "recommendation") {
      return finish(recommendationAnswer(query.commune, varieties, lang));
    }
    if (query.wants === "climate") {
      return finish(climateAnswer(query.commune, lang));
    }
    if (query.wants === "list") {
      return finish(filteredListAnswer(query, varieties, lang));
    }
    return finish(communeOverview(query.commune, varieties, lang));
  }

  // 5. Lieu cité mais absent de la base : le dire explicitement plutôt que de
  // répondre à côté de la question.
  const localityCandidate = extractLocalityCandidate(text);
  if (localityCandidate) {
    const asksAboutPlace = includesAny(normalized, [
      "variete", "varietes", "xeet", "quelles", "which", "adapte", "convient",
      "pousse", "climat", "climate", "pluie", "rain", "recommand", "recommend",
    ]);
    if (asksAboutPlace) {
      const covered = communes.slice(0, 12).map((commune) => commune.nom).join(", ");
      return finish(`${s.noLocalities} ${covered}…`);
    }
  }

  // 6. Liste filtrée sans commune (« variétés précoces et tolérantes »).
  if (query.wants === "list") {
    if (query.soil) {
      const hasSoilData = varieties.some((variety) => variety.exigences_pedologiques.trim());
      if (!hasSoilData) return finish(s.noSoil);
    }
    return finish(filteredListAnswer(query, varieties, lang));
  }

  // 6. Recommandation sans localité.
  if (query.wants === "recommendation") {
    return finish(s.specifyCommune);
  }

  // 7. Question agronomique sans entité (« comment lutter contre le striga ? »).
  const knowledge = knowledgeAnswer(text, varieties, lang);
  if (knowledge) return finish(knowledge);

  // 8. Intentions statiques.
  const intent = detectStaticIntent(query.concepts);
  switch (intent.type) {
    case "greeting":
      return finish(s.greeting);
    case "whatIs":
      return finish(s.whatIs);
    case "howRecommend":
      return finish(s.howRecommend);
    case "criteria":
      return finish(s.criteria);
    case "disclaimer":
      return finish(s.disclaimer);
    case "thanks":
      return finish(s.thanks);
    case "help":
      return finish(s.help);
    default:
      return finish(s.fallback, false);
  }
}

/** Compatibilité : ancien point d'entrée sans contexte conversationnel. */
export function generateReply(text: string, lang: ChatLanguage): string {
  return answerQuestion(text, lang).reply;
}
