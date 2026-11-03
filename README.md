MilChoix Sénégal est un projet de plateforme d'information, de cartographie et d'aide au choix variétal du mil. Elle aide producteurs, organisations paysannes et conseillers agricoles à identifier les variétés potentiellement les mieux adaptées à leur localité et à la campagne agricole.

## Compléter les données variétales

Trois champs sont encore vides (sol, usages alimentaires, rendement observé).
Ils se saisissent dans un CSV prérempli, avec aperçu avant écriture :

```bash
npm run data:traits -- --modele
npm run data:traits -- --file data/modele-traits-varietes.csv
npm run data:traits -- --file data/modele-traits-varietes.csv --apply
```

Procédure détaillée et vocabulaire accepté : [`docs/import-traits-varietes.md`](docs/import-traits-varietes.md).

## Vérifications du chat

```bash
npm run chat:eval    # 47 contrôles FR/EN/WO
npm run test:traits  # 23 contrôles de l'import des caractéristiques
```
