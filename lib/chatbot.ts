import { getCommunes, getVarieties, getAllZones } from "./queries";
import type { Variety, Commune } from "./types";

export type ChatLanguage = "fr" | "en" | "wo";

const STRINGS: Record<ChatLanguage, Record<string, string>> = {
  fr: {
    greeting:
      "Bonjour ! Je suis l'assistant de MilChoix Sénégal. Je peux vous aider à connaître les variétés de mil, comprendre le moteur de recommandation ou savoir comment l'utiliser. Que puis-je faire pour vous ?",
    whatIs:
      "MilChoix Sénégal est une plateforme d'information, de cartographie et d'aide au choix variétal du mil. Elle aide les producteurs, les organisations paysannes et les conseillers agricoles à identifier les variétés les mieux adaptées à une localité et à une campagne agricole. Elle réunit quatre fonctions : informer, cartographier, comparer et recommander.",
    howRecommend:
      "Pour obtenir une recommandation : 1) ouvrez la page « Recommander », 2) renseignez votre localité et la campagne agricole, 3) précisez (facultatif) la date de semis, le type de sol, vos préférences. Le système vous proposera une liste classée de variétés avec des explications et le niveau de confiance.",
    criteria:
      "Le moteur compare notamment : la durée du cycle de la variété face à la durée probable de la saison, les besoins en eau face aux précipitations prévues, la tolérance à la sécheresse en cas de risque de séquences sèches, le type de sol, la date de semis et la disponibilité des semences. Chaque recommandation explique les critères utilisés.",
    disclaimer:
      "Attention : les recommandations constituent une aide à la décision. Elles ne remplacent ni l'expérience du producteur ni l'avis du conseiller agricole, et ne constituent pas une garantie de résultat.",
    thanks: "Avec plaisir ! N'hésitez pas si vous avez d'autres questions.",
    help: "Je peux : lister les variétés, indiquer les variétés adaptées à une localité, expliquer les critères de recommandation, ou vous guider pour obtenir une recommandation. Exemples : « quelles variétés sont précoces ? », « quelles variétés pour Kaolack ? ».",
    fallback:
      "Je n'ai pas bien compris votre question. Essayez par exemple : « quelles variétés sont précoces ? », « quelles variétés pour Kaolack ? », ou « comment obtenir une recommandation ? ».",
    noVarieties: "Je n'ai pas trouvé de variété correspondant à votre demande.",
    varietiesIntro: "Voici quelques variétés référencées (nom — cycle) :",
    localitiesIntro: "Voici les variétés associées à cette localité :",
    noLocalities: "Je n'ai pas trouvé cette localité dans la base. Localités couvertes :",
  },
  en: {
    greeting:
      "Hello! I'm the MilChoix Sénégal assistant. I can tell you about millet varieties, explain the recommendation engine, or guide you on how to use the platform. How can I help?",
    whatIs:
      "MilChoix Sénégal is a digital platform for information, mapping and decision support on millet variety choice. It helps farmers, producer organizations and extension agents identify the varieties best suited to a locality and a cropping season. It combines four functions: inform, map, compare and recommend.",
    howRecommend:
      "To get a recommendation: 1) open the « Recommend » page, 2) enter your locality and cropping season, 3) optionally add sowing date, soil type and preferences. The system returns a ranked list of varieties with explanations and a confidence level.",
    criteria:
      "The engine compares: variety cycle length vs expected season length, water requirements vs expected rainfall, drought tolerance vs risk of dry spells, soil type, sowing date and seed availability. Each recommendation explains the criteria used.",
    disclaimer:
      "Note: recommendations are decision support only. They do not replace farmer experience or extension advice, and are not a guarantee of results.",
    thanks: "You're welcome! Feel free to ask more questions.",
    help: "I can: list varieties, tell you which varieties suit a locality, explain recommendation criteria, or guide you to get a recommendation. Examples: « which varieties are early? », « which varieties for Kaolack? ».",
    fallback:
      "I didn't understand. Try for example: « which varieties are early? », « which varieties for Kaolack? », or « how do I get a recommendation? ».",
    noVarieties: "I couldn't find a variety matching your request.",
    varietiesIntro: "Here are some referenced varieties (name — cycle):",
    localitiesIntro: "Here are the varieties associated with this locality:",
    noLocalities: "I couldn't find this locality in the database. Covered localities:",
  },
  wo: {
    greeting:
      "Salaam aleekum ! Man ngi tudd MilChoix Sénégal. Mën naa laa jox xibaar ci xeetu dugub yi, walla ci nakañu jëfandikoo jumtukaay bi. Lan laa mën a defal?",
    whatIs:
      "MilChoix Sénégal mooy jumtukaay bu diggital buy jox xibaar, yoon-wax ak ndimbal ngir tànn xeetu dugub. Mu ngi dimbali ndaw-yi, mbootaay-yi ak ay tëmmkat yu werseg ngir gis xeetu dugub yu bëgg ci seen dëkkuwaay ak seen atum mbey.",
    howRecommend:
      "Ngir am sa tànn : 1) ubbil xët wi tudd « Recommander », 2) bindal sa dëkkuwaay ak atum mbey bi, 3) (manees naa) yokk bésu liir, xeetu suuf ak li ngay bëgg. Sistam bi dina la jox xeetu dugub yuñu natt, ak leeral bi ak ngoorug koolute bi.",
    criteria:
      "Sistam bi dafay nattal : guddig aji sa xeetu dugub ak guddig waxtu wiy naw, lu mu soxla ci ndox ak taw bi ñu tëgg, muñam ci góor-taw, xeetu suuf, bésu liir ak jëm-kanamug sumbi (sémences).",
    disclaimer:
      "Xoolal : tànni yi day defar ngir ndimbal rekk. Ñu nanguul gëm-gëm mu gën ndaw-yi, ak ay téere yu tëmmkat yi, te ñu nanguul njàngum jéego.",
    thanks: "Jërëjëf ! Am naa am naa xibaar yu wuute.",
    help: "Mën naa : lim xeetu dugub yi, wax lan yu bëgg ci dëkkuwaay bii, leeral nakañu tànn, walla yor ngir am sa tànn. Misal : « ban xeet yi gàtt ? », « ban xeet yi ngir Kaolack ? ».",
    fallback:
      "Déguma bu baax sa laaj bi. Jéemal : « ban xeet yi gàtt ? », « ban xeet yi ngir Kaolack ? », walla « nakañu am tànn ? ».",
    noVarieties: "Gisuma benn xeetu dugub bu tëggal ak la nga wax.",
    varietiesIntro: "Nii ñoo xeetu dugub yuñu bind (turu — guddig aji) :",
    localitiesIntro: "Nii ñoo xeetu dugub yi ñu koftal ak dëkkuwaay bii :",
    noLocalities: "Gisuma dëkkuwaay bii ci koppar bi. Dëkkuwaay yi ñu am :",
  },
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k));
}

const EN_MARKERS = [
  "hello",
  " hi",
  "hey",
  "what is",
  "which varieties",
  "varieties",
  "how do",
  "how to",
  "recommendation",
  "recommend",
  "help",
  "thank",
  "thanks",
  "list",
  "platform",
  "about",
  "early",
];

const WO_MARKERS = [
  "salaam",
  "salaam aleekum",
  "nanga def",
  "jerejef",
  "jërëjëf",
  "degguma",
  "wolof",
  "baal ma",
  "naka",
  "xibaar",
];

export function detectLanguage(text: string): ChatLanguage {
  const t = normalize(text);
  if (includesAny(t, WO_MARKERS)) return "wo";
  if (includesAny(t, EN_MARKERS)) return "en";
  return "fr";
}

interface IntentResult {
  type:
    | "greeting"
    | "whatIs"
    | "howRecommend"
    | "criteria"
    | "disclaimer"
    | "thanks"
    | "help"
    | "listVarieties"
    | "varietiesForLocality"
    | "fallback";
  locality?: string;
  filter?: "precoce" | "tardif" | "tolérant";
}

function detectIntent(text: string, communes: Commune[]): IntentResult {
  const t = normalize(text);

  // Localité : vérifier les noms de communes
  const locality = communes.find((c) => t.includes(normalize(c.nom)));
  if (locality) {
    return { type: "varietiesForLocality", locality: locality.nom };
  }

  if (includesAny(t, ["bonjour", "salut", "bonsoir", "hello", "salaam", "nanga def", "hey", "hi"])) {
    return { type: "greeting" };
  }
  if (includesAny(t, ["merci", "thanks", "jerejef", "jërëjëf", "thank you"])) {
    return { type: "thanks" };
  }
  if (includesAny(t, ["garantie", "sûr", "sure", "risque", "remplac", "certitude"])) {
    return { type: "disclaimer" };
  }
  if (
    includesAny(t, [
      "c'est quoi",
      "qu'est-ce",
      "what is",
      "a propos",
      "about",
      "plateforme",
      "platform",
      "cest quoi",
      "qu'est ce que",
    ])
  ) {
    return { type: "whatIs" };
  }
  if (
    includesAny(t, [
      "critere",
      "criteria",
      "pourquoi",
      "why",
      "regle",
      "comment choisir",
      "how choose",
      "comment ca marche",
      "comment ça marche",
      "fonctionne",
    ])
  ) {
    return { type: "criteria" };
  }
  if (
    includesAny(t, [
      "recommandation",
      "recommander",
      "recommend",
      "comment faire",
      "how do",
      "how to",
      "obtenir",
      "get a recommendation",
    ])
  ) {
    return { type: "howRecommend" };
  }
  if (
    includesAny(t, ["aide", "help", "que peux", "what can", "aider", "assistance"])
  ) {
    return { type: "help" };
  }
  if (
    includesAny(t, [
      "variete",
      "varieties",
      "liste",
      "list",
      "catalogue",
      "catalog",
      "quelles",
      "which",
      "xeet",
      "ban xeet",
    ])
  ) {
    let filter: IntentResult["filter"];
    if (includesAny(t, ["precoce", "early", "gatt", "court", "short"])) filter = "precoce";
    else if (includesAny(t, ["tardif", "late", "long"])) filter = "tardif";
    else if (includesAny(t, ["secheresse", "drought", "toleran", "góor-taw", "góor"])) filter = "tolérant";
    return { type: "listVarieties", filter };
  }

  return { type: "fallback" };
}

function varietyLine(v: Variety, lang: ChatLanguage): string {
  const cycle = v.duree_cycle_jours ? `${v.duree_cycle_jours} ${lang === "fr" ? "j" : lang === "en" ? "d" : "fan"}` : "?";
  return `• ${v.nom_officiel} — ${cycle}${v.precocite ? ` (${v.precocite})` : ""}`;
}

export function generateReply(text: string, lang: ChatLanguage): string {
  const s = STRINGS[lang];
  const communes = getCommunes();
  const varieties = getVarieties();
  const intent = detectIntent(text, communes);

  switch (intent.type) {
    case "greeting":
      return s.greeting;
    case "whatIs":
      return s.whatIs;
    case "howRecommend":
      return s.howRecommend;
    case "criteria":
      return s.criteria;
    case "disclaimer":
      return s.disclaimer;
    case "thanks":
      return s.thanks;
    case "help":
      return s.help;
    case "listVarieties": {
      let list = varieties.filter((v) => v.published === 1);
      if (intent.filter === "precoce") {
        list = list.filter((v) => v.precocite === "précoce" || v.precocite === "très précoce");
      } else if (intent.filter === "tardif") {
        list = list.filter((v) => v.precocite === "tardif" || v.precocite === "semi-précoce");
      } else if (intent.filter === "tolérant") {
        list = list.filter((v) =>
          ["très bonne", "bonne"].some((k) => v.tolerance_secheresse.toLowerCase().includes(k))
        );
      }
      if (list.length === 0) return s.noVarieties;
      const shown = list.slice(0, 8).map((v) => varietyLine(v, lang)).join("\n");
      return `${s.varietiesIntro}\n${shown}`;
    }
    case "varietiesForLocality": {
      const commune = communes.find((c) => normalize(c.nom) === normalize(intent.locality ?? ""));
      if (!commune) return `${s.noLocalities} ${communes.slice(0, 8).map((c) => c.nom).join(", ")}.`;
      const zones = getAllZones().filter((z) => z.commune_id === commune.id);
      const varietyIds = new Set(zones.map((z) => z.variety_id));
      const list = varieties.filter((v) => varietyIds.has(v.id) && v.published === 1);
      if (list.length === 0) {
        return `${s.noVarieties} ${commune.nom}.`;
      }
      const shown = list.slice(0, 8).map((v) => varietyLine(v, lang)).join("\n");
      return `${s.localitiesIntro} ${commune.nom}\n${shown}`;
    }
    default:
      return s.fallback;
  }
}
