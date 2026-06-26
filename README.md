# HqGambler — Journal & Plan de Trading

Web-app personnelle (mono-utilisateur) de **journal de trading + plan**, pensée pour un trader
discrétionnaire futures (**Nasdaq MNQ / Gold MGC**). Thème sombre « hedge-fund », base de données
réelle accessible mobile + laptop, installable en PWA.

Modèle métier intégré : **Delivery entre imbalances HTF — entrée sur réaction** (pas un journal générique).

---

## ✨ Fonctionnalités

- **Dashboard** — Trades, Winrate (hors BE), Espérance (R/trade), Total R, Profit Factor, Max Drawdown (R),
  courbe d'équité (R cumulé avec ligne zéro), répartition W/L/BE, 5 derniers trades.
- **Journal** — CRUD complet, tableau responsive (cartes sur mobile / tableau sur desktop), formulaire
  avec **RR planifié calculé en live**, préremplissage R (-1 sur LOSS, 0 sur BE), upload capture compressée,
  filtres complets (instrument, session, taille/type POI, réaction, sentiment, résultat, dates, tags),
  **Import/Export JSON + Export CSV** (l'import accepte aussi l'ancien format `localStorage`).
- **Plan** — modèle complet mis en page, **checklist pré-trade interactive 8 points** avec barre de
  progression et bandeau « SETUP VALIDÉ », bloc « perte valide », non-négociables, hypothèses en test.
- **Analytics** — breakdowns du winrate / espérance / total R par **session, type de POI, taille de POI,
  qualité de réaction, no-wick, sentiment pré-trade, plan respecté, instrument, jour, heure**, plus
  comparaison **RR planifié moyen vs RR réalisé moyen**. Tout se recalcule sur le sous-ensemble filtré.

## 🧱 Stack

| | |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript strict |
| Style | Tailwind CSS — thème sombre, accent acier/cyan |
| DB | PostgreSQL (Neon) via Prisma ORM — fallback SQLite possible |
| Auth | NextAuth (credentials, **mono-utilisateur** par variables d'env) |
| Charts | Recharts |
| Captures | base64 compressé en DB (compression client) |
| PWA | manifest + service worker, icône HqGambler |
| Déploiement | Vercel |

`R réalisé (signé)` est **la source de vérité** de toutes les stats.

---

## 🚀 Démarrage rapide

```bash
npm install
cp .env.example .env.local      # puis remplis les valeurs (voir ci-dessous)
npx prisma migrate dev --name init
npm run db:seed                 # (optionnel) 11 trades de démo
npm run dev                     # http://localhost:3000
```

### 1. Base de données — Neon (recommandé)

1. Crée un projet gratuit sur **https://neon.tech**.
2. Copie la **connection string poolée** (elle finit par `?sslmode=require`).
3. Colle-la dans `DATABASE_URL` (`.env.local` en dev, variables Vercel en prod).

> **Dev local SQLite** (sans cloud) : dans `prisma/schema.prisma`, mets `provider = "sqlite"`,
> remplace le champ `tags String[]` par `tags String @default("[]")` (SQLite n'a pas d'array),
> et `DATABASE_URL="file:./prisma/dev.db"`. Puis `npx prisma migrate dev`.
> Le schéma livré cible **Postgres** par défaut.

### 2. Auth — le compte unique

```bash
# Génère le secret de session :
openssl rand -base64 32          # → NEXTAUTH_SECRET

# Génère le hash de ton mot de passe :
npm run hash -- "tonMotDePasse"  # → colle la ligne APP_USER_PASSWORD_HASH
```

Variables nécessaires :

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | connexion Postgres (Neon) |
| `NEXTAUTH_SECRET` | secret de session (obligatoire) |
| `NEXTAUTH_URL` | URL de l'app (`http://localhost:3000` en dev, ton domaine en prod) |
| `APP_USER_EMAIL` | le seul email autorisé à se connecter |
| `APP_USER_PASSWORD_HASH` | hash bcrypt du mot de passe (recommandé) |
| `APP_USER_PASSWORD` | mot de passe en clair (fallback **dev only**) |

---

## ☁️ Déploiement Vercel

1. Pousse le repo sur GitHub, importe-le dans Vercel.
2. Renseigne `DATABASE_URL` dans Vercel (Production + Preview).
3. Le `build` Vercel fait `prisma generate && next build` — **il n'applique pas les migrations**
   (le pooler Neon ne supporte pas le verrou d'avis de `migrate deploy` → timeout P1002).
4. **Applique les migrations à part**, depuis ton laptop, avec la connexion **directe** Neon
   (URL *sans* `-pooler`, l'option "Direct connection" dans Neon) :
   ```bash
   DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require" npm run db:deploy
   ```
   À refaire uniquement quand tu ajoutes une nouvelle migration.
5. Déploie. Sur mobile : ouvre l'URL → **Ajouter à l'écran d'accueil** pour installer la PWA.

> Note auth : l'authentification est actuellement **désactivée** (accès direct). Seule
> `DATABASE_URL` est requise. Pour réactiver le login plus tard, rebranche le middleware,
> le check de session dans `(app)/layout.tsx`, et les variables `NEXTAUTH_*` / `APP_USER_*`.

---

## 📂 Structure

```
prisma/
  schema.prisma          # modèle Trade + enums
  seed.ts                # 11 trades de démo
src/
  app/
    (app)/               # routes protégées (dashboard, journal, analytics, plan)
    login/               # page de connexion
    api/auth/            # NextAuth
    actions.ts           # Server Actions (CRUD + import)
  components/            # UI (form, charts, nav, toasts, breakdowns…)
  lib/
    stats.ts             # moteur de stats (le cœur)
    domain.ts            # enums, labels, dérivations (session, RR)
    validation.ts        # schémas zod
    legacy.ts            # mapping de l'ancien format localStorage
    auth.ts  prisma.ts  queries.ts  export.ts  image.ts  plan.ts
public/                  # icônes PWA, manifest, service worker
scripts/
  gen-icons.mjs          # génère les PNG d'icônes
  hash-password.mjs      # génère le hash bcrypt
```

## 🛠️ Scripts utiles

| Commande | Effet |
|---|---|
| `npm run dev` | serveur de dev |
| `npm run build` | build prod (génère client + migrate deploy + build) |
| `npm run typecheck` | vérifie les types (strict, zéro `any`) |
| `npm run db:migrate` | crée/applique une migration |
| `npm run db:studio` | Prisma Studio (explorer la DB) |
| `npm run db:seed` | injecte les trades de démo |
| `npm run hash -- "pwd"` | hash bcrypt d'un mot de passe |
| `npm run gen:icons` | régénère les icônes PWA |

---

## 📥 Import de l'ancien journal

Dans **Journal → Import / Export → Importer (JSON)**, le fichier peut être :

- un **export HqGambler** (format natif), ou
- l'**ancien format localStorage** : tableau d'objets
  `{date,inst,dir,bias,ein,cib,tap,size,reac,entry,stop,tgt,rrplan,res,r,note}`.
  Le mapping est automatique (`NQ`→`MNQ`, `TP`→`WIN`, `big`→`LARGE`, etc.).

---

Personnel · mono-utilisateur · *« le jeu, maîtrisé. »*
