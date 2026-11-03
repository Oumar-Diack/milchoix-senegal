// Correspondance des types de sol du moteur de recommandation et du chat.
//
// Les libellés officiels combinent une texture et un nom local sénégalais
// (« Sols sableux (Dior) », « Sols argilo-limoneux (Ban-Balègne) »). La
// correspondance se fait sur des radicaux, pour que « sablo- » et « sableux »
// soient reconnus comme la même texture, et sur les noms locaux seuls (dior,
// deck, ban, balègne) quand la texture n'est pas écrite.

export type SoilTexture = "sable" | "argile" | "limon";

const TEXTURE_STEMS: Record<SoilTexture, string> = {
  sable: "sabl",
  argile: "argil",
  limon: "limon",
};

const LOCAL_NAMES: { texture: SoilTexture; terms: string[] }[] = [
  { texture: "sable", terms: ["dior"] },
  { texture: "argile", terms: ["deck", "dek", "ban"] },
  { texture: "limon", terms: ["balegne"] },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hasWord(text: string, word: string): boolean {
  return new RegExp(`(^|[^a-z0-9])${word}([^a-z0-9]|$)`).test(text);
}

/** Textures présentes dans un libellé ou une exigence pédologique. */
export function soilTextures(value: string): Set<SoilTexture> {
  const text = normalize(value);
  const found = new Set<SoilTexture>();

  for (const [texture, stem] of Object.entries(TEXTURE_STEMS) as [
    SoilTexture,
    string,
  ][]) {
    if (text.includes(stem)) found.add(texture);
  }

  for (const { texture, terms } of LOCAL_NAMES) {
    if (terms.some((term) => hasWord(text, term))) found.add(texture);
  }

  return found;
}

/**
 * Vrai si le sol choisi et les exigences de la variété partagent au moins une
 * texture. Une exigence vide ou sans texture n'est jamais considérée comme
 * compatible : on ne devine pas.
 */
export function soilsCompatible(selected: string, requirements: string): boolean {
  const wanted = soilTextures(selected);
  if (wanted.size === 0) return false;

  for (const texture of soilTextures(requirements)) {
    if (wanted.has(texture)) return true;
  }
  return false;
}
