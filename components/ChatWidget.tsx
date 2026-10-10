"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const LANG_LABELS: Record<string, string> = { fr: "Français", en: "English", wo: "Wolof" };

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<string>("auto");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Bonjour ! Je suis l'assistant de MilChoix Sénégal. Posez-moi une question sur les variétés de mil.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, loading]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, language: lang === "auto" ? undefined : lang }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.reply ?? "Une erreur est survenue." },
      ]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Impossible de contacter le serveur." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl border border-stone-200 bg-white flex flex-col overflow-hidden">
          <div className="bg-mil-900 text-white px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-semibold">Assistant MilChoix</p>
              <p className="text-xs text-mil-200">Chatbot multilingue</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Fermer" className="text-white/80 hover:text-white">
              ✕
            </button>
          </div>

          <div className="px-3 py-2 flex gap-1 border-b border-stone-100">
            {["auto", "fr", "en", "wo"].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2 py-1 rounded text-xs ${
                  lang === l ? "bg-mil-700 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {l === "auto" ? "Auto" : LANG_LABELS[l]}
              </button>
            ))}
          </div>

          <div ref={listRef} className="flex-1 p-3 space-y-3 overflow-y-auto max-h-80">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] whitespace-pre-line px-3 py-2 rounded-2xl text-sm ${
                    m.role === "user"
                      ? "bg-mil-700 text-white rounded-br-sm"
                      : "bg-stone-100 text-stone-800 rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-2xl bg-stone-100 text-stone-500 text-sm">…</div>
              </div>
            )}
          </div>

          <form onSubmit={send} className="p-3 border-t border-stone-100 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Votre question…"
              className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mil-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-2 rounded-lg bg-mil-700 text-white text-sm font-semibold disabled:opacity-50"
            >
              Envoyer
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Ouvrir l'assistant"
        className="fixed bottom-6 right-4 z-50 h-14 w-14 rounded-full bg-mil-700 text-white shadow-lg hover:bg-mil-800 transition grid place-items-center"
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
