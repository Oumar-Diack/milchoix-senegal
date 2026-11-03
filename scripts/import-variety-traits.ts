// CLI d'import des trois champs variétaux manquants.
//
//   npm run data:traits -- --modele
//   npm run data:traits -- --file data/modele-traits-varietes.csv
//   npm run data:traits -- --file data/modele-traits-varietes.csv --apply
//
// Par défaut, rien n'est écrit : seules les modifications prévues sont
// affichées. `--apply` les enregistre après validation complète du fichier.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { ensureDatabase } from "../lib/ensure-db";
import { getDb } from "../lib/db";
import { logAudit } from "../lib/queries";
import {
  buildTraitsTemplate,
  importVarietyTraitsCSV,
  type TraitsImportResult,
} from "../lib/variety-traits-import";

const DEFAULT_FILE = "data/modele-traits-varietes.csv";

interface Args {
  modele: boolean;
  apply: boolean;
  force: boolean;
  help: boolean;
  file: string | null;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    modele: false,
    apply: false,
    force: false,
    help: false,
    file: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--modele" || arg === "--modèle") args.modele = true;
    else if (arg === "--apply") args.apply = true;
    else if (arg === "--force") args.force = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--file") args.file = argv[++i] ?? null;
    else if (arg.startsWith("--file=")) args.file = arg.slice("--file=".length);
    else {
      console.error(`Option inconnue : ${arg}`);
      args.help = true;
    }
  }
  return args;
}

function printHelp(): void {
  console.log(`Import des caractéristiques variétales (sol, usages, rendement observé).

Usage :
  npm run data:traits -- --modele
      Écrit un CSV prérempli avec les 13 variétés.

  npm run data:traits -- --file <chemin.csv>
      Aperçu des modifications, sans écriture en base.

  npm run data:traits -- --file <chemin.csv> --apply
      Écrit en base (refusé si le fichier contient une erreur).

Options :
  --modele        génère ${DEFAULT_FILE}
  --file <path>   fichier à importer
  --apply         écrit réellement en base
  --force         écrit malgré les erreurs de lignes (déconseillé)
  --help          affiche cette aide

Règles :
  - une cellule vide ne modifie rien ;
  - le rendement s'exprime en kg/ha, ou en t/ha (« 1,5 t/ha ») ;
  - sol : mentionner sable, argile ou limon pour rester filtrable dans le chat ;
  - usages séparés par des virgules (grain, couscous, fourrage, biofortifié…).`);
}

function printResult(result: TraitsImportResult, apply: boolean): void {
  const verb = apply ? "mise(s) à jour" : "à mettre à jour";
  console.log(
    `${result.total} ligne(s) — ${result.updated} ${verb}, ${result.unchanged} inchangée(s), ${result.ignored} ignorée(s), ${result.errors.length} erreur(s), ${result.warnings.length} avertissement(s).`
  );

  for (const change of result.changes) {
    const details = change.fields
      .map((field) => {
        const before = change.before[field];
        const after = change.after[field];
        return `${field}: « ${before ?? "vide"} » → « ${after ?? "vide"} »`;
      })
      .join(" ; ");
    console.log(`${apply ? "✓" : "•"} ligne ${change.row} — ${change.variety} : ${details}`);
  }

  for (const warning of result.warnings) {
    console.warn(`! ligne ${warning.row} : ${warning.message}`);
  }
  for (const error of result.errors) {
    console.error(`✗ ligne ${error.row} : ${error.message}`);
  }
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  ensureDatabase();
  const db = getDb();

  if (args.modele) {
    const csv = buildTraitsTemplate(db);
    const target = resolve(args.file ?? DEFAULT_FILE);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, csv, "utf8");
    const count = csv.trim().split("\n").length - 1;
    console.log(`Modèle écrit : ${target} (${count} variétés).`);
    console.log(
      `Remplissez exigences_pedologiques, usages_alimentaires et rendement_observe_moyen_kg,`
    );
    console.log(`puis : npm run data:traits -- --file ${target}`);
    return;
  }

  const file = resolve(args.file ?? DEFAULT_FILE);
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    console.error(`Fichier introuvable : ${file}`);
    console.error("Générez d'abord le modèle : npm run data:traits -- --modele");
    process.exitCode = 1;
    return;
  }

  if (args.apply && !args.force) {
    const preview = importVarietyTraitsCSV(db, text, { apply: false });
    if (preview.errors.length > 0) {
      console.error("Aucune écriture : le fichier contient des erreurs.\n");
      printResult(preview, false);
      console.error("\nCorrigez le fichier puis relancez, ou utilisez --force.");
      process.exitCode = 1;
      return;
    }
  }

  const result = importVarietyTraitsCSV(db, text, { apply: args.apply });
  printResult(result, args.apply);

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }

  if (args.apply && result.updated > 0) {
    logAudit(
      "cli",
      "import_traits_varietes",
      "varieties",
      null,
      JSON.stringify({
        fichier: file,
        mises_a_jour: result.updated,
        inchangees: result.unchanged,
        ignorees: result.ignored,
      })
    );
    console.log("\nImport enregistré. Relancez `npm run chat:eval` et vérifiez la fiche d'une variété.");
  } else if (!args.apply && result.updated > 0) {
    console.log("\nAucune écriture. Relancez avec --apply pour enregistrer.");
  }
}

main();
