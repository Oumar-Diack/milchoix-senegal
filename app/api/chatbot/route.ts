import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase } from "@/lib/ensure-db";
import { generateReply, detectLanguage, type ChatLanguage } from "@/lib/chatbot";

export async function POST(req: NextRequest) {
  let body: { message?: string; language?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Message vide." }, { status: 400 });
  }

  ensureDatabase();

  const requested = body.language;
  const lang: ChatLanguage =
    requested === "en" || requested === "wo" || requested === "fr"
      ? requested
      : detectLanguage(message);

  const reply = generateReply(message, lang);
  return NextResponse.json({ reply, language: lang });
}
