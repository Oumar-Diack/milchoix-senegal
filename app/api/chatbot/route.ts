import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase } from "@/lib/ensure-db";
import { logAudit } from "@/lib/queries";
import {
  answerQuestion,
  detectLanguage,
  type ChatLanguage,
} from "@/lib/chatbot";

// Découpe la réponse en morceaux diffusables (phrases / lignes), sans jamais
// couper un mot. Le premier morceau est envoyé immédiatement.
function chunkReply(reply: string): string[] {
  const parts = reply.split(/(?<=\n)|(?<=[.!?…])\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const part of parts) {
    if (current && current.length + part.length > 140) {
      chunks.push(current);
      current = part;
    } else {
      current += part;
    }
  }
  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [reply];
}

/**
 * Journalise les questions restées sans réponse pour piloter l'amélioration du
 * moteur (visibles dans le journal d'audit admin). Une panne de journalisation
 * ne doit jamais faire échouer la réponse.
 */
function logUnanswered(message: string, language: ChatLanguage): void {
  try {
    logAudit(
      "",
      "chat_unanswered",
      "chat",
      null,
      JSON.stringify({ message: message.slice(0, 500), language })
    );
  } catch {
    // Journalisation best-effort uniquement.
  }
}

export async function POST(req: NextRequest) {
  let body: {
    message?: string;
    language?: string;
    stream?: boolean;
    context?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Message vide." }, { status: 400 });
  }
  if (message.length > 1000) {
    return NextResponse.json(
      { error: "Message trop long (1000 caractères maximum)." },
      { status: 400 }
    );
  }

  ensureDatabase();

  const requested = body.language;
  const lang: ChatLanguage =
    requested === "en" || requested === "wo" || requested === "fr"
      ? requested
      : detectLanguage(message);

  const answer = answerQuestion(message, lang, body.context);
  if (!answer.matched) logUnanswered(message, lang);

  const wantsStream =
    body.stream === true ||
    (req.headers.get("accept") ?? "").includes("text/event-stream");

  if (!wantsStream) {
    return NextResponse.json({
      reply: answer.reply,
      language: lang,
      context: answer.context,
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(
        encoder.encode(
          `event: meta\ndata: ${JSON.stringify({
            language: lang,
            context: answer.context,
          })}\n\n`
        )
      );

      for (const chunk of chunkReply(answer.reply)) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ delta: chunk })}\n\n`)
        );
        // Laisse la main à la boucle d'événements pour que le navigateur peigne
        // chaque morceau progressivement.
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
