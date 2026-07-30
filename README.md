# Easy Drop — Frontend

Application Next.js (App Router) + TypeScript + Tailwind CSS + Supabase.

## Ce qui est fait à cette étape (Étape 1 — Architecture & setup)

- Squelette du projet Next.js 15 avec TypeScript et Tailwind (couleurs de la charte Easy Drop déjà configurées).
- Connexion à Supabase préparée (client navigateur + client serveur).
- Middleware de protection des routes `/dashboard`, `/commandes`, `/gains` (espace commercial) et `/admin` (espace admin), avec redirection automatique si non connecté ou compte non validé.
- Page d'accueil de la vitrine publique (basique, sera enrichie à l'étape 6).
- Fichier `.env.example` listant toutes les clés nécessaires.

**Ce qui n'est pas encore fait** (prochaines étapes de la roadmap) : base de données (étape 2), écrans d'authentification fonctionnels (étape 3), design system complet (étape 4), catalogue (étape 5), etc.

## Comment installer le projet sur ton ordinateur

1. Installer [Node.js](https://nodejs.org) (version 20 ou plus récente) si ce n'est pas déjà fait.
2. Ouvrir un terminal dans le dossier `frontend/`.
3. Installer les dépendances :
   ```bash
   npm install
   ```
4. Copier le fichier d'environnement :
   ```bash
   cp .env.example .env.local
   ```
5. Remplir `.env.local` avec les informations de ton projet Supabase (voir le dossier `backend/` pour la création du projet).
6. Lancer le serveur de développement :
   ```bash
   npm run dev
   ```
7. Ouvrir [http://localhost:3000](http://localhost:3000) dans ton navigateur.

## Où cliquer pour créer le projet Supabase (à faire avant l'étape 2)

1. Aller sur [supabase.com](https://supabase.com) et créer un compte gratuit.
2. Cliquer sur **New Project**.
3. Choisir un nom (ex. `easy-drop`), un mot de passe de base de données (à conserver précieusement), et la région la plus proche (Europe si pas de région Afrique disponible).
4. Une fois le projet créé, aller dans **Project Settings > API** pour récupérer :
   - `Project URL` → à coller dans `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → à coller dans `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → à coller dans `SUPABASE_SERVICE_ROLE_KEY` (à garder secrète, jamais dans le code partagé)

Je te guiderai clic par clic pour la suite (déploiement Vercel, connexion du domaine) le moment venu.
