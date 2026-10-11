import { NextResponse } from "next/server";
import { ensureDatabase } from "@/lib/ensure-db";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  ensureDatabase();
  const db = getDb();
  return NextResponse.json({
    varieties: db.prepare("SELECT * FROM varieties ORDER BY id DESC").all(),
    communes: db.prepare("SELECT * FROM communes ORDER BY nom").all(),
    zones: db
      .prepare(
        `SELECT vz.*, v.nom_officiel, c.nom AS commune_nom, c.departement, c.region
         FROM variety_zones vz
         JOIN varieties v ON v.id = vz.variety_id
         JOIN communes c ON c.id = vz.commune_id
         ORDER BY v.nom_officiel, c.nom`
      )
      .all(),
    climat: db
      .prepare(
        `SELECT cl.*, c.nom AS commune_nom FROM climat cl JOIN communes c ON c.id = cl.commune_id ORDER BY cl.annee DESC, c.nom`
      )
      .all(),
    feedbacks: db
      .prepare(
        `SELECT f.*, v.nom_officiel, r.campagne_annee, c.nom AS commune
         FROM feedback f
         LEFT JOIN varieties v ON v.id = f.variety_id
         LEFT JOIN recommendations r ON r.id = f.recommendation_id
         LEFT JOIN communes c ON c.id = r.commune_id
         ORDER BY f.created_at DESC LIMIT 200`
      )
      .all(),
    audit: db.prepare("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 200").all(),
    users: db.prepare("SELECT id, username, role, created_at FROM users ORDER BY username").all(),
  });
}
