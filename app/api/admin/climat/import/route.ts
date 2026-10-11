import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ensureDatabase } from "@/lib/ensure-db";
import { requireAdmin } from "@/lib/auth";
import { importClimatCSV } from "@/lib/climat-import";
import { logAudit } from "@/lib/queries";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  ensureDatabase();
  const db = getDb();

  let text: string | null = null;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (file instanceof File) {
      text = await file.text();
    }
  } else {
    text = await req.text();
  }

  if (!text || !text.trim()) {
    return NextResponse.json({ error: "Aucun contenu reçu." }, { status: 400 });
  }

  try {
    const result = importClimatCSV(db, text);
    logAudit(
      admin.username,
      "import_climat",
      "climat",
      null,
      `${result.inserted} insérée(s), ${result.updated} mise(s) à jour, ${result.errors.length} erreur(s)`
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur lors de l'import." },
      { status: 400 }
    );
  }
}
