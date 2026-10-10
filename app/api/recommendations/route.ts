import { NextRequest, NextResponse } from "next/server";
import { computeRecommendations, saveRecommendation, getCommune } from "@/lib/queries";
import type { Preferences } from "@/lib/types";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const communeId = Number(body.communeId);
  const campagneAnnee = Number(body.campagneAnnee);

  if (!communeId || !campagneAnnee) {
    return NextResponse.json(
      { error: "Localité et campagne agricole sont requises." },
      { status: 400 }
    );
  }

  const commune = getCommune(communeId);
  if (!commune) {
    return NextResponse.json({ error: "Localité introuvable." }, { status: 400 });
  }

  const prefs: Preferences = {
    campagneAnnee,
    dateSemis: String(body.dateSemis ?? ""),
    typeSol: String(body.typeSol ?? ""),
    dureeCycleSouhaitee: String(body.dureeCycleSouhaitee ?? ""),
    objectifProduction: String(body.objectifProduction ?? ""),
    preferencesAlimentaires: String(body.preferencesAlimentaires ?? ""),
    accesIntrants: String(body.accesIntrants ?? ""),
    toleranceSecheresseRecherchee: body.toleranceSecheresseRecherchee === true,
  };

  const { results, climat } = computeRecommendations(communeId, prefs);

  const resultatsPayload = results.map((r) => ({
    variety_id: r.variety.id,
    nom_officiel: r.variety.nom_officiel,
    noms_locaux: r.variety.noms_locaux,
    statut: r.variety.statut,
    statut_validation: r.variety.statut_validation,
    precocite: r.variety.precocite,
    duree_cycle_jours: r.variety.duree_cycle_jours,
    besoins_pluvio_min_mm: r.variety.besoins_pluvio_min_mm,
    besoins_pluvio_max_mm: r.variety.besoins_pluvio_max_mm,
    tolerance_secheresse: r.variety.tolerance_secheresse,
    disponibilite_semences: r.variety.disponibilite_semences,
    rendement_observe_moyen_kg: r.variety.rendement_observe_moyen_kg,
    score: r.score,
    classification: r.classification,
    raisons: r.raisons,
    confiance: r.confiance,
    confiance_raison: r.confiance_raison,
  }));

  const id = saveRecommendation(
    String(body.sessionId ?? crypto.randomUUID()),
    communeId,
    prefs,
    JSON.stringify(resultatsPayload)
  );

  return NextResponse.json({ id, climat });
}
