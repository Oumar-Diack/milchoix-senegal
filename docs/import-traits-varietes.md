# Compléter les caractéristiques des variétés

Trois champs du catalogue sont vides pour les 13 variétés et bloquent une partie
des réponses du chat et des recommandations :

| Champ | Ce qu'il débloque |
|---|---|
| `exigences_pedologiques` | « quelle variété pour un sol sableux / argileux ? » |
| `usages_alimentaires` | « quelle variété pour le couscous / le fourrage / biofortifiée ? » |
| `rendement_observe_moyen_kg` | rendement réellement observé, distinct du potentiel |

La saisie se fait dans un tableur, à partir d'un CSV prérempli. L'import est
**simulé par défaut** : rien n'est écrit tant que `--apply` n'est pas passé.

## 1. Générer le modèle

```bash
npm run data:traits -- --modele
```

Crée `data/modele-traits-varietes.csv` avec une ligne par variété, les colonnes
de contexte (nom, type, cycle, précocité, description) et les trois colonnes à
remplir.

> Le fichier est en UTF-8 avec séparateur `;`, ouvrable directement dans Excel
> ou LibreOffice. Évitez d'enregistrer en `.xls` : réexportez en CSV.

## 2. Remplir les trois colonnes

Seules ces colonnes sont lues :

- `exigences_pedologiques`
- `usages_alimentaires`
- `rendement_observe_moyen_kg`

Les autres colonnes servent de contexte et peuvent être laissées telles quelles.
**Une cellule vide ne modifie rien** : l'import ne peut pas effacer une valeur
existante par accident.

### Sol

Texte libre, mais pour rester filtrable dans le chat et le moteur de
recommandation, mentionnez au moins une texture ou un nom local reconnu :

- textures : `sable`, `argile`, `limon` (les variantes `sableux`, `sablo-`,
  `argileux`, `argilo-`, `limoneux`, `limono-` fonctionnent aussi) ;
- noms locaux : `dior` (sableux), `deck`/`dek` (argileux), `ban` (argileux
  lourd), `balègne` (limoneux).

```text
sols sableux à sablo-argileux, supporte le dior
bas-fonds argileux (deck), éviter les sols salés
sols argilo-limoneux (ban-balègne)
```

Les huit types proposés dans le formulaire de recommandation sont :

```text
Sols sableux (Dior)
Sols argileux (Deck)
Sols argileux lourds (Ban)
Sols limoneux (Balègne)
Sols sablo-limoneux (Dior-Balègne)
Sols limono-sableux (Balègne-Dior)
Sols argilo-sableux (Deck-Dior)
Sols argilo-limoneux (Ban-Balègne)
```

Une valeur sans texture ni nom local reconnu est enregistrée mais signalée par
un avertissement : ni le chat ni le moteur ne pourront l'utiliser comme
critère.

### Usages

Liste séparée par des **virgules** (le `;` est le séparateur du fichier : une
valeur contenant `;` doit être entre guillemets, sinon l'import refuse la ligne
avec « Trop de colonnes »). Vocabulaire reconnu par le chat :

```text
grain, couscous, thiere, latchiri, sankhal
fourrage, fan, paille, double usage
biofortifie, fer, zinc
bouillie, semoule, farine, alimentation, consommation, transformation
```

Un usage hors vocabulaire déclenche un avertissement (la valeur est quand même
enregistrée). Exemple :

```text
grain, couscous, thiere
biofortifié (fer et zinc), bouillie
```

### Atomicité des lignes

Une erreur sur un champ annule toute la ligne : un sol valide n'est jamais
enregistré si le rendement de la même ligne est illisible. Corrigez la ligne,
puis relancez l'aperçu.

### Rendement observé

En **kg/ha**, ou en **t/ha** (conversion automatique) :

```text
1200
1 200
1,5 t/ha
```

Valeur acceptée entre 100 et 6 000 kg/ha. Une valeur hors plage ou illisible
bloque l'import (elle est signalée ligne par ligne).

## 3. Vérifier avant d'écrire

```bash
npm run data:traits -- --file data/modele-traits-varietes.csv
```

Affiche, ligne par ligne, les changements prévus (`avant → après`), les
avertissements et les erreurs. **Aucune écriture en base.**

Codes de sortie : `0` si le fichier est valide, `1` s'il contient une erreur.

## 4. Écrire en base

```bash
npm run data:traits -- --file data/modele-traits-varietes.csv --apply
```

- refusé si le fichier contient au moins une erreur (utilisez `--force` pour
  outrepasser, déconseillé) ;
- met à jour `date_maj` des variétés modifiées ;
- ajoute une entrée `import_traits_varietes` dans `audit_log`.

Sauvegarde préalable recommandée :

```bash
cp data/milchoix.db data/milchoix.db.avant-traits
```

## 5. Vérifier après import

```bash
npm run chat:eval          # 47 contrôles de non-régression du chat
npm run typecheck
```

Puis dans le chat :

```text
quelle variété pour un sol sableux ?
quelles variétés pour le couscous ?
quelles variétés biofortifiées ?
quelles variétés pour le fourrage ?
```

## Règles de correspondance des variétés

Le nom est comparé sans tenir compte de la casse ni des accents. Sont acceptés :

- le nom officiel (`Souna Saloum (SL28)`) ;
- le nom sans parenthèses (`Souna Saloum`) ;
- le contenu des parenthèses (`SL28`, `SL 28`) ;
- les noms locaux renseignés dans le catalogue.

Si deux variétés partagent un alias, la ligne est refusée (« nom ambigu »)
plutôt que de risquer de modifier la mauvaise fiche.

## Limites connues

- Une variété ne devrait apparaître qu'une fois dans le fichier.
- La provenance champ par champ n'est pas stockée : seule la date de mise à
  jour et le journal d'audit gardent la trace de l'import.
- Les valeurs sont importées telles quelles : la validation métier (cohérence
  agronomique) reste de votre responsabilité.
