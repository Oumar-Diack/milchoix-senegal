import { NextRequest, NextResponse } from "next/server";
import type { SQLInputValue } from "node:sqlite";
import { getDb } from "@/lib/db";
import { ensureDatabase } from "@/lib/ensure-db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/queries";

const VARIETY_FIELDS = [
  "nom_officiel",
  "noms_locaux",
  "statut",
  "annee_homologation",
  "obtenteur",
  "type_mil",
  "duree_cycle_jours",
  "precocite",
  "besoins_pluvio_min_mm",
  "besoins_pluvio_max_mm",
  "tolerance_secheresse",
  "resistances_maladies",
  "reaction_ravageurs",
  "rendement_potentiel_min_kg",
  "rendement_potentiel_max_kg",
  "rendement_observe_moyen_kg",
  "caracteristiques_grain",
  "usages_alimentaires",
  "exigences_pedologiques",
  "disponibilite_semences",
  "description",
  "source",
  "statut_validation",
  "published",
];

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  ensureDatabase();
  const db = getDb();
  const rows = db.prepare("SELECT * FROM varieties ORDER BY id DESC").all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }
  if (!body.nom_officiel) {
    return NextResponse.json({ error: "Le nom officiel est requis." }, { status: 400 });
  }
  ensureDatabase();
  const db = getDb();
  const cols = VARIETY_FIELDS.filter((f) => f in body);
  const placeholders = cols.map(() => "?").join(", ");
  const values: SQLInputValue[] = cols.map((f) => (body[f] as SQLInputValue) ?? null);
  const res = db
    .prepare(`INSERT INTO varieties (${cols.join(", ")}) VALUES (${placeholders})`)
    .run(...values);
  logAudit(admin.username, "create", "variete", Number(res.lastInsertRowid), String(body.nom_officiel));
  return NextResponse.json({ id: Number(res.lastInsertRowid) });
}
