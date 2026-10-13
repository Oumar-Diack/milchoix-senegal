import { NextRequest, NextResponse } from "next/server";
import { getRecommendation, getCommune } from "@/lib/queries";
import { CLASSIFICATION_LABELS, type Classification } from "@/lib/recommendation";

interface CsvResult {
  variety_id: number;
  nom_officiel: string;
  precocite: string;
  duree_cycle_jours: string | null;
  besoins_pluvio_min_mm: number | null;
  besoins_pluvio_max_mm: number | null;
  tolerance_secheresse: string;
  disponibilite_semences: string;
  rendement_observe_moyen_kg: number | null;
  score: number;
  classification: Classification;
  confiance: string;
}

const CONF_LABELS: Record<string, string> = {
  elevee: "Élevée",
  moyenne: "Moyenne",
  faible: "Faible",
};

function csvEscape(value: string): string {
  if (/[";\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rec = getRecommendation(Number(id));
  if (!rec) {
    return NextResponse.json({ error: "Recommandation introuvable." }, { status: 404 });
  }

  const commune = getCommune(rec.commune_id);
  const results: CsvResult[] = JSON.parse(rec.resultats);

  const header = [
    "Rang",
    "Variété",
    "Classification",
    "Score (/100)",
    "Cycle (jours)",
    "Précocité",
    "Besoins en eau (mm)",
    "Tolérance sécheresse",
    "Disponibilité semences",
    "Rendement observé (kg/ha)",
    "Confiance",
  ];

  const lines: string[] = [];
  lines.push(`Recommandation MilChoix Sénégal`);
  lines.push(
    `Localité;${csvEscape(commune?.nom ?? "")} (${csvEscape(commune?.departement ?? "")}, ${csvEscape(commune?.region ?? "")})`
  );
  lines.push(`Campagne;${rec.campagne_annee}`);
  lines.push(`Date de génération;${rec.created_at}`);
  lines.push("");
  lines.push(header.join(";"));

  results.forEach((r, i) => {
    const row = [
      String(i + 1),
      csvEscape(r.nom_officiel),
      csvEscape(CLASSIFICATION_LABELS[r.classification] ?? r.classification),
      String(r.score),
      r.duree_cycle_jours != null ? String(r.duree_cycle_jours) : "",
      csvEscape(r.precocite),
      r.besoins_pluvio_min_mm != null ? `${r.besoins_pluvio_min_mm}–${r.besoins_pluvio_max_mm}` : "",
      csvEscape(r.tolerance_secheresse),
      csvEscape(r.disponibilite_semences),
      r.rendement_observe_moyen_kg != null ? String(r.rendement_observe_moyen_kg) : "",
      csvEscape(CONF_LABELS[r.confiance] ?? r.confiance),
    ];
    lines.push(row.join(";"));
  });

  const csv = "\uFEFF" + lines.join("\r\n");

  const filename = `milchoix-recommandation-${id}-${rec.campagne_annee}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
