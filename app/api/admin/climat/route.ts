import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ensureDatabase } from "@/lib/ensure-db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/queries";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  ensureDatabase();
  const db = getDb();
  return NextResponse.json(
    db
      .prepare(
        `SELECT cl.*, c.nom AS commune_nom FROM climat cl JOIN communes c ON c.id = cl.commune_id ORDER BY cl.annee DESC, c.nom`
      )
      .all()
  );
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
  if (!body.commune_id || !body.annee) {
    return NextResponse.json({ error: "Commune et année requises." }, { status: 400 });
  }
  ensureDatabase();
  const db = getDb();
  const res = db
    .prepare(
      `INSERT INTO climat (
        commune_id, annee, cumul_pluvio_mm, date_debut_saison, date_fin_saison,
        duree_saison_jours, nb_sequences_seches, duree_max_seche_jours,
        temperature_moyenne_c, prevision_saison, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(commune_id, annee) DO UPDATE SET
        cumul_pluvio_mm = excluded.cumul_pluvio_mm,
        date_debut_saison = excluded.date_debut_saison,
        date_fin_saison = excluded.date_fin_saison,
        duree_saison_jours = excluded.duree_saison_jours,
        nb_sequences_seches = excluded.nb_sequences_seches,
        duree_max_seche_jours = excluded.duree_max_seche_jours,
        temperature_moyenne_c = excluded.temperature_moyenne_c,
        prevision_saison = excluded.prevision_saison,
        source = excluded.source,
        date_maj = datetime('now')`
    )
    .run(
      Number(body.commune_id),
      Number(body.annee),
      body.cumul_pluvio_mm != null ? Number(body.cumul_pluvio_mm) : null,
      body.date_debut_saison ? String(body.date_debut_saison) : null,
      body.date_fin_saison ? String(body.date_fin_saison) : null,
      body.duree_saison_jours != null ? Number(body.duree_saison_jours) : null,
      body.nb_sequences_seches != null ? Number(body.nb_sequences_seches) : null,
      body.duree_max_seche_jours != null ? Number(body.duree_max_seche_jours) : null,
      body.temperature_moyenne_c != null ? Number(body.temperature_moyenne_c) : null,
      String(body.prevision_saison ?? ""),
      String(body.source ?? "")
    );
  logAudit(admin.username, "upsert", "climat", Number(res.lastInsertRowid), `commune ${body.commune_id} année ${body.annee}`);
  return NextResponse.json({ ok: true });
}
