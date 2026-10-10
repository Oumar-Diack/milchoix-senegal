"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Identifiants incorrects.");
        setLoading(false);
        return;
      }
      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Nom d'utilisateur</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border border-stone-300 rounded-lg px-3 py-2 text-sm"
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-stone-300 rounded-lg px-3 py-2 text-sm"
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 rounded-lg bg-mil-700 text-white font-semibold hover:bg-mil-800 disabled:opacity-50"
      >
        {loading ? "Connexion…" : "Se connecter"}
      </button>
      <p className="text-xs text-stone-400">
        Identifiants par défaut : admin / milchoix2026 (voir variables
        MILCHOIX_ADMIN_USERNAME et MILCHOIX_ADMIN_PASSWORD).
      </p>
    </form>
  );
}
