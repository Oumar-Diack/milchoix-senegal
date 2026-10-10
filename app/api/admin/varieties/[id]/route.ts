import { NextRequest, NextResponse } from "next/server";
import type { SQLInputValue } from "node:sqlite";
import { getDb } from "@/lib/db";
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }
  const db = getDb();
  const cols = VARIETY_FIELDS.filter((f) => f in body);
  if (cols.length === 0) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour." }, { status: 400 });
  }
  const assignments = cols.map((f) => `${f} = ?`).join(", ");
  const values: SQLInputValue[] = cols.map((f) => (body[f] as SQLInputValue) ?? null);
  db.prepare(
    `UPDATE varieties SET ${assignments}, updated_at = datetime('now') WHERE id = ?`
  ).run(...values, Number(id));
  logAudit(admin.username, "update", "variete", Number(id), String(body.nom_officiel ?? ""));
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM varieties WHERE id = ?").run(Number(id));
  logAudit(admin.username, "delete", "variete", Number(id), "");
  return NextResponse.json({ ok: true });
}
