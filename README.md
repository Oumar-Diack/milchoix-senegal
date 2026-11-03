# MilChoix Sénégal

Plateforme d'information, de cartographie et d'aide au choix variétal du mil.
Elle aide les producteurs, organisations paysannes et conseillers agricoles à
identifier les variétés les mieux adaptées à une localité et à une campagne
agricole, à partir de données climatiques et variétales sourcées.

## Fonctionnalités

- **Catalogue variétal** — 13 variétés de mil : cycle, précocité, besoins en
  eau, tolérance à la sécheresse, résistances, usages, rendements, semences.
- **Carte des zones d'adaptation** — communes où chaque variété est adaptée,
  marginale ou non adaptée (source : `Zones d'adaptation.xlsx`).
- **Comparateur** — comparaison côte à côte de plusieurs variétés, avec export
  PDF et Excel.
- **Recommandation** — classement des variétés pour une commune et une campagne,
  avec explication des critères et niveau de confiance.
- **Assistant conversationnel** — réponses en français, anglais et wolof,
  strictement fondées sur la base et les documents de la plateforme, avec
  refus explicite quand la donnée est absente.
- **Administration** — gestion des variétés, zones, communes, climat, retours
  utilisateurs, journal d'audit et questions du chat restées sans réponse.

## Stack technique

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4
- SQLite via `node:sqlite` (aucun serveur de base de données)
- Leaflet / React Leaflet pour la carte
- PDF et Excel générés sans dépendance externe
- Chat : moteur déterministe + recherche BM25 locale, sans LLM ni embeddings

## Démarrage local

Prérequis : **Node.js 22.5+** (nécessaire pour `node:sqlite`) et npm.

```bash
npm install
npm run db:seed     # crée et remplit data/milchoix.db
npm run dev         # http://localhost:3000
```

Administration : <http://localhost:3000/admin>.

Le seed crée un compte administrateur par défaut `admin` / `milchoix2026`.
**Changez-le avant toute mise en ligne** via `MILCHOIX_ADMIN_USERNAME` et
`MILCHOIX_ADMIN_PASSWORD` avant de lancer le seed.

### Variables d'environnement

| Variable | Usage | Défaut |
|---|---|---|
| `MILCHOIX_DB_PATH` | Chemin de la base SQLite (tests, sauvegardes, déploiement) | `data/milchoix.db` |
| `MILCHOIX_SECRET` | Secret de signature des sessions admin | valeur de développement |
| `MILCHOIX_ADMIN_USERNAME` | Identifiant admin créé par le seed | `admin` |
| `MILCHOIX_ADMIN_PASSWORD` | Mot de passe admin créé par le seed | `milchoix2026` |

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm run start` | Build et serveur de production |
| `npm run typecheck` | Vérification TypeScript |
| `npm run db:seed` | Réinitialise et remplit la base |
| `npm run data:traits` | Import CSV des caractéristiques variétales (aperçu par défaut) |
| `npm run chat:eval` | 48 contrôles de non-régression du chat (FR/EN/WO) |
| `npm run test:traits` | 35 contrôles de l'import des caractéristiques |
| `npm run test:soil` | 26 contrôles des types de sol |
| `npm run test:reco` | 10 contrôles du critère sécheresse |

## Données

- **Variétés** : catalogue officiel, 13 variétés, caractéristiques complètes
  (sol, usages, rendement observé inclus).
- **Climat** : WorldClim / CRU TS 4.09, 1951-2024, agrégé en normales 1991-2020
  pour les réponses du chat.
- **Zones d'adaptation** : fichier de référence `Zones d'adaptation.xlsx`,
  traduit dans `lib/zones-adaptation.ts`.

La base `data/milchoix.db` n'est pas versionnée : elle est reconstruite par
`npm run db:seed`. Les valeurs de référence vivent dans `lib/seed-data.ts`,
`lib/seed-data-climat.ts`, `lib/climat-data.ts` et `lib/zones-adaptation.ts`.

### Compléter les caractéristiques variétales

La saisie se fait dans un CSV prérempli, avec aperçu avant écriture :

```bash
npm run data:traits -- --modele
npm run data:traits -- --file data/modele-traits-varietes.csv
npm run data:traits -- --file data/modele-traits-varietes.csv --apply
```

Procédure, vocabulaire sol/usages et règles de validation :
[`docs/import-traits-varietes.md`](docs/import-traits-varietes.md).

## Assistant conversationnel

Le chat ne génère pas de texte libre : il sélectionne des faits en base et des
extraits documentaires, puis les met en forme avec leur source.

- compréhension tolérante aux fautes et aux synonymes (FR/EN/WO) ;
- extraction multi-contraintes : précocité, sécheresse, cycle, sol, usage,
  semences, zone, variétés marginales ;
- mémoire de conversation sans état serveur (contexte revalidé à chaque tour) ;
- recherche BM25 sur l'itinéraire technique et la protection phytosanitaire ;
- refus explicite et journalisation (`audit_log`) quand la réponse n'existe pas
  dans la base.

Les questions sans réponse sont consultables dans l'onglet
**« Questions sans réponse »** de l'administration.

## Structure

```text
app/          pages et routes API (catalogue, carte, comparer, recommander, admin)
components/   interface React (formulaires, carte, chat, administration)
lib/          données, requêtes SQLite, moteur de recommandation, chat
scripts/      imports et suites de vérification
data/         base locale (non versionnée) et modèle CSV
docs/         documentation d'exploitation
```

## Qualité

```bash
npm run typecheck
npm run build
npm run chat:eval
npm run test:traits
npm run test:soil
npm run test:reco
```

Les suites `chat:eval` et `test:reco` s'appuient sur une base seedée.

## Déploiement

L'application est prévue pour un serveur unique avec disque persistant
(VPS), SQLite ne nécessitant aucun service externe :

1. installer Node.js sur le serveur ;
2. `npm ci && npm run db:seed && npm run build` ;
3. lancer `npm run start` derrière un reverse proxy HTTPS (Nginx/Caddy) ;
4. définir `MILCHOIX_SECRET` et les identifiants admin ;
5. sauvegarder régulièrement le fichier `data/milchoix.db`.

Les plateformes à système de fichiers éphémère ne conviennent pas telles quelles :
la base serait perdue à chaque déploiement.

## Limites

- Les recommandations sont une **aide à la décision** : elles ne remplacent ni
  l'expérience du producteur ni l'avis d'un conseiller.
- Les dates de début/fin de saison et la durée maximale des sécheresses ne sont
  pas disponibles dans la source climatique mensuelle.
- Le chat ne répond que sur le périmètre de la plateforme ; toute question hors
  base est refusée et journalisée.
