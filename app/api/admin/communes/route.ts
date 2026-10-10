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
  return NextResponse.json(db.prepare("SELECT * FROM communes ORDER BY nom").all());
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
  if (!body.nom || !body.latitude || !body.longitude) {
    return NextResponse.json({ error: "Nom, latitude et longitude requis." }, { status: 400 });
  }
  ensureDatabase();
  const db = getDb();
  const res = db
    .prepare(
      "INSERT INTO communes (nom, departement, region, latitude, longitude, zone_sylvopastorale, source) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(
      String(body.nom),
      String(body.departement ?? ""),
      String(body.region ?? ""),
      Number(body.latitude),
      Number(body.longitude),
      body.zone_sylvopastorale ? 1 : 0,
      String(body.source ?? "")
    );
  logAudit(admin.username, "create", "commune", Number(res.lastInsertRowid), String(body.nom));
  return NextResponse.json({ id: Number(res.lastInsertRowid) });
}
