"use client";

import { useState } from "react";

export function FeedbackForm({
  recommendationId,
  varietyId,
  label,
  kind,
}: {
  recommendationId: number | null;
  varietyId: number | null;
  label: string;
  kind: "pertinence" | "comprehension";
}) {
  const [note, setNote] = useState<number | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendationId,
          varietyId,
          notePertinence: kind === "pertinence" ? note : null,
          noteComprehension: kind === "comprehension" ? note : null,
          commentaire,
        }),
      });
      if (!res.ok) {
        setError("Erreur lors de l'envoi.");
        return;
      }
      setSent(true);
    } catch {
      setError("Impossible de contacter le serveur.");
    }
  }

  if (sent) {
    return <p className="text-sm text-leaf-700">Merci pour votre retour.</p>;
  }

  return (
    <div className="mt-4 rounded-lg bg-stone-50 border border-stone-200 p-4">
      <p className="text-sm font-medium text-stone-700">{label}</p>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setNote(n)}
            aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
            className={`text-2xl leading-none ${note && n <= note ? "text-mil-500" : "text-stone-300"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={commentaire}
        onChange={(e) => setCommentaire(e.target.value)}
        placeholder="Commentaire (facultatif)"
        className="mt-2 w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
        rows={2}
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={note == null}
          className="px-3 py-1.5 rounded-lg bg-mil-700 text-white text-sm font-semibold disabled:opacity-40"
        >
          Envoyer
        </button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}
