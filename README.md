# GABRWA — Gestion et Administration des Visiteurs

Système complet de gestion des visiteurs pour environnement institutionnel (ambassade, administration, entreprise). Il couvre l'enregistrement des visiteurs, le contrôle au portail, la réception, la signature électronique et l'export des registres.

---

## Fonctionnalités

### Portail (Gate)
- Enregistrement de l'entrée et de la sortie de chaque visiteur
- Attribution d'un statut en temps réel (En attente · Présent · Terminé)
- Signature électronique via QR code scannable sur mobile
- Export du registre journalier en Excel (avec image de signature intégrée)

### Réception
- Suivi des arrivées et départs en réception
- Détection automatique des visiteurs arrêtés au portail sans passer à la réception
- Champ observations libre lors du départ
- Export du registre journalier en Excel (avec observations et signature)

### Administration
- Tableau de bord avec statistiques et graphiques
- Gestion des utilisateurs (admin, portail, réception) avec permissions granulaires
- Registre complet des visiteurs avec historique de toutes les visites
- Rapports filtrables et export Excel / CSV

### Visiteurs
- Fiche visiteur : nom, téléphone, email, adresse, numéro de passeport, numéro de visiteur
- Historique de toutes les visites avec horaires gate et réception
- Aperçu de la signature électronique

### Notifications temps réel
- Notifications en-application via Socket.io
- Notifications système navigateur quand l'onglet est en arrière-plan

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express 4, Socket.io |
| Base de données | PostgreSQL 16, Sequelize ORM |
| Authentification | JWT (jsonwebtoken) |
| Export | ExcelJS |
| Signature | signature_pad (canvas), QR code (qrcode) |
| Infrastructure | Docker, Docker Compose, Nginx |

---

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (avec WSL 2 sur Windows)
- [Git](https://git-scm.com/)

---

## Déploiement (production)

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd visitor-management
```

### 2. Configurer l'environnement

```bash
# Windows
copy .env.example .env

# Linux / macOS
cp .env.example .env
```

Ouvrir `.env` et renseigner les valeurs :

```env
# IP locale du serveur sur le réseau (ex: 192.168.1.50)
# Trouver cette IP avec : ipconfig (Windows) ou ifconfig (Linux/macOS)
APP_HOST=192.168.1.X

DB_PASSWORD=mot_de_passe_base_de_donnees
JWT_SECRET=chaine_aleatoire_longue_et_secrete
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=MotDePasseAdmin
```

> **Trouver l'IP du serveur sous Windows :**
> ```
> ipconfig
> ```
> Chercher **"Carte réseau sans fil Wi-Fi"** → **Adresse IPv4**

### 3. Lancer l'application

```bash
docker compose up -d
```

La première exécution télécharge les images Docker et construit le projet (~5 minutes).

### 4. Vérifier le démarrage

```bash
docker compose ps
```

Les trois services doivent être à l'état **Up** :

```
NAME                STATUS
gabrwa-postgres     Up
gabrwa-backend      Up
gabrwa-frontend     Up
```

### 5. Accéder à l'application

| Depuis | URL |
|---|---|
| Le serveur lui-même | `http://localhost:3000` |
| Autres machines sur le réseau | `http://<APP_HOST>:3000` |

Le compte administrateur est créé automatiquement au premier démarrage avec les identifiants définis dans `.env`.

---

## Développement local

### Backend

```bash
cd backend
cp .env.example .env   # puis remplir les variables
npm install
npm run dev            # démarre sur http://localhost:5001
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # démarre sur http://localhost:3000
```

Le frontend proxie automatiquement les appels API vers `localhost:5001`.

---

## Variables d'environnement

### Fichier `.env` racine (Docker)

| Variable | Description | Obligatoire |
|---|---|---|
| `APP_HOST` | IP du serveur sur le réseau local | Oui |
| `DB_PASSWORD` | Mot de passe PostgreSQL | Oui |
| `JWT_SECRET` | Clé secrète pour les tokens JWT | Oui |
| `ADMIN_USERNAME` | Nom d'utilisateur admin initial | Non (défaut : `admin`) |
| `ADMIN_EMAIL` | Email admin initial | Non (défaut : `admin@company.com`) |
| `ADMIN_PASSWORD` | Mot de passe admin initial | Non (défaut : `Admin@123456`) |

### Fichier `backend/.env` (développement local)

| Variable | Description |
|---|---|
| `PORT` | Port du serveur backend (défaut : `5001`) |
| `DB_HOST` | Hôte PostgreSQL (défaut : `localhost`) |
| `DB_PORT` | Port PostgreSQL (défaut : `5432`) |
| `DB_NAME` | Nom de la base de données |
| `DB_USER` | Utilisateur PostgreSQL |
| `DB_PASSWORD` | Mot de passe PostgreSQL |
| `JWT_SECRET` | Clé secrète JWT |
| `APP_HOST` | IP locale (pour les QR codes de signature) |
| `RATE_LIMIT_MAX` | Limite de requêtes par fenêtre (défaut : `2000`) |

---

## Structure du projet

```
visitor-management/
├── backend/
│   ├── src/
│   │   ├── app.js                  # Point d'entrée Express + Socket.io
│   │   ├── controllers/            # Logique métier
│   │   │   ├── authController.js
│   │   │   ├── gateController.js
│   │   │   ├── receptionController.js
│   │   │   ├── reportController.js
│   │   │   ├── signatureController.js
│   │   │   ├── visitController.js
│   │   │   └── visitorController.js
│   │   ├── middleware/
│   │   │   ├── auth.js             # Authentification JWT
│   │   │   └── validate.js         # Validation express-validator
│   │   ├── models/                 # Modèles Sequelize
│   │   │   ├── GateCheck.js
│   │   │   ├── ReceptionCheck.js
│   │   │   ├── SignatureToken.js
│   │   │   ├── User.js
│   │   │   ├── Visit.js
│   │   │   ├── Visitor.js
│   │   │   └── index.js
│   │   ├── routes/                 # Définition des routes API
│   │   └── utils/seed.js           # Création du compte admin initial
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/             # Composants réutilisables
│   │   ├── context/                # Contextes React (Auth, Notifications)
│   │   ├── hooks/                  # Hooks personnalisés (useSocket)
│   │   ├── pages/                  # Pages par rôle
│   │   │   ├── admin/
│   │   │   ├── gate/
│   │   │   └── reception/
│   │   └── services/api.js         # Appels API centralisés
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── uploads/
│   └── signatures/                 # Signatures électroniques (PNG)
├── docker-compose.yml
└── .env.example
```

---

## API — Endpoints principaux

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/auth/login` | Connexion |
| `GET` | `/auth/me` | Utilisateur connecté |
| `GET` | `/visitors` | Liste des visiteurs (paginée) |
| `POST` | `/visitors` | Créer un visiteur |
| `GET` | `/visitors/:id` | Fiche visiteur avec historique |
| `POST` | `/visits` | Créer une visite |
| `POST` | `/gate/checkin` | Entrée portail |
| `POST` | `/gate/checkout` | Sortie portail |
| `GET` | `/gate/export` | Export Excel portail |
| `POST` | `/reception/checkin` | Arrivée réception |
| `POST` | `/reception/checkout` | Départ réception (+ observations) |
| `GET` | `/reception/export` | Export Excel réception |
| `POST` | `/signature/generate` | Générer un token QR de signature |
| `GET` | `/signature/:token` | Page de signature mobile (public) |
| `POST` | `/signature/:token/sign` | Soumettre une signature (public) |
| `GET` | `/reports/dashboard` | Données tableau de bord |
| `GET` | `/health` | Santé du serveur |

---

## Rôles utilisateurs

| Rôle | Accès |
|---|---|
| `admin` | Accès complet — tableau de bord, rapports, utilisateurs, visiteurs |
| `gate` | Portail uniquement — enregistrement entrée/sortie, signature QR |
| `reception` | Réception uniquement — arrivée/départ réception, observations |

Un administrateur peut également accorder des permissions croisées à un utilisateur (ex: un agent `gate` qui peut aussi accéder à la réception).

---

## Commandes Docker utiles

```bash
# Démarrer en arrière-plan
docker compose up -d

# Arrêter
docker compose down

# Voir les logs en direct
docker compose logs -f backend

# Redémarrer uniquement le backend
docker compose restart backend

# Mettre à jour après un git pull
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## Sécurité

- Mots de passe hashés avec **bcrypt**
- Tokens JWT avec expiration configurable (défaut : 8h)
- Helmet pour les en-têtes HTTP sécurisés
- Rate limiting global (2000 req/15min) + strict sur `/auth/login` (20 req/15min)
- Tokens de signature à usage unique avec expiration 10 minutes
- CORS restreint aux origines configurées

---

## Licence

Usage interne — tous droits réservés.
