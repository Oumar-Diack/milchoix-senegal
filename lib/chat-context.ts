// Mémoire de conversation du chat.
//
// Le serveur reste sans état : le contexte est sérialisé dans la réponse et
// renvoyé par le client au tour suivant. Il est intégralement revalidé côté
// serveur (aucune valeur du client n'est utilisée telle quelle).

import { normalize, tokenize } from "./chat-text";

export type ChatIntent =
  | "list"
  | "climate"
  | "recommendation"
  | "comparison"
  | "detail"
  | "fact"
  | "technique"
  | "overview";

export type ChatField =
  | "cycle"
  | "rendement"
  | "eau"
  | "tolerance"
  | "semences"
  | "maladies"
  | "usage"
  | "description";

export type Precocity = "precoce" | "tardif";
export type Soil = "sable" | "argile" | "limon";
export type Usage = "grain" | "fourrage" | "biofortifie";

export interface ChatContext {
  varietyId?: number;
  communeId?: number;
  intent?: ChatIntent;
  field?: ChatField;
  precocite?: Precocity;
  tolerance?: boolean;
  soil?: Soil;
  usage?: Usage;
}

const INTENTS: readonly ChatIntent[] = [
  "list",
  "climate",
  "recommendation",
  "comparison",
  "detail",
  "fact",
  "technique",
  "overview",
];
const FIELDS: readonly ChatField[] = [
  "cycle",
  "rendement",
  "eau",
  "tolerance",
  "semences",
  "maladies",
  "usage",
  "description",
];
const PRECOCITIES: readonly Precocity[] = ["precoce", "tardif"];
const SOILS: readonly Soil[] = ["sable", "argile", "limon"];
const USAGES: readonly Usage[] = ["grain", "fourrage", "biofortifie"];

function asInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : undefined;
}

function asEnum<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

/** Ne conserve que des champs connus et typés. */
export function sanitizeContext(raw: unknown): ChatContext {
  if (!raw || typeof raw !== "object") return {};
  const input = raw as Record<string, unknown>;
  const context: ChatContext = {};

  const varietyId = asInteger(input.varietyId);
  if (varietyId) context.varietyId = varietyId;

  const communeId = asInteger(input.communeId);
  if (communeId) context.communeId = communeId;

  const intent = asEnum(input.intent, INTENTS);
  if (intent) context.intent = intent;

  const field = asEnum(input.field, FIELDS);
  if (field) context.field = field;

  const precocite = asEnum(input.precocite, PRECOCITIES);
  if (precocite) context.precocite = precocite;

  if (input.tolerance === true) context.tolerance = true;

  const soil = asEnum(input.soil, SOILS);
  if (soil) context.soil = soil;

  const usage = asEnum(input.usage, USAGES);
  if (usage) context.usage = usage;

  return context;
}

const ANAPHORA = [
  "son", "sa", "ses", "elle", "il", "celui", "celle", "ceux", "celles",
  "its", "their", "same", "aussi", "encore", "alors", "puis",
];

/**
 * Message qui prolonge le tour précédent plutôt que d'en ouvrir un nouveau.
 * On reste strict : un message long ou une nouvelle entité explicite ne doit
 * pas hériter du contexte.
 */
export function isFollowUp(text: string): boolean {
  const normalized = normalize(text);
  if (!normalized) return false;
  if (normalized.startsWith("et ")) return true;

  const words = tokenize(normalized);
  if (words.length > 10) return false;
  return words.some((word) => ANAPHORA.includes(word));
}
