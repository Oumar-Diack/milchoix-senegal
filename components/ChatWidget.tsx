"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
}

const LANG_LABELS: Record<string, string> = { fr: "Français", en: "English", wo: "Wolof" };

const MAX_MESSAGES = 60;

// Bulle mémorisée : seules les bulles dont le texte change sont re-rendues
// pendant le streaming (les messages précédents restent stables).
const MessageBubble = memo(function MessageBubble({
  role,
  text,
  streaming,
}: {
  role: "user" | "assistant";
  text: string;
  streaming: boolean;
}) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] whitespace-pre-line px-3 py-2 rounded-2xl text-sm ${
          role === "user"
            ? "bg-mil-700 text-white rounded-br-sm"
            : "bg-stone-100 text-stone-800 rounded-bl-sm"
        }`}
      >
        {text}
        {streaming && (
          <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse rounded-sm bg-stone-400 align-text-bottom" />
        )}
      </div>
    </div>
  );
});

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<string>("auto");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      text: "Bonjour ! Je suis l'assistant de MilChoix Sénégal. Posez-moi une question sur les variétés de mil, les zones d'adaptation ou le climat.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<number | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const nextIdRef = useRef(1);
  const stickToBottomRef = useRef(true);
  // Contexte conversationnel renvoyé par le serveur au tour précédent. Il est
  // opaque côté client : le serveur le revalide intégralement.
  const contextRef = useRef<unknown>({});

  const scrollToBottom = useCallback(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, []);

  useEffect(() => {
    if (stickToBottomRef.current) scrollToBottom();
  }, [messages, open, scrollToBottom]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Annule la requête en cours si le composant est démonté.
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const handleScroll = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const distance = list.scrollHeight - list.scrollTop - list.clientHeight;
    stickToBottomRef.current = distance < 48;
  }, []);

  const appendMessage = useCallback((message: Message) => {
    setMessages((current) => [...current, message].slice(-MAX_MESSAGES));
  }, []);

  const patchMessage = useCallback((id: number, delta: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, text: message.text + delta } : message
      )
    );
  }, []);

  const removeMessage = useCallback((id: number) => {
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);

  async function send(event?: React.FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { id: nextIdRef.current++, role: "user", text };
    const assistantId = nextIdRef.current++;

    stickToBottomRef.current = true;
    setInput("");
    appendMessage(userMessage);
    appendMessage({ id: assistantId, role: "assistant", text: "" });
    setLoading(true);
    setStreamingId(assistantId);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          message: text,
          language: lang === "auto" ? undefined : lang,
          stream: true,
          context: contextRef.current,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Une erreur est survenue.");
      }

      const contentType = res.headers.get("content-type") ?? "";

      // Repli JSON si le serveur ne diffuse pas d'événements.
      if (!contentType.includes("text/event-stream") || !res.body) {
        const data = await res.json();
        if (data.context) contextRef.current = data.context;
        patchMessage(assistantId, data.reply ?? "Une erreur est survenue.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const read = await reader.read();
        if (read.done) break;

        buffer += decoder.decode(read.value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const eventChunk of events) {
          const dataLine = eventChunk
            .split("\n")
            .find((line) => line.startsWith("data: "));
          if (!dataLine) continue;

          let payload: { delta?: string; done?: boolean; context?: unknown };
          try {
            payload = JSON.parse(dataLine.slice(6));
          } catch {
            continue;
          }

          if (payload.context) contextRef.current = payload.context;
          if (payload.delta) patchMessage(assistantId, payload.delta);
          if (payload.done) done = true;
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        removeMessage(assistantId);
      } else {
        patchMessage(
          assistantId,
          error instanceof Error && error.message !== "Une erreur est survenue."
            ? `Impossible de contacter le serveur (${error.message}).`
            : "Impossible de contacter le serveur. Réessayez dans un instant."
        );
      }
    } finally {
      setLoading(false);
      setStreamingId(null);
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  function close() {
    abortRef.current?.abort();
    setOpen(false);
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-mil-900 px-4 py-3 text-white">
            <div>
              <p className="font-semibold">Assistant MilChoix</p>
              <p className="text-xs text-mil-200">Réponses issues des données de la plateforme</p>
            </div>
            <button
              onClick={close}
              aria-label="Fermer l'assistant"
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="flex gap-1 border-b border-stone-100 px-3 py-2">
            {["auto", "fr", "en", "wo"].map((value) => (
              <button
                key={value}
                onClick={() => setLang(value)}
                className={`rounded px-2 py-1 text-xs ${
                  lang === value
                    ? "bg-mil-700 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {value === "auto" ? "Auto" : LANG_LABELS[value]}
              </button>
            ))}
          </div>

          <div
            ref={listRef}
            onScroll={handleScroll}
            role="log"
            aria-live="polite"
            aria-label="Conversation"
            className="max-h-80 flex-1 space-y-3 overflow-y-auto p-3"
          >
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                role={message.role}
                text={message.text}
                streaming={message.id === streamingId}
              />
            ))}
          </div>

          <form onSubmit={send} className="flex gap-2 border-t border-stone-100 p-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Votre question…"
              aria-label="Votre question"
              maxLength={1000}
              className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mil-400"
            />
            <button
              type="submit"
              disabled={loading || input.trim().length === 0}
              className="rounded-lg bg-mil-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Envoyer
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((value) => !value)}
        aria-label="Ouvrir l'assistant"
        className="fixed bottom-6 right-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-mil-700 text-white shadow-lg transition hover:bg-mil-800"
      >
        {open ? (
          <span className="text-xl leading-none">✕</span>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
            <path d="M12 3C6.48 3 2 6.86 2 11.5c0 2.48 1.2 4.7 3.1 6.2-.1 1-.5 2.2-1.3 3.3 2.1-.3 3.7-1 4.9-1.9.8.2 1.6.3 2.4.3 5.52 0 10-3.86 10-8.5S17.52 3 12 3z" />
          </svg>
        )}
      </button>
    </>
  );
}
