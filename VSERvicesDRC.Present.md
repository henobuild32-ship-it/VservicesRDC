# VServiceRDC — Présentation de l'application de A à Z

> **VServiceRDC** est la **1ère plateforme de mise en relation entre clients, prestataires et entreprises** en République Démocratique du Congo.
> Partenariat stratégique : **HenoBuild Entreprise × KinMusala**

---

## 1. Vision & positionnement

VServiceRDC connecte chaque jour **clients, prestataires et entreprises** dans toute la RDC. La plateforme répond au besoin d'un annuaire fiable, vérifié et moderne de professionnels congolais : du BTP à la technologie, des services à domicile au transport, de la santé à l'éducation.

**Valeurs portées :**
- 🔷 Innovation et modernité
- 🤝 Confiance et transparence
- 📍 Développement local
- ⭐ Service de qualité

**Slogan :** *« La 1ère plateforme de services en RDC »*

---

## 2. Publics cibles (3 rôles + 1)

| Rôle | Description | Ce que l'utilisateur peut faire |
|---|---|---|
| **Client** | Cherche un prestataire ou une entreprise près de chez lui | Rechercher, filtrer, consulter les profils, laisser des avis, discuter, appeler |
| **Prestataire** (indépendant) | Propose ses services et trouve des clients | Créer un portfolio (CV), publier des réalisations, répondre aux messages, se faire certifier |
| **Entreprise** | Développe sa visibilité et trouve des opportunités | Page entreprise corporate, équipe (employés), réalisations, certification |
| **Admin** | Gère et modère la plateforme | Validation des comptes, modération, annonces, statistiques, paramètres |

---

## 3. Principales fonctionnalités

### 3.1. Inscription & Connexion
- **3 types de compte** : Client, Prestataire, Entreprise (choix au 1er écran d'inscription).
- **Téléphone RDC** (`+243`) avec validation automatique du format + masquage/saisie assistée.
- **Mot de passe haché** (bcrypt, 12 rounds).
- **Connexion admin** dédiée par mot de passe administrateur (`Espace Admin`).
- **Auto-connexion** juste après l'inscription.
- **Limitation anti-brute-force** : 5 tentatives/min par IP.

### 3.2. Page d'accueil (landing)
- **Hero** : slogan, CTA « Commencez maintenant », statistiques (prestataires vérifiés, entreprises partenaires, clients satisfaits, provinces couvertes).
- **Comment ça marche** : 1. Recherchez → 2. Comparez & Discutez → 3. Engagez.
- **Secteurs d'activité** : grille de 10 grands secteurs (BTP, Technologie, Services à domicile, Transport, Commerce, Santé, Éducation, Juridique, Événementiel, Agriculture).
- **Section vérification, sécurité & support**.
- **Section mobile / PWA** : installation sur Android & iOS, mode hors-ligne.
- **Partenariat officiel** : bandeau HenoBuild Entreprise × KinMusala.
- **Footer contact** : WhatsApp (+243 990 601 417) et email (henobuild32@gmail.com) avec dialogue de contact intégré.

### 3.3. Recherche de prestataires & entreprises
- Recherche par **service, secteur, province, commune**.
- Filtres : « Toutes les communes », service personnalisé (texte libre), case *portée nationale*.
- **Compteurs par type** (prestataires / entreprises).
- Boutons d'action directe : **« Engager conversation »** et **« Appeler maintenant »**.
- Données géographiques complètes de la RDC (26 provinces + districts/communes de Kinshasa).

### 3.4. Dashboard Client
- Suggestions de prestataires près de chez soi.
- Accès aux conversations, notifications, avis.
- Bandeau de **demande de suppression de compte**.
- Page **Browse Sectors** : naviguer par secteur → liste de professionnels.

### 3.5. Dashboard Prestataire (style CV / Portfolio)
- Photo, nom, secteur, services, description, expérience, disponibilité.
- **Galerie de réalisations** (avant/après, photos, albums, vidéos).
- Avis reçus + note moyenne.
- Modification du profil, paramètres.

### 3.6. Dashboard Entreprise (portail corporate)
- Logo, photo de couverture, nom, type, nombre d'employés, site web, adresse, réseaux sociaux.
- **Gestion des employés** (ajout d'une équipe, managers).
- **Documents de l'entreprise**.
- Réalisations, avis, certification.

### 3.7. Fiche publique (SEO)
- Pages publiques par **slug** : `/prestataire/[slug]` et `/entreprise/[slug]`.
- Partageables sans connexion : contact, avis, réalisations, badge « Certifié ».

### 3.8. Avis & notation
- Système **1 à 5 étoiles** avec commentaire.
- Avis visibles sur les fiches publiques et les dashboards.
- **Modération des avis par l'admin** (masquer/afficher).

### 3.9. Messagerie (chat)
- Conversations 1-à-1 entre utilisateurs (participant 1 / participant 2).
- **Nombre de messages non lus** par conversation.
- **Message d'auto-réponse** configurable (réponse automatique quand le propriétaire est absent).
- **Polling** automatique des nouveaux messages.
- Lecture (lu / non lu).

### 3.10. Notifications
- Notifications par utilisateur (type, lu/non-lu), compte-rendu central.

### 3.11. Réalisations / Publications
- Création de publications par les prestataires & entreprises : titre, description, médias, **photo avant/après**, lieu, date, tags.
- **Modération** par l'admin (masquer/afficher une publication).

### 3.12. Certification
- Les professionnels peuvent **demander une certification** (badge bleu style Instagram).
- L'admin approuve/refuse avec message personnalisé.
- Badge **« Certifié »** visible sur les fiches publiques.

### 3.13. Espace Admin (dashboard de gestion)
- **Statistiques** : total utilisateurs, clients, prestataires, entreprises, tendances.
- **Validation des comptes** (pending → approuver / rejeter).
- **Gestion des utilisateurs** : recherche, détail, suspendre/réactiver, export **CSV**, badge statut.
- **Demandes de suppression** de comptes (accepter/refuser avec raison).
- **Modération des avis** et **des publications**.
- **Annonces** : envoi à tous / aux clients / aux prestataires / aux entreprises, et **message individuel** à un utilisateur ciblé + historique.
- **Gestion des secteurs & services** (ajout/édition/suppression dynamique).
- **Messages de contact** reçus (avec réponse inline).
- **Demandes de certification** (approbation/refus/rétrogradation).
- **Paramètres généraux** : message d'accueil, email de contact, **mode maintenance**.
- **Historique des actions admin**.

### 3.14. Compte & sécurité
- **Compte suspendu** : écran de blocage plein écran avec contact admin.
- **Compte en attente / rejeté** : états gérés.
- **Demande de suppression de compte** (raison) avec **annulation possible**.
- **Changement de mot de passe**.
- **Journal d'activité** de l'utilisateur (connexions, modifications, etc.).
- **Favoris** (localStorage).

### 3.15. Personnalisation
- **Thèmes** : Clair / Sombre / Vert / Rouge.
- **Langues** : Français, English, Lingála.
- **Tutoriel d'onboarding** au premier démarrage.

### 3.16. PWA (Progressive Web App)
- `manifest.json` + Service Worker (`sw.js`) + icônes.
- Installable sur téléphone & bureau, **hors-ligne**, « Add to Home Screen ».

---

## 4. Architecture technique

### 4.1. Stack
| Couche | Technologie |
|---|---|
| Frontend | **Next.js 16** (App Router, React 19, TypeScript) |
| UI | **shadcn/ui + Tailwind CSS 4** (Radix UI, lucide-react, framer-motion) |
| Backend | **API Routes Next.js** (Route Handlers) |
| BDD | **PostgreSQL** via **Prisma ORM 5** |
| Auth | Sessions signées **HMAC-SHA256** (stateless, 7 jours) + bcrypt |
| Uploads | Upload **base64** vers `/public/uploads` (compatible Vercel) |
| Déploiement | **Vercel** (standalone output) / serveur avec **Caddy** reverse-proxy |
| Mobile | **PWA** (aucun store nécessaire) |

### 4.2. Organisation du code
```
src/
├── app/
│   ├── page.tsx                 ← Application monopage (SPA) : 14 vues
│   ├── layout.tsx               ← Meta, PWA, thème, Toaster
│   ├── prestataire/[slug]/      ← Fiche publique prestataire
│   ├── entreprise/[slug]/       ← Fiche publique entreprise
│   └── api/                     ← ~28 Route Handlers
├── components/ui/               ← shadcn/ui (60+ composants)
├── data/
│   ├── rdc.ts                   ← 26 provinces, communes, districts de Kinshasa
│   ├── sectors.ts               ← 10 secteurs + services associés
│   └── translations.ts          ← fr / en / ln
├── lib/
│   ├── db.ts                    ← Client Prisma (singleton)
│   ├── auth.ts                  ← bcrypt, validation téléphone +243, mot de passe admin
│   └── session.ts               ← JWT maison signé HMAC-SHA256
├── hooks/
│   └── use-toast.ts             ← Toasts
prisma/
└── schema.prisma                ← Modèle de données complet
```

### 4.3. Les 14 vues (SPA)
1. `landing` — page d'accueil
2. `login` — connexion (utilisateur + admin)
3. `register` — inscription (2 étapes : type → formulaire)
4. `client-dashboard` — espace client
5. `browse-sectors` — navigation par secteurs
6. `provider-detail` — détail d'un prestataire
7. `prestataire-dashboard` — espace prestataire
8. `entreprise-dashboard` — espace entreprise
9. `admin-dashboard` — espace admin (sections navigables)
10. `notifications` — centre de notifications
11. `chat` — liste des conversations
12. `chat-conversation` — conversation 1-à-1
13. `settings` — paramètres (profil, auto-réponse, suppression)
14. `profile-edit` — édition du profil

---

## 5. Modèle de données (Prisma)

| Table | Rôle |
|---|---|
| **User** | Compte (téléphone unique, rôle, statut, certification, auto-réponse, demande de suppression) |
| **ClientProfile** | Infos client (nom, email) |
| **ProviderProfile** | Portfolio prestataire (photo, secteur, services JSON, province, commune, expérience, réseaux) |
| **CompanyProfile** | Fiche entreprise (logo, couverture, type, effectifs, site, adresse, services JSON) |
| **Employee** | Employés d'une entreprise (nom, fonction, manager) |
| **Review** | Avis (auteur → cible, note 1-5, commentaire, masqué) |
| **Notification** | Notifications par utilisateur |
| **ContactMessage** | Messages du formulaire de contact (avec réponse) |
| **AdminAnnouncement** | Annonces envoyées (ciblage + historique) |
| **Conversation** | Conversations 1-à-1 (2 participants uniques) |
| **ChatMessage** | Messages (contenu, lu/non-lu) |
| **Realisation** | Publications (médias, avant/après, lieu, tags, masqué) |
| **PlatformSetting** | Paramètres clé/valeur (accueil, contact, maintenance) |
| **AdminAction** | Historique des actions admin |
| **UserActivity** | Journal d'activité utilisateur (login, logout, etc.) |

---

## 6. API REST (28 routes)

### Authentification
- `POST /api/auth/register` — création de compte (CLIENT/PRESTATAIRE/ENTREPRISE) + auto-login
- `POST /api/auth/login` — connexion + login admin + rate-limit
- `GET /api/auth/me` — profil connecté
- `PUT /api/auth/me/profile` — mise à jour du profil
- `POST /api/public/me` — profil public via token

### Annuaire & recherche
- `GET /api/providers` — liste/filtre prestataires & entreprises
- `GET /api/public/[slug]` — fiche publique par slug
- `GET /api/reviews` + `POST /api/reviews` — avis
- `GET /api/realisations` + `POST/PATCH` — réalisations
- `GET /api/sectors` (via admin) — secteurs

### Communication
- `GET/POST /api/chat` — conversations
- `GET/POST /api/chat/messages` — messages + auto-réponse
- `GET /api/notifications` — notifications
- `POST /api/contact` — formulaire de contact

### Administration
- `GET /api/admin/dashboard` — statistiques
- `GET/POST /api/admin/users` + `POST /api/admin/validate` — utilisateurs & validation
- `GET /api/admin/messages`, `reviews`, `realisations`, `sectors`, `settings`, `actions`, `certification`
- `POST /api/admin/announcements` — annonces groupées/individuelles
- `POST /api/certification` — demandes de certification (utilisateur)

### Compte
- `POST/DELETE /api/account` — demande/cancellation de suppression
- `GET /api/account/activity` — journal d'activité
- `POST /api/employees` — gestion des employés (entreprise)
- `POST /api/upload` — upload base64

---

## 7. Sécurité

- 🔒 **Mots de passe hachés** avec bcrypt (12 rounds), jamais en clair.
- 🔐 **Sessions signées HMAC-SHA256** (stateless, vérification `timingSafeEqual`, expiration 7 jours).
- 🛡️ **Rate limiting** sur le login (5 essais/min/IP).
- 📵 **Blocage des comptes suspendus** (côté serveur + écran fullscreen).
- 📧 **Validation** du format téléphone `+243XXXXXXXXX`.
- 🗄️ **Prisma** : requêtes paramétrées (protection injection SQL).
- ⚙️ **Secrets** dans les variables d'environnement (`DATABASE_URL`, `SESSION_SECRET`).

---

## 8. Déploiement

### Vercel (production)
1. Variables d'environnement : `DATABASE_URL`, `SESSION_SECRET`.
2. Build : `prisma generate && next build` (script `vercel-build`).
3. Base de données PostgreSQL (externe, ex. Neon/Supabase).

### Serveur local / VPS (Caddy)
- **Next standalone** : `NODE_ENV=production bun .next/standalone/server.js`.
- **Caddy** en reverse proxy : `localhost:3000` → port 81, avec en-têtes `X-Forwarded-For`.

### Local (développement)
```bash
npm install
npx prisma db push          # applique le schéma
npm run dev                 # http://localhost:3000
```

---

## 9. Raccourcis utiles

- **Admin** : bouton « Espace Admin » sur l'écran de connexion → mot de passe admin (défini dans `src/lib/auth.ts`, `ADMIN_DEFAULT_PASSWORD`).
- **Numéro WhatsApp support** : +243 990 601 417
- **Email support** : henobuild32@gmail.com

---

## 10. Roadmap / évolutions possibles

- [ ] Messagerie temps réel (WebSocket) — un exemple existe dans `examples/websocket/`
- [ ] Paiement mobile (M-Pesa, Orange Money, Airtel Money)
- [ ] Géolocalisation + carte interactive
- [ ] Application mobile native (React Native / Expo)
- [ ] Notifications push (web + mobile)
- [ ] Statistiques avancées avec graphiques (Recharts déjà intégré)
- [ ] Espace partenaire / contrats numériques

---

*Document généré pour présenter l'application VServiceRDC — Plateforme de services en RDC.*
