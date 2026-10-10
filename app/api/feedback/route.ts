import { NextRequest, NextResponse } from "next/server";
import { saveFeedback } from "@/lib/queries";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const recommendationId = body.recommendationId ? Number(body.recommendationId) : null;
  const varietyId = body.varietyId ? Number(body.varietyId) : null;
  const notePertinence = body.notePertinence != null ? Number(body.notePertinence) : null;
  const noteComprehension =
    body.noteComprehension != null ? Number(body.noteComprehension) : null;
  const commentaire = String(body.commentaire ?? "");

  if (!recommendationId && !varietyId) {
    return NextResponse.json({ error: "Référence manquante." }, { status: 400 });
  }

  saveFeedback({
    recommendation_id: recommendationId,
    variety_id: varietyId,
    note_pertinence: notePertinence,
    note_comprehension: noteComprehension,
    commentaire,
  });

  return NextResponse.json({ ok: true });
}
