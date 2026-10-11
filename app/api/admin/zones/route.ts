import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ensureDatabase } from "@/lib/ensure-db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/queries";

const ZONE_TYPES = ["officielle", "historique", "potentielle"];

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  ensureDatabase();
  const db = getDb();
  return NextResponse.json(
    db
      .prepare(
        `SELECT vz.*, v.nom_officiel, c.nom AS commune_nom, c.departement, c.region
         FROM variety_zones vz
         JOIN varieties v ON v.id = vz.variety_id
         JOIN communes c ON c.id = vz.commune_id
         ORDER BY v.nom_officiel, c.nom`
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

  const varietyId = Number(body.variety_id);
  const communeId = Number(body.commune_id);
  const zoneType = String(body.zone_type ?? "");

  if (!varietyId || !communeId) {
    return NextResponse.json({ error: "Variété et commune requises." }, { status: 400 });
  }
  if (!ZONE_TYPES.includes(zoneType)) {
    return NextResponse.json({ error: "Type de zone invalide." }, { status: 400 });
  }

  ensureDatabase();
  const db = getDb();

  const exists = db
    .prepare("SELECT id FROM variety_zones WHERE variety_id = ? AND commune_id = ? AND zone_type = ?")
    .get(varietyId, communeId, zoneType);
  if (exists) {
    return NextResponse.json(
      { error: "Cette zone existe déjà pour cette variété et cette commune." },
      { status: 409 }
    );
  }

  const res = db
    .prepare(
      "INSERT INTO variety_zones (variety_id, commune_id, zone_type, source, niveau_confiance) VALUES (?, ?, ?, ?, ?)"
    )
    .run(
      varietyId,
      communeId,
      zoneType,
      String(body.source ?? ""),
      String(body.niveau_confiance ?? "moyen")
    );
  logAudit(admin.username, "create", "zone_adaptation", Number(res.lastInsertRowid), `${varietyId}/${communeId}/${zoneType}`);
  return NextResponse.json({ id: Number(res.lastInsertRowid) });
}
