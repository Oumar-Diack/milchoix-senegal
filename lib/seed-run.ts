import type { DatabaseSync } from "node:sqlite";
import { varieties } from "./seed-data";
import { communes, climats, varietyZones } from "./seed-data-climat";
import { getIsohyetes } from "./isohyetes";
import { hashPassword } from "./auth";

export function seedAll(db: DatabaseSync, options: { reset?: boolean } = {}): void {
  if (options.reset) {
    db.exec("DELETE FROM variety_zones;");
    db.exec("DELETE FROM climat;");
    db.exec("DELETE FROM varieties;");
    db.exec("DELETE FROM communes;");
    db.exec("DELETE FROM users;");
    db.exec("DELETE FROM recommendations;");
    db.exec("DELETE FROM feedback;");
    db.exec("DELETE FROM audit_log;");
    db.exec("DELETE FROM isohyetes;");
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('varieties','communes','climat','variety_zones','users','recommendations','feedback','audit_log','isohyetes');");
  }

  const insertVariety = db.prepare(`
    INSERT INTO varieties (
      nom_officiel, noms_locaux, statut, annee_homologation, obtenteur, type_mil,
      duree_cycle_jours, precocite, besoins_pluvio_min_mm, besoins_pluvio_max_mm,
      tolerance_secheresse, resistances_maladies, reaction_ravageurs,
      rendement_potentiel_min_kg, rendement_potentiel_max_kg,
      caracteristiques_grain, disponibilite_semences, description, source, statut_validation
    ) VALUES (
      :nom_officiel, :noms_locaux, :statut, :annee_homologation, :obtenteur, :type_mil,
      :duree_cycle_jours, :precocite, :besoins_pluvio_min_mm, :besoins_pluvio_max_mm,
      :tolerance_secheresse, :resistances_maladies, :reaction_ravageurs,
      :rendement_potentiel_min_kg, :rendement_potentiel_max_kg,
      :caracteristiques_grain, :disponibilite_semences, :description, :source, :statut_validation
    )
  `);

  const varietyIdByName = new Map<string, number>();
  for (const v of varieties) {
    const res = insertVariety.run({ ...v });
    varietyIdByName.set(v.nom_officiel, Number(res.lastInsertRowid));
  }

  const insertCommune = db.prepare(`
    INSERT INTO communes (nom, departement, region, latitude, longitude, zone_sylvopastorale, source)
    VALUES (?, ?, ?, ?, ?, ?, 'donnees exemple')
  `);

  const communeIdByName = new Map<string, number>();
  for (const c of communes) {
    const res = insertCommune.run(c.nom, c.departement, c.region, c.latitude, c.longitude, c.zone_sylvopastorale);
    communeIdByName.set(c.nom, Number(res.lastInsertRowid));
  }

  const insertClimat = db.prepare(`
    INSERT INTO climat (
      commune_id, annee, cumul_pluvio_mm, date_debut_saison, date_fin_saison,
      duree_saison_jours, nb_sequences_seches, duree_max_seche_jours,
      temperature_moyenne_c, prevision_saison, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'donnees exemple')
  `);

  for (const cl of climats) {
    const cid = communeIdByName.get(cl.commune);
    if (!cid) continue;
    insertClimat.run(
      cid, cl.annee, cl.cumul_pluvio_mm, cl.date_debut_saison, cl.date_fin_saison,
      cl.duree_saison_jours, cl.nb_sequences_seches, cl.duree_max_seche_jours,
      cl.temperature_moyenne_c, cl.prevision_saison
    );
  }

  const insertZone = db.prepare(`
    INSERT OR IGNORE INTO variety_zones (variety_id, commune_id, zone_type, source, niveau_confiance)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const z of varietyZones) {
    const vid = varietyIdByName.get(z.variete);
    const cid = communeIdByName.get(z.commune);
    if (!vid || !cid) continue;
    insertZone.run(vid, cid, z.zone_type, z.source, z.niveau_confiance);
  }

  // Isohyètes de pluviométrie annuelle (Sénégal)
  const insertIsohyete = db.prepare(
    "INSERT INTO isohyetes (contour_mm, geometry, source) VALUES (?, ?, 'Shapefile isohyete (SN)')"
  );
  for (const iso of getIsohyetes()) {
    insertIsohyete.run(iso.contour_mm, JSON.stringify(iso.lines));
  }

  // Utilisateur administrateur par défaut
  const adminUser = db.prepare("SELECT COUNT(*) AS c FROM users WHERE username = ?").get(
    process.env.MILCHOIX_ADMIN_USERNAME || "admin"
  ) as { c: number };
  if (adminUser.c === 0) {
    const password = process.env.MILCHOIX_ADMIN_PASSWORD || "milchoix2026";
    db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')").run(
      process.env.MILCHOIX_ADMIN_USERNAME || "admin",
      hashPassword(password)
    );
    console.log("Utilisateur admin par défaut créé (voir MILCHOIX_ADMIN_USERNAME / MILCHOIX_ADMIN_PASSWORD).");
  }
}
