"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

type Tab = "varietes" | "communes" | "climat" | "retours" | "journal";

interface OverviewData {
  varieties: Record<string, unknown>[];
  communes: Record<string, unknown>[];
  climat: Record<string, unknown>[];
  feedbacks: Record<string, unknown>[];
  audit: Record<string, unknown>[];
  users: Record<string, unknown>[];
}

const VARIETY_FORM_FIELDS: { key: string; label: string; type: "text" | "number" | "textarea" | "select"; options?: { value: string; label: string }[] }[] = [
  { key: "nom_officiel", label: "Nom officiel *", type: "text" },
  { key: "noms_locaux", label: "Noms locaux", type: "text" },
  {
    key: "statut",
    label: "Statut",
    type: "select",
    options: [
      { value: "homologuee", label: "Homologuée" },
      { value: "traditionnelle", label: "Traditionnelle" },
      { value: "en_evaluation", label: "En évaluation" },
    ],
  },
  { key: "annee_homologation", label: "Année d'homologation", type: "number" },
  { key: "obtenteur", label: "Obtenteur", type: "text" },
  { key: "type_mil", label: "Type de mil", type: "text" },
  { key: "duree_cycle_jours", label: "Durée de cycle (jours)", type: "number" },
  {
    key: "precocite",
    label: "Précocité",
    type: "select",
    options: [
      { value: "très précoce", label: "Très précoce" },
      { value: "précoce", label: "Précoce" },
      { value: "semi-précoce", label: "Semi-précoce" },
      { value: "tardif", label: "Tardif" },
    ],
  },
  { key: "besoins_pluvio_min_mm", label: "Besoins en eau min (mm)", type: "number" },
  { key: "besoins_pluvio_max_mm", label: "Besoins en eau max (mm)", type: "number" },
  { key: "tolerance_secheresse", label: "Tolérance sécheresse", type: "text" },
  { key: "resistances_maladies", label: "Maladies", type: "text" },
  { key: "reaction_ravageurs", label: "Ravageurs", type: "text" },
  { key: "rendement_potentiel_min_kg", label: "Rendement potentiel min (kg/ha)", type: "number" },
  { key: "rendement_potentiel_max_kg", label: "Rendement potentiel max (kg/ha)", type: "number" },
  { key: "rendement_observe_moyen_kg", label: "Rendement observé moyen (kg/ha)", type: "number" },
  { key: "caracteristiques_grain", label: "Caractéristiques du grain", type: "text" },
  { key: "usages_alimentaires", label: "Usages alimentaires", type: "text" },
  { key: "exigences_pedologiques", label: "Exigences pédologiques", type: "text" },
  { key: "disponibilite_semences", label: "Disponibilité des semences", type: "text" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "source", label: "Source", type: "text" },
  {
    key: "statut_validation",
    label: "Statut de validation",
    type: "select",
    options: [
      { value: "officiel", label: "Source officielle" },
      { value: "essai", label: "Résultat d'essai" },
      { value: "terrain", label: "Observation de terrain" },
      { value: "estimation", label: "Estimation" },
      { value: "a_valider", label: "À valider" },
    ],
  },
];

function toPayload(form: Record<string, string>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const f of VARIETY_FORM_FIELDS) {
    const v = form[f.key];
    if (f.type === "number") {
      payload[f.key] = v === "" ? null : Number(v);
    } else {
      payload[f.key] = v;
    }
  }
  return payload;
}

export function AdminDashboard({ username }: { username: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("varietes");
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Variété en cours d'édition
  const [editingVariety, setEditingVariety] = useState<Record<string, unknown> | null>(null);
  const [showVarietyForm, setShowVarietyForm] = useState(false);
  const [varietyForm, setVarietyForm] = useState<Record<string, string>>({});

  // Gestion des photos
  const [photoManagerFor, setPhotoManagerFor] = useState<{ id: number; nom: string } | null>(null);
  const [photos, setPhotos] = useState<Record<string, unknown>[]>([]);
  const [uploading, setUploading] = useState(false);
  const [photoLegend, setPhotoLegend] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Communes / climat : formulaires simples
  const [communeForm, setCommuneForm] = useState({ nom: "", departement: "", region: "", latitude: "", longitude: "" });
  const [climatForm, setClimatForm] = useState({ commune_id: "", annee: "", cumul_pluvio_mm: "", duree_saison_jours: "", nb_sequences_seches: "", duree_max_seche_jours: "", prevision_saison: "" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/overview");
      if (res.status === 401) {
        router.push("/admin");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  // ---- Variétés ----
  function openNewVariety() {
    const empty: Record<string, string> = {};
    for (const f of VARIETY_FORM_FIELDS) empty[f.key] = "";
    empty.statut = "homologuee";
    empty.statut_validation = "officiel";
    setVarietyForm(empty);
    setEditingVariety(null);
    setShowVarietyForm(true);
  }

  function openEditVariety(v: Record<string, unknown>) {
    const form: Record<string, string> = {};
    for (const f of VARIETY_FORM_FIELDS) {
      const val = v[f.key];
      form[f.key] = val == null ? "" : String(val);
    }
    setVarietyForm(form);
    setEditingVariety(v);
    setShowVarietyForm(true);
  }

  async function saveVariety(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload = toPayload(varietyForm);
    try {
      const res = editingVariety
        ? await fetch(`/api/admin/varieties/${editingVariety.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/varieties", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Erreur lors de l'enregistrement.");
        return;
      }
      setShowVarietyForm(false);
      load();
    } catch {
      setError("Impossible de contacter le serveur.");
    }
  }

  async function togglePublish(v: Record<string, unknown>) {
    await fetch(`/api/admin/varieties/${v.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: v.published ? 0 : 1 }),
    });
    load();
  }

  async function deleteVariety(v: Record<string, unknown>) {
    if (!confirm(`Supprimer la variété « ${v.nom_officiel} » ?`)) return;
    await fetch(`/api/admin/varieties/${v.id}`, { method: "DELETE" });
    load();
  }

  async function openPhotoManager(v: Record<string, unknown>) {
    setPhotoManagerFor({ id: Number(v.id), nom: String(v.nom_officiel) });
    setPhotoLegend("");
    await loadPhotos(Number(v.id));
  }

  async function loadPhotos(varietyId: number) {
    const res = await fetch(`/api/admin/varieties/${varietyId}/photos`);
    if (res.ok) setPhotos(await res.json());
  }

  async function uploadPhotos() {
    if (!photoManagerFor || !fileInputRef.current?.files?.length) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      for (const f of Array.from(fileInputRef.current.files)) fd.append("files", f);
      if (photoLegend.trim()) fd.append("legende", photoLegend.trim());
      const res = await fetch(`/api/admin/varieties/${photoManagerFor.id}/photos`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Erreur lors du téléversement.");
      } else {
        if (fileInputRef.current) fileInputRef.current.value = "";
        setPhotoLegend("");
        await loadPhotos(photoManagerFor.id);
      }
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setUploading(false);
    }
  }

  async function setCover(photoId: unknown) {
    if (!photoManagerFor) return;
    await fetch(`/api/admin/varieties/${photoManagerFor.id}/photos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId }),
    });
    await loadPhotos(photoManagerFor.id);
  }

  async function deletePhoto(photoId: unknown) {
    if (!photoManagerFor || !confirm("Supprimer cette photo ?")) return;
    await fetch(`/api/admin/varieties/${photoManagerFor.id}/photos?photoId=${photoId}`, {
      method: "DELETE",
    });
    await loadPhotos(photoManagerFor.id);
  }

  async function addCommune(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/communes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(communeForm),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Erreur.");
        return;
      }
      setCommuneForm({ nom: "", departement: "", region: "", latitude: "", longitude: "" });
      load();
    } catch {
      setError("Impossible de contacter le serveur.");
    }
  }

  async function addClimat(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/climat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(climatForm),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Erreur.");
        return;
      }
      load();
    } catch {
      setError("Impossible de contacter le serveur.");
    }
  }

  const inputCls =
    "border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-mil-400";

  const tabs: { key: Tab; label: string }[] = [
    { key: "varietes", label: "Variétés" },
    { key: "communes", label: "Communes" },
    { key: "climat", label: "Climat" },
    { key: "retours", label: "Retours utilisateurs" },
    { key: "journal", label: "Journal" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-mil-900">Administration</h1>
          <p className="text-sm text-stone-500">Connecté en tant que {username}</p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 rounded-lg border border-stone-300 text-sm font-semibold hover:bg-stone-100"
        >
          Se déconnecter
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-1 border-b border-stone-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              tab === t.key
                ? "bg-mil-700 text-white"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-10 text-stone-500">Chargement…</p>
      ) : !data ? (
        <p className="mt-10 text-stone-500">Aucune donnée.</p>
      ) : (
        <div className="mt-6">
          {tab === "varietes" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-stone-500">
                  {data.varieties.length} variétés
                </p>
                <button
                  onClick={openNewVariety}
                  className="px-4 py-2 rounded-lg bg-mil-700 text-white text-sm font-semibold hover:bg-mil-800"
                >
                  + Nouvelle variété
                </button>
              </div>

              {showVarietyForm && (
                <form
                  onSubmit={saveVariety}
                  className="mb-6 rounded-xl border border-stone-200 bg-white p-6 shadow-sm grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  <h2 className="sm:col-span-2 lg:col-span-3 font-bold text-mil-900">
                    {editingVariety ? "Modifier la variété" : "Nouvelle variété"}
                  </h2>
                  {VARIETY_FORM_FIELDS.map((f) => (
                    <div key={f.key} className={`flex flex-col gap-1 ${f.type === "textarea" ? "sm:col-span-2 lg:col-span-3" : ""}`}>
                      <label className="text-xs font-medium text-stone-600">{f.label}</label>
                      {f.type === "textarea" ? (
                        <textarea
                          value={varietyForm[f.key] ?? ""}
                          onChange={(e) => setVarietyForm({ ...varietyForm, [f.key]: e.target.value })}
                          className={inputCls}
                          rows={2}
                        />
                      ) : f.type === "select" ? (
                        <select
                          value={varietyForm[f.key] ?? ""}
                          onChange={(e) => setVarietyForm({ ...varietyForm, [f.key]: e.target.value })}
                          className={inputCls}
                        >
                          {f.options?.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={f.type}
                          value={varietyForm[f.key] ?? ""}
                          onChange={(e) => setVarietyForm({ ...varietyForm, [f.key]: e.target.value })}
                          className={inputCls}
                        />
                      )}
                    </div>
                  ))}
                  <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
                    <button type="submit" className="px-4 py-2 rounded-lg bg-mil-700 text-white text-sm font-semibold">
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowVarietyForm(false)}
                      className="px-4 py-2 rounded-lg border border-stone-300 text-sm"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-50 text-left text-stone-500">
                      <th className="p-3 font-medium">Nom</th>
                      <th className="p-3 font-medium">Statut</th>
                      <th className="p-3 font-medium">Cycle</th>
                      <th className="p-3 font-medium">Validation</th>
                      <th className="p-3 font-medium">Publié</th>
                      <th className="p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.varieties.map((v) => (
                      <tr key={String(v.id)} className="border-t border-stone-100">
                        <td className="p-3 font-medium text-stone-800">{String(v.nom_officiel)}</td>
                        <td className="p-3 text-stone-600">{String(v.statut)}</td>
                        <td className="p-3 text-stone-600">
                          {v.duree_cycle_jours != null ? `${v.duree_cycle_jours} j` : "—"}
                        </td>
                        <td className="p-3 text-stone-600">{String(v.statut_validation)}</td>
                        <td className="p-3">
                          <button
                            onClick={() => togglePublish(v)}
                            className={`px-2 py-1 rounded-full text-xs ${
                              v.published ? "bg-leaf-100 text-leaf-700" : "bg-stone-100 text-stone-500"
                            }`}
                          >
                            {v.published ? "Publiée" : "Non publiée"}
                          </button>
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => openPhotoManager(v)}
                            className="px-2 py-1 text-xs text-leaf-700 hover:underline"
                          >
                            Photos
                          </button>
                          <button
                            onClick={() => openEditVariety(v)}
                            className="px-2 py-1 text-xs text-mil-700 hover:underline"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => deleteVariety(v)}
                            className="px-2 py-1 text-xs text-red-600 hover:underline"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {photoManagerFor && (
                <div className="mt-6 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-mil-900">
                      Photos de « {photoManagerFor.nom} »
                    </h2>
                    <button
                      onClick={() => setPhotoManagerFor(null)}
                      className="px-3 py-1 rounded-lg border border-stone-300 text-sm"
                    >
                      Fermer
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-stone-500">Sélectionner des images (JPG, PNG, WebP, GIF — max 8 Mo)</label>
                      <input ref={fileInputRef} type="file" accept="image/*" multiple className="text-sm" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-stone-500">Légende (facultatif)</label>
                      <input value={photoLegend} onChange={(e) => setPhotoLegend(e.target.value)} className={inputCls} />
                    </div>
                    <button
                      onClick={uploadPhotos}
                      disabled={uploading}
                      className="px-4 py-2 rounded-lg bg-mil-700 text-white text-sm font-semibold disabled:opacity-50"
                    >
                      {uploading ? "Téléversement…" : "Téléverser"}
                    </button>
                  </div>

                  {photos.length === 0 ? (
                    <p className="mt-4 text-sm text-stone-400">Aucune photo pour cette variété.</p>
                  ) : (
                    <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                      {photos.map((p) => (
                        <div key={String(p.id)} className="rounded-lg border border-stone-200 overflow-hidden">
                          <div className="h-32 bg-stone-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`/api/photos/${p.id}`} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="p-2">
                            <p className="text-xs text-stone-500 truncate">
                              {p.legende ? String(p.legende) : "Sans légende"}
                              {p.is_cover ? (
                                <span className="ml-1 px-1.5 py-0.5 rounded bg-leaf-100 text-leaf-700 text-[10px]">Couverture</span>
                              ) : null}
                            </p>
                            <div className="mt-2 flex gap-2">
                              {!p.is_cover && (
                                <button onClick={() => setCover(p.id)} className="text-xs text-mil-700 hover:underline">
                                  Définir couverture
                                </button>
                              )}
                              <button onClick={() => deletePhoto(p.id)} className="text-xs text-red-600 hover:underline">
                                Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === "communes" && (
            <div>
              <form onSubmit={addCommune} className="mb-6 rounded-xl border border-stone-200 bg-white p-6 shadow-sm grid gap-4 sm:grid-cols-5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-stone-500">Nom *</label>
                  <input value={communeForm.nom} onChange={(e) => setCommuneForm({ ...communeForm, nom: e.target.value })} className={inputCls} required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-stone-500">Département</label>
                  <input value={communeForm.departement} onChange={(e) => setCommuneForm({ ...communeForm, departement: e.target.value })} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-stone-500">Région</label>
                  <input value={communeForm.region} onChange={(e) => setCommuneForm({ ...communeForm, region: e.target.value })} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-stone-500">Latitude *</label>
                  <input value={communeForm.latitude} onChange={(e) => setCommuneForm({ ...communeForm, latitude: e.target.value })} className={inputCls} required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-stone-500">Longitude *</label>
                  <input value={communeForm.longitude} onChange={(e) => setCommuneForm({ ...communeForm, longitude: e.target.value })} className={inputCls} required />
                </div>
                <div className="sm:col-span-5">
                  <button type="submit" className="px-4 py-2 rounded-lg bg-mil-700 text-white text-sm font-semibold">
                    Ajouter la commune
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-50 text-left text-stone-500">
                      <th className="p-3 font-medium">Nom</th>
                      <th className="p-3 font-medium">Département</th>
                      <th className="p-3 font-medium">Région</th>
                      <th className="p-3 font-medium">Lat / Lng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.communes.map((c) => (
                      <tr key={String(c.id)} className="border-t border-stone-100">
                        <td className="p-3 font-medium">{String(c.nom)}</td>
                        <td className="p-3 text-stone-600">{String(c.departement)}</td>
                        <td className="p-3 text-stone-600">{String(c.region)}</td>
                        <td className="p-3 text-stone-600">
                          {String(c.latitude)}, {String(c.longitude)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "climat" && (
            <div>
              <form onSubmit={addClimat} className="mb-6 rounded-xl border border-stone-200 bg-white p-6 shadow-sm grid gap-4 sm:grid-cols-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-stone-500">Commune *</label>
                  <select value={climatForm.commune_id} onChange={(e) => setClimatForm({ ...climatForm, commune_id: e.target.value })} className={inputCls} required>
                    <option value="">—</option>
                    {data.communes.map((c) => (
                      <option key={String(c.id)} value={String(c.id)}>
                        {String(c.nom)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-stone-500">Année *</label>
                  <input value={climatForm.annee} onChange={(e) => setClimatForm({ ...climatForm, annee: e.target.value })} className={inputCls} required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-stone-500">Cumul pluvio (mm)</label>
                  <input value={climatForm.cumul_pluvio_mm} onChange={(e) => setClimatForm({ ...climatForm, cumul_pluvio_mm: e.target.value })} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-stone-500">Durée saison (jours)</label>
                  <input value={climatForm.duree_saison_jours} onChange={(e) => setClimatForm({ ...climatForm, duree_saison_jours: e.target.value })} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-stone-500">Nb séquences sèches</label>
                  <input value={climatForm.nb_sequences_seches} onChange={(e) => setClimatForm({ ...climatForm, nb_sequences_seches: e.target.value })} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-stone-500">Durée max sécheresse (j)</label>
                  <input value={climatForm.duree_max_seche_jours} onChange={(e) => setClimatForm({ ...climatForm, duree_max_seche_jours: e.target.value })} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-stone-500">Prévision saison</label>
                  <input value={climatForm.prevision_saison} onChange={(e) => setClimatForm({ ...climatForm, prevision_saison: e.target.value })} className={inputCls} />
                </div>
                <div className="sm:col-span-4">
                  <button type="submit" className="px-4 py-2 rounded-lg bg-mil-700 text-white text-sm font-semibold">
                    Enregistrer les données climatiques
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-50 text-left text-stone-500">
                      <th className="p-3 font-medium">Commune</th>
                      <th className="p-3 font-medium">Année</th>
                      <th className="p-3 font-medium">Cumul (mm)</th>
                      <th className="p-3 font-medium">Saison (j)</th>
                      <th className="p-3 font-medium">Séquences sèches</th>
                      <th className="p-3 font-medium">Prévision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.climat.map((c) => (
                      <tr key={String(c.id)} className="border-t border-stone-100">
                        <td className="p-3 font-medium">{String(c.commune_nom)}</td>
                        <td className="p-3 text-stone-600">{String(c.annee)}</td>
                        <td className="p-3 text-stone-600">{String(c.cumul_pluvio_mm)}</td>
                        <td className="p-3 text-stone-600">{String(c.duree_saison_jours)}</td>
                        <td className="p-3 text-stone-600">{String(c.nb_sequences_seches)}</td>
                        <td className="p-3 text-stone-600">{String(c.prevision_saison)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "retours" && (
            <div className="rounded-xl border border-stone-200 bg-white">
              {data.feedbacks.length === 0 ? (
                <p className="p-6 text-stone-500">Aucun retour utilisateur pour le moment.</p>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {data.feedbacks.map((f) => (
                    <li key={String(f.id)} className="p-4 text-sm">
                      <div className="flex flex-wrap gap-2 items-center">
                        {Boolean(f.nom_officiel) && <span className="font-semibold text-mil-900">{String(f.nom_officiel)}</span>}
                        {Boolean(f.commune) && <span className="text-stone-500">({String(f.commune)})</span>}
                        {f.note_pertinence != null && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-mil-100 text-mil-800">
                            Pertinence : {String(f.note_pertinence)}/5
                          </span>
                        )}
                        {f.note_comprehension != null && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-leaf-100 text-leaf-700">
                            Compréhension : {String(f.note_comprehension)}/5
                          </span>
                        )}
                        <span className="text-stone-400 text-xs">{String(f.created_at)}</span>
                      </div>
                      {Boolean(f.commentaire) && <p className="mt-2 text-stone-600">« {String(f.commentaire)} »</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "journal" && (
            <div className="rounded-xl border border-stone-200 bg-white">
              {data.audit.length === 0 ? (
                <p className="p-6 text-stone-500">Aucune entrée dans le journal.</p>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {data.audit.map((a) => (
                    <li key={String(a.id)} className="p-4 text-sm flex gap-3 items-start">
                      <span className="text-stone-400 text-xs whitespace-nowrap">{String(a.created_at)}</span>
                      <span className="font-semibold text-stone-700">{String(a.username)}</span>
                      <span className="text-mil-700">{String(a.action)}</span>
                      <span className="text-stone-600">{String(a.entity_type)}</span>
                      {a.entity_id != null && <span className="text-stone-500">#{String(a.entity_id)}</span>}
                      {Boolean(a.details) && <span className="text-stone-500">{String(a.details)}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
