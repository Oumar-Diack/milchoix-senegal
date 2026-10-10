import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ensureDatabase } from "@/lib/ensure-db";
import { requireAdmin } from "@/lib/auth";
import {
  addVarietyPhoto,
  deleteVarietyPhoto,
  setCoverPhoto,
  getVarietyPhotos,
  logAudit,
} from "@/lib/queries";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 Mo
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const { id } = await params;
  return NextResponse.json(getVarietyPhotos(Number(id)));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const { id } = await params;
  const varietyId = Number(id);

  ensureDatabase();
  const db = getDb();
  const exists = db.prepare("SELECT id FROM varieties WHERE id = ?").get(varietyId);
  if (!exists) return NextResponse.json({ error: "Variété introuvable." }, { status: 404 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formulaire invalide." }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const legende = String(form.get("legende") ?? "");

  if (files.length === 0) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }

  const added: number[] = [];
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: `Fichier trop volumineux (${file.name}). Max 8 Mo.` }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Type non autorisé (${file.name}).` }, { status: 400 });
    }
    const buf = new Uint8Array(await file.arrayBuffer());
    const photoId = addVarietyPhoto(varietyId, buf, file.type, legende, "téléversé par " + admin.username);
    added.push(photoId);
  }

  logAudit(admin.username, "upload_photos", "variete", varietyId, `${added.length} photo(s)`);
  return NextResponse.json({ ok: true, added });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const { id } = await params;
  const photoId = Number(new URL(req.url).searchParams.get("photoId"));
  if (!photoId) return NextResponse.json({ error: "photoId manquant." }, { status: 400 });

  deleteVarietyPhoto(photoId);
  logAudit(admin.username, "delete_photo", "variete", Number(id), `photo ${photoId}`);
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const { id } = await params;
  let body: { photoId?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }
  if (!body.photoId) return NextResponse.json({ error: "photoId manquant." }, { status: 400 });

  setCoverPhoto(Number(id), body.photoId);
  logAudit(admin.username, "set_cover_photo", "variete", Number(id), `photo ${body.photoId}`);
  return NextResponse.json({ ok: true });
}
