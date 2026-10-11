import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/queries";

const ZONE_TYPES = ["officielle", "historique", "potentielle"];

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
  const existing = db.prepare("SELECT id FROM variety_zones WHERE id = ?").get(Number(id));
  if (!existing) {
    return NextResponse.json({ error: "Zone introuvable." }, { status: 404 });
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

  const dup = db
    .prepare("SELECT id FROM variety_zones WHERE variety_id = ? AND commune_id = ? AND zone_type = ? AND id != ?")
    .get(varietyId, communeId, zoneType, Number(id));
  if (dup) {
    return NextResponse.json(
      { error: "Cette zone existe déjà pour cette variété et cette commune." },
      { status: 409 }
    );
  }

  db.prepare(
    "UPDATE variety_zones SET variety_id = ?, commune_id = ?, zone_type = ?, source = ?, niveau_confiance = ?, date_maj = datetime('now') WHERE id = ?"
  ).run(
    varietyId,
    communeId,
    zoneType,
    String(body.source ?? ""),
    String(body.niveau_confiance ?? "moyen"),
    Number(id)
  );
  logAudit(admin.username, "update", "zone_adaptation", Number(id), `${varietyId}/${communeId}/${zoneType}`);
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
  db.prepare("DELETE FROM variety_zones WHERE id = ?").run(Number(id));
  logAudit(admin.username, "delete", "zone_adaptation", Number(id), "");
  return NextResponse.json({ ok: true });
}
