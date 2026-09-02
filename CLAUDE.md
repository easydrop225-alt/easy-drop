# Easy Drop — Contexte du projet (lu automatiquement par Claude Code)

Plateforme de dropshipping interne pour la Côte d'Ivoire. Yann (le propriétaire) recrute des commerciaux qui revendent des produits sans détenir de stock ; Easy Drop gère préparation et livraison.

## Infos essentielles

- **Dépôt** : `easydrop225-alt/easy-drop`, branche `main`, tout le code est **à la racine du dépôt** (pas de sous-dossier `frontend/`).
- **Stack** : Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase (Postgres/Auth/Storage/Realtime).
- **Hébergement** : Vercel, `https://easy-drop-kappa.vercel.app`.
- **Supabase Project ID** : `rnvpqudjjtfyidowthcj` (région eu-west-1 — la latence Abidjan↔Europe est une contrainte physique connue, pas un bug).
- **Compte super admin** : `easydrop225@gmail.com`.
- Yann ne connaît pas la programmation : explications simples, guidage clic par clic pour tout ce qui touche aux interfaces externes (Vercel, Supabase, GitHub). Il préfère les interfaces web au terminal, mais un jeton GitHub (PAT, scope Contents + Workflows) a été mis en place pour permettre un push direct par Claude — proposer de l'utiliser plutôt que de faire tout re-uploader manuellement.
- Le connecteur **Supabase MCP** est disponible et connecté (project_id ci-dessus) : utiliser `apply_migration`, `execute_sql` etc. directement plutôt que de demander à Yann de coller du SQL dans le Dashboard.

## Règles de travail non négociables

1. **Toujours retélécharger le dépôt réel avant de modifier** (`git pull`), ne jamais supposer l'état du code à partir de la mémoire de conversation.
2. **Toujours vérifier avant de livrer** : `npm install`, `npm run build`, `npx vitest run`, `npm run type-check` — les 4 doivent passer avant tout commit/push. Ne jamais pousser un code non testé.
3. **Toujours nettoyer avant de committer** : `rm -rf node_modules .next .env.local tsconfig.tsbuildinfo` (ces artefacts ne doivent jamais partir sur GitHub — voir `.gitignore`).
4. `pip install` nécessite `--break-system-packages` dans cet environnement si applicable ; sinon `npm`/`npx` classiques.
5. Attendre ~60-90s après un push avant de vérifier le pipeline CI (GitHub Actions met du temps à démarrer).
6. RLS (Row Level Security) est la vraie barrière de sécurité de l'app — toute vérification d'auth applicative (middleware, pages) est un confort UX, pas la protection ultime. Utiliser `getSession()` (lit le cookie, pas d'appel réseau) plutôt que `getUser()` dans les pages/layouts pour la vitesse ; réserver `getUser()` aux Server Actions qui font de vraies écritures sensibles.
7. **Fluidité = priorité constante.** Toujours paralléliser les requêtes indépendantes (`Promise.all`), jamais de balises `<a href="/...">` pour la navigation interne (toujours `next/link`), toujours vérifier qu'un nouveau composant n'ajoute pas de requête réseau évitable.

## Schéma de base de données — points clés à connaître

- `products` : produits, avec `prix_fournisseur`, `prix_min_conseille`/`prix_max_conseille`, `couleurs[]`, `tailles[]`, `actif`. RLS : `actif = true OR auth.uid() IS NOT NULL` (tout utilisateur connecté voit tout, y compris désactivés — affichés grisés côté UI).
- `product_variants` : `couleur`, `taille`, `nom` (label personnalisé, remplace couleur/taille si renseigné), `prix_fournisseur` (surcharge celui du produit si renseigné — voir `lib/calculs/prix-variante.ts` pour la règle centralisée, ne jamais la dupliquer ailleurs).
- `media` : `product_id` + `product_variant_id` (nullable — une photo peut être liée à une variante précise plutôt qu'au produit en général).
- `orders` / `order_items` : une commande peut contenir plusieurs produits différents (panier), chaque ligne garde son propre `prix_fournisseur_unitaire` figé au moment de la vente (historique jamais affecté par un changement de prix ultérieur).
- `activity_logs` : journal (statuts de commande + connexions/déconnexions/inscriptions avec IP). Écritures via la fonction SQL `journaliser_connexion` (security definer) — jamais d'insert direct (RLS ne l'autorise qu'en lecture, réservée aux admins).
- `comptes_lies` : bascule rapide entre comptes (ex : super admin ↔ compte test) sans redemander de mot de passe — stocke des refresh tokens, écritures toujours via le client admin (service role), jamais côté client.
- `push_subscriptions` : contrainte unique sur `(endpoint, user_id)` (pas juste `endpoint`) — un même appareil peut être abonné pour plusieurs comptes liés en même temps.
- Migrations 1 à 26 appliquées en production. Le dossier de migrations SQL n'est **pas** dans ce dépôt Git (il vivait dans un zip séparé) — toute nouvelle migration se fait directement via l'outil Supabase MCP (`apply_migration`), pas via un fichier local à committer.

## Décisions produit à respecter

- **Historique limité à 3 mois** sur commandes/paiements/gains pour la performance ; totaux à vie préservés séparément.
- **Pas de mise en cache (`revalidate`) sur les pages qui lisent `cookies()`** (auth) — testé, incompatible, laisser tel quel.
- **2FA retirée** à la demande de Yann (comme Sentry, pour le poids de page) — ne pas re-suggérer sans qu'il le redemande.
- **Vitrine publique simplifiée** : plus de catalogue public avant inscription — `/` redirige directement vers `/inscription` (logo + formulaire).
- **Mot de passe** : 6 caractères min + majuscule + minuscule + chiffre + symbole (`components/ui/password-input.tsx`). Réinitialisation par email nécessite une vraie adresse (beaucoup de commerciaux n'en ont pas, juste un téléphone → email fictif `@easydrop.local` généré, non joignable) : pour ces comptes, utiliser le bouton **Admin > Commerciaux > Réinitialiser mot de passe** (génère un mot de passe temporaire, à transmettre par WhatsApp).
- **Notifications push** : iOS exige que le site soit installé sur l'écran d'accueil (Safari uniquement) et iOS ≥ 16.4 — sans ça, aucune notification ne peut fonctionner, ce n'est pas un bug.

## Ce qui a été construit (dans l'ordre, résumé — voir `git log` pour le détail exact)

**Base (avant cette session)** : schéma complet, auth, catalogue avec variantes, commandes, stocks, dashboards, paiements, Google Sheets (3 feuilles), notifications push, parrainage (codes/points/niveaux), onboarding, formations, PWA.

**Cette session (191 commits)**, dans l'ordre :
1. Fix build cassé (`tailwind.config.js`/`next.config.js` disparus) + photos cassées.
2. Mot de passe oublié (avec le vrai fix : route `/auth/callback` pour échanger le code Supabase — un simple lien direct ne suffit pas), réinitialisation admin, afficher/masquer mot de passe, règles de complexité.
3. Cron quotidien anti-pause Supabase (`/api/cron/keep-alive`, protégé par `CRON_SECRET`).
4. Panier multi-produits (plusieurs produits différents par commande) + mode "prix par produit" ou "un seul prix total" (incluant la livraison, réparti automatiquement).
5. Mode sombre (variables CSS, pas de classes `dark:` dispersées) + contour des champs corrigé (option validée : `#8A8178`).
6. Refonte catalogue : recherche directe (plus de navigation par catégorie), intervalle de prix, disponibilité visible (grisé + "Non disponible"), produits désactivés visibles mais image seule (opacité 75%), badge "Nouveau", favoris (localStorage), bouton "Voir le produit".
7. Variantes enrichies : nom personnalisé, photo choisie parmi celles déjà uploadées, prix fournisseur propre à la variante, génération en masse (couleur × taille), modification à tout moment.
8. Optimisations performance (la plus grosse partie du travail) :
   - `loading.tsx`/`error.tsx` sur tout l'espace (écrans de chargement + erreurs propres).
   - Images converties en `next/image` (9/10 — le reçu d'expédition reste `<img>`, hauteur non fixe).
   - **Bug majeur trouvé et corrigé** : 21 fichiers utilisaient `<a href="/...">` au lieu de `next/link` → rechargement complet de page à chaque clic. Toujours vérifier ça pour tout nouveau lien interne.
   - `getUser()` → `getSession()` dans le middleware et 10 pages (évite un appel réseau par navigation).
   - Requêtes parallélisées partout où c'était séquentiel sans nécessité.
   - Vraie pagination sur Admin > Commandes (100/page) au lieu d'un plafond fixe à 1000.
   - Fix iOS : `viewport-fit=cover` + `min-h-dvh` + marges de sécurité (barre de nav ne disparaissait plus sous la barre gestuelle).
9. Sécurité : blocage après 5 échecs de connexion (15 min), limite d'inscriptions par IP (3/30 min), `sitemap.xml`/`robots.txt`, alerte push admin sur erreur technique réelle (`/api/log-error`).
10. Bascule rapide entre comptes liés (super admin only, sans redemander de mot de passe) + notifications push partagées entre comptes liés sur le même appareil.
11. Nettoyage technique : fichiers volumineux découpés (`form.tsx` commande, `variantes-manager.tsx`), calcul de prix fournisseur centralisé et testé, page fantôme supprimée.
12. Nouveau logo/icône appliqué partout (favicon, PWA, badge notification).

## Pièges déjà rencontrés (ne pas refaire)

- Le tarball GitHub extrait avec `--strip-components=1` donne le code à la racine — ne pas chercher un dossier `frontend/` qui n'existe pas (a cassé le pipeline CI une fois).
- `next/dynamic` avec `ssr: false` est interdit dans un Server Component.
- `cookies().set()` ne peut s'exécuter que dans une Server Action ou un Route Handler, jamais dans le rendu d'une page classique — d'où la nécessité de `/auth/callback` en Route Handler pour la réinitialisation de mot de passe.
- Un upload GitHub par interface web est limité à ~100 fichiers par lot, et glisser plusieurs dossiers sans valider entre chaque fait tout planter (fichiers imbriqués au mauvais endroit) — plus un souci depuis qu'on pousse directement via `git` avec le token.

## Ce qui reste ouvert / non fait

- Export PDF/Excel (seul CSV existe).
- Vraies actions groupées sur les paiements (écarté volontairement : chaque paiement a un numéro de dépôt propre à un commercial, une action groupée forcerait une valeur commune erronée).
- Rafraîchissement en temps réel (Realtime) des listes admin — branché à un seul endroit dans toute l'app actuellement.
- Découpage supplémentaire possible de `commandes/nouvelle/form.tsx` (~600 lignes, déjà partiellement découpé).
