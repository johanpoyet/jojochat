# Architecture du Système - JojoChat

## Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture globale](#architecture-globale)
3. [Backend (API)](#backend-api)
4. [Frontend](#frontend)
5. [Base de données](#base-de-données)
6. [Communication temps réel](#communication-temps-réel)
7. [Sécurité](#sécurité)
8. [Déploiement](#déploiement)
9. [Monitoring et Logging](#monitoring-et-logging)

---

## Vue d'ensemble

JojoChat est une application de messagerie instantanée construite avec une architecture moderne client-serveur utilisant :
- **Backend** : Node.js + Express + Socket.io
- **Frontend** : Vue.js 3 + Pinia + TypeScript
- **Base de données** : MongoDB (base principale) + Redis (cache)
- **Communication** : REST API + WebSockets (Socket.io)

### Caractéristiques principales
- Architecture microservices-ready
- Communication temps réel bidirectionnelle
- Authentification JWT
- Upload de fichiers avec stockage local
- Monitoring avec Sentry
- Tests automatisés (Mocha, Chai, Vitest, Playwright)
- CI/CD avec GitHub Actions
- Déploiement Docker

---

## Architecture globale

```
┌─────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Vue.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Router     │  │    Pinia     │  │    Socket.io Client  │  │
│  │  (Vue Router)│  │   (State)    │  │   (WebSockets)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Components (Vue 3 Composition API)           │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (Node.js)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Express    │  │  Socket.io   │  │    Middleware        │  │
│  │   (REST API) │  │  (WebSocket) │  │  (Auth, Upload...)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Controllers  │  │    Routes    │  │      Models          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         PERSISTENCE                             │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐│
│  │       MongoDB            │  │          Redis               ││
│  │  (Data principale)       │  │  (Cache & Sessions)          ││
│  └──────────────────────────┘  └──────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Backend (API)

### Structure des dossiers

```
api/
├── src/
│   ├── config/           # Configuration (DB, Sentry, etc.)
│   │   ├── database.js   # Connexion MongoDB
│   │   └── sentry.js     # Configuration Sentry
│   ├── controllers/      # Logique métier
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── messageController.js
│   │   ├── groupController.js
│   │   ├── contactController.js
│   │   ├── notificationController.js
│   │   └── mediaController.js
│   ├── middleware/       # Middleware Express
│   │   ├── auth.js       # Authentification JWT
│   │   └── upload.js     # Gestion upload fichiers (Multer)
│   ├── models/           # Modèles Mongoose
│   │   ├── User.js
│   │   ├── Message.js
│   │   ├── Conversation.js
│   │   ├── Group.js
│   │   ├── Contact.js
│   │   ├── Notification.js
│   │   ├── Media.js
│   │   └── Session.js
│   ├── routes/           # Routes Express
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── groupRoutes.js
│   │   ├── contactRoutes.js
│   │   ├── notificationRoutes.js
│   │   └── mediaRoutes.js
│   ├── socket/           # Gestion WebSocket
│   │   └── socketHandler.js
│   └── index.js          # Point d'entrée
├── test/                 # Tests
│   ├── setup.js          # Configuration tests
│   └── **/*.test.js      # Tests unitaires et d'intégration
├── scripts/
│   └── seed.js           # Script de seed
├── uploads/              # Fichiers uploadés
├── .env                  # Variables d'environnement
├── .env.test             # Variables pour les tests
└── package.json
```

### Technologies et dépendances principales

#### Production
- **express** (5.1.0) : Framework web
- **mongoose** (8.19.2) : ODM pour MongoDB
- **socket.io** (4.8.1) : Communication temps réel
- **jsonwebtoken** (9.0.2) : Authentification JWT
- **bcrypt** (6.0.0) : Hachage des mots de passe
- **multer** (2.0.2) : Upload de fichiers
- **cors** (2.8.5) : Gestion CORS
- **winston** (3.18.3) : Logging
- **@sentry/node** (10.26.0) : Monitoring et error tracking
- **dotenv** (17.2.3) : Variables d'environnement

#### Développement
- **mocha** (11.7.4) : Framework de tests
- **chai** (4.3.10) : Assertions
- **supertest** (7.1.4) : Tests API HTTP
- **c8** (10.1.2) : Couverture de code
- **eslint** (9.11.1) : Linting
- **nodemon** (3.1.10) : Auto-reload en développement

### Endpoints API principaux

#### Authentification (`/api/auth`)
- `POST /register` : Inscription
- `POST /login` : Connexion
- `POST /logout` : Déconnexion
- `POST /refresh` : Rafraîchir le token

#### Utilisateurs (`/api/users`)
- `GET /me` : Profil de l'utilisateur connecté
- `PUT /me` : Mettre à jour le profil
- `DELETE /me` : Supprimer le compte
- `GET /:id` : Obtenir un utilisateur
- `GET /search` : Rechercher des utilisateurs

#### Messages (`/api/messages`)
- `GET /conversation/:conversationId` : Messages d'une conversation
- `POST /` : Envoyer un message
- `PUT /:id` : Modifier un message
- `DELETE /:id` : Supprimer un message

#### Groupes (`/api/groups`)
- `POST /` : Créer un groupe
- `GET /` : Lister les groupes de l'utilisateur
- `GET /:id` : Détails d'un groupe
- `PUT /:id` : Modifier un groupe
- `DELETE /:id` : Supprimer un groupe
- `POST /:id/members` : Ajouter des membres
- `DELETE /:id/members/:userId` : Retirer un membre
- `PUT /:id/members/:userId/role` : Modifier le rôle d'un membre

#### Contacts (`/api/contacts`)
- `GET /` : Lister les contacts
- `POST /` : Ajouter un contact
- `DELETE /:id` : Supprimer un contact
- `POST /:id/block` : Bloquer un contact
- `DELETE /:id/block` : Débloquer un contact

#### Médias (`/api/media`)
- `POST /upload` : Upload un fichier
- `GET /:id` : Télécharger un fichier

#### Notifications (`/api/notifications`)
- `GET /` : Lister les notifications
- `PUT /:id/read` : Marquer comme lu
- `DELETE /:id` : Supprimer une notification

#### Santé
- `GET /health` : Vérifier l'état du serveur

### Middleware

#### Authentification (auth.js)
```javascript
// Vérifie le token JWT dans les headers
Authorization: Bearer <token>

// Ajoute req.user avec les infos de l'utilisateur
```

#### Upload (upload.js)
```javascript
// Gère l'upload de fichiers avec Multer
// Stockage local dans api/uploads/
// Limite de taille : 50 MB
// Formats acceptés : images, vidéos, documents, audio
```

### Modèles de données

#### User
- username (unique)
- email (unique)
- password (hashé avec bcrypt)
- fullName
- avatar
- bio
- status (online, away, busy, invisible)
- lastSeen
- createdAt, updatedAt

#### Message
- conversation (ref)
- sender (ref User)
- content
- type (text, image, video, audio, file)
- media (ref Media)
- replyTo (ref Message)
- reactions
- isEdited
- isDeleted
- deletedFor (array de User IDs)
- createdAt, updatedAt

#### Conversation
- type (private, group)
- participants (array de User refs)
- group (ref Group)
- lastMessage (ref Message)
- lastMessageAt
- createdAt, updatedAt

#### Group
- name
- description
- avatar
- admin (ref User)
- members (array de {user, role, joinedAt})
- settings
- createdAt, updatedAt

#### Contact
- user (ref User)
- contact (ref User)
- status (pending, accepted, blocked)
- addedAt

#### Notification
- user (ref User)
- type (message, contact_request, group_invite, etc.)
- content
- data (JSON)
- isRead
- createdAt

#### Media
- filename
- originalName
- mimeType
- size
- path
- uploadedBy (ref User)
- uploadedAt

#### Session
- user (ref User)
- token
- device
- browser
- os
- ip
- location
- lastActivity
- createdAt

---

## Frontend

### Structure des dossiers

```
front/
├── src/
│   ├── assets/           # Ressources statiques
│   │   ├── styles/       # CSS globaux
│   │   └── images/       # Images
│   ├── components/       # Composants Vue
│   │   ├── ChatView.vue
│   │   ├── ChatWindow.vue
│   │   ├── ConversationList.vue
│   │   ├── ConversationInfo.vue
│   │   ├── ContactsView.vue
│   │   ├── CreateGroupModal.vue
│   │   ├── GroupInfoPanel.vue
│   │   ├── GroupMembers.vue
│   │   ├── LoginView.vue
│   │   ├── RegisterView.vue
│   │   ├── ProfileView.vue
│   │   ├── SettingsView.vue
│   │   ├── SessionsView.vue
│   │   ├── StatusView.vue
│   │   ├── BlockedContactsView.vue
│   │   ├── MessageInput.vue
│   │   ├── TypingIndicator.vue
│   │   └── __tests__/    # Tests des composants
│   ├── router/           # Configuration Vue Router
│   │   └── index.ts
│   ├── stores/           # Stores Pinia (state management)
│   │   ├── auth.ts
│   │   ├── chat.ts
│   │   ├── contact.ts
│   │   └── notification.ts
│   ├── views/            # Pages principales
│   │   ├── HomeView.vue
│   │   └── AboutView.vue
│   ├── App.vue           # Composant racine
│   └── main.ts           # Point d'entrée
├── public/               # Assets publics
├── e2e/                  # Tests end-to-end (Playwright)
├── .env.example          # Template variables d'environnement
└── package.json
```

### Technologies et dépendances principales

#### Production
- **vue** (3.5.22) : Framework frontend
- **vue-router** (4.6.3) : Routage
- **pinia** (3.0.3) : State management
- **socket.io-client** (4.8.1) : Client WebSocket
- **@sentry/vue** (7.0.0) : Monitoring frontend
- **lucide-vue-next** (0.552.0) : Icônes
- **@fortawesome/fontawesome-free** (7.1.0) : Icônes supplémentaires

#### Développement
- **typescript** (5.9.0) : Typage statique
- **vite** (7.1.11) : Build tool et dev server
- **vitest** (3.2.4) : Tests unitaires
- **@playwright/test** (1.56.1) : Tests E2E
- **eslint** (9.37.0) : Linting
- **vue-tsc** (3.1.1) : Type-checking pour Vue

### Architecture des stores (Pinia)

#### Auth Store (`stores/auth.ts`)
- État : user, token, isAuthenticated
- Actions : login, register, logout, updateProfile, deleteAccount

#### Chat Store (`stores/chat.ts`)
- État : conversations, messages, activeConversation, typing
- Actions : loadConversations, sendMessage, editMessage, deleteMessage, markAsRead

#### Contact Store (`stores/contact.ts`)
- État : contacts, requests, blockedContacts
- Actions : addContact, acceptRequest, blockContact, unblockContact

#### Notification Store (`stores/notification.ts`)
- État : notifications, unreadCount
- Actions : loadNotifications, markAsRead, deleteNotification

### Routing

```typescript
Routes principales :
- / : Page d'accueil (ChatView si authentifié)
- /login : Connexion
- /register : Inscription
- /chat : Interface de chat
- /profile : Profil utilisateur
- /settings : Paramètres
- /contacts : Gestion des contacts
- /about : À propos

// Routes protégées (authentification requise)
// Utilisation de navigation guards
```

### Communication avec l'API

#### HTTP (Axios/Fetch)
- Base URL configurée via VITE_API_URL
- Intercepteurs pour ajouter le token JWT
- Gestion des erreurs centralisée

#### WebSocket (Socket.io)
```typescript
Événements émis :
- join-conversation : Rejoindre une conversation
- leave-conversation : Quitter une conversation
- send-message : Envoyer un message
- typing : Indicateur de saisie
- stop-typing : Arrêt de saisie

Événements reçus :
- new-message : Nouveau message
- message-updated : Message modifié
- message-deleted : Message supprimé
- user-typing : Utilisateur en train d'écrire
- user-status-changed : Changement de statut
- notification : Nouvelle notification
```

---

## Base de données

### MongoDB

#### Collections principales

**users**
```javascript
{
  _id: ObjectId,
  username: String (unique, index),
  email: String (unique, index),
  password: String (hashed),
  fullName: String,
  avatar: String,
  bio: String,
  status: String,
  lastSeen: Date (index),
  createdAt: Date,
  updatedAt: Date
}
```

**messages**
```javascript
{
  _id: ObjectId,
  conversation: ObjectId (ref, index),
  sender: ObjectId (ref, index),
  content: String,
  type: String,
  media: ObjectId (ref),
  replyTo: ObjectId (ref),
  reactions: [{user: ObjectId, emoji: String}],
  isEdited: Boolean,
  isDeleted: Boolean,
  deletedFor: [ObjectId],
  createdAt: Date (index),
  updatedAt: Date
}
```

**conversations**
```javascript
{
  _id: ObjectId,
  type: String,
  participants: [ObjectId] (index),
  group: ObjectId (ref),
  lastMessage: ObjectId (ref),
  lastMessageAt: Date (index),
  createdAt: Date,
  updatedAt: Date
}
```

**groups**
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  avatar: String,
  admin: ObjectId (ref),
  members: [{
    user: ObjectId (ref),
    role: String,
    joinedAt: Date
  }],
  settings: {
    whoCanSend: String,
    whoCanEdit: String,
    whoCanAddMembers: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Index optimisés
- Users : username, email, lastSeen
- Messages : conversation, sender, createdAt
- Conversations : participants, lastMessageAt
- Contacts : user+contact (compound)

### Redis

#### Utilisation
- **Sessions utilisateur** : Stockage temporaire des sessions actives
- **Cache** : Mise en cache des données fréquemment accédées
- **Presence** : Suivi du statut en ligne/hors ligne
- **Rate limiting** : Limitation du nombre de requêtes

#### Structure des clés
```
session:{userId}:{sessionId} : Session data
cache:user:{userId} : User profile cache
presence:{userId} : User online status
ratelimit:{userId}:{endpoint} : Rate limit counter
```

---

## Communication temps réel

### Socket.io

#### Configuration serveur
```javascript
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

#### Authentification Socket.io
- Middleware d'authentification JWT
- Vérification du token avant connexion
- Association socket ↔ user

#### Rooms et namespaces
- Chaque conversation = une room Socket.io
- Les utilisateurs rejoignent les rooms de leurs conversations
- Événements broadcast uniquement aux membres de la room

#### Événements principaux

**Connexion**
```javascript
connection : Nouvelle connexion socket
disconnect : Déconnexion
```

**Messages**
```javascript
send-message : Envoi d'un message
new-message : Nouveau message reçu
message-updated : Message modifié
message-deleted : Message supprimé
```

**Présence**
```javascript
user-online : Utilisateur en ligne
user-offline : Utilisateur hors ligne
typing : Indicateur de saisie
stop-typing : Arrêt de saisie
```

**Conversations**
```javascript
join-conversation : Rejoindre une conversation
leave-conversation : Quitter une conversation
conversation-updated : Conversation modifiée
```

---

## Sécurité

### Authentification

#### JWT (JSON Web Tokens)
```javascript
Structure du token :
{
  userId: ObjectId,
  username: String,
  iat: Number,  // Issued at
  exp: Number   // Expiration
}

Durée de vie : 7 jours
Stockage : localStorage (côté client)
```

#### Hachage des mots de passe
- **Bibliothèque** : bcrypt
- **Salt rounds** : 10
- Jamais de stockage en clair

### Validation des données

#### Backend
- Validation des entrées avec Mongoose schemas
- Sanitization des données
- Échappement des caractères spéciaux

#### Frontend
- Validation des formulaires
- Restriction des types de fichiers
- Limitation de taille des uploads

### Protection CORS
- Configuration stricte des origines autorisées
- Gestion des credentials
- Headers sécurisés

### Protection contre les attaques

#### SQL/NoSQL Injection
- Utilisation de Mongoose (parameterized queries)
- Validation stricte des entrées

#### XSS (Cross-Site Scripting)
- Échappement automatique par Vue.js
- Content Security Policy (CSP)
- Sanitization des contenus utilisateur

#### CSRF (Cross-Site Request Forgery)
- Tokens JWT avec vérification
- SameSite cookies

#### Rate Limiting
- Limitation du nombre de requêtes par IP/utilisateur
- Protection contre le brute force
- Throttling des endpoints sensibles

### Gestion des fichiers

#### Upload
- Vérification du type MIME
- Limitation de taille (50 MB)
- Stockage hors du webroot
- Noms de fichiers uniques (UUID)

#### Stockage
- Fichiers stockés dans `api/uploads/`
- Organisation par type et date
- Permissions strictes

---

## Déploiement

### Docker

#### Architecture multi-stage

**Frontend Dockerfile**
```dockerfile
# Stage 1: Build
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

**API Dockerfile**
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]
```

#### Docker Compose
- **mongodb** : Base de données principale
- **redis** : Cache et sessions
- **api** : Backend Node.js
- **frontend** : Frontend Vue.js avec Nginx

### CI/CD (GitHub Actions)

#### Workflows

**CI** (`.github/workflows/ci.yml`)
- Lint (ESLint)
- Tests backend (Mocha)
- Tests frontend (Vitest)
- Build
- Couverture de code

**Production Deploy** (`.github/workflows/deploy.yml`)
- Déclenché sur push vers `main`
- Build Docker image
- Push vers Docker Hub
- Déploiement via webhook
- Health checks

**Staging Deploy** (`.github/workflows/staging.yml`)
- Déclenché sur push vers `develop`
- Processus similaire à production
- Environnement de staging

### Environnements

#### Développement
- API : http://localhost:3000
- Frontend : http://localhost:5173
- MongoDB : localhost:27017
- Redis : localhost:6379

#### Production
- Variables d'environnement via secrets
- HTTPS obligatoire
- Compression activée
- Logs centralisés

---

## Monitoring et Logging

### Sentry

#### Configuration
- **Backend** : @sentry/node
- **Frontend** : @sentry/vue
- Capture automatique des erreurs
- Breadcrumbs pour le contexte
- Release tracking

#### Événements capturés
- Erreurs non gérées
- Rejets de promesses
- Erreurs HTTP 5xx
- Erreurs de validation
- Timeouts

### Winston (Backend Logging)

#### Niveaux de log
- **error** : Erreurs critiques
- **warn** : Avertissements
- **info** : Informations générales
- **http** : Requêtes HTTP
- **debug** : Debugging

#### Transports
- Console (développement)
- Fichiers (production)
- Sentry (erreurs)

### Métriques

#### Health Check
```javascript
GET /health
Response: {
  status: 'ok',
  timestamp: Date,
  uptime: Number,
  mongodb: 'connected',
  redis: 'connected'
}
```

#### Monitoring recommandé
- Temps de réponse API
- Nombre de connexions WebSocket actives
- Utilisation mémoire
- Taux d'erreur
- Latence base de données

---

## Évolution et Scalabilité

### Améliorations futures

#### Architecture
- Migration vers microservices
- Message queue (RabbitMQ, Kafka)
- CDN pour les médias
- Load balancing

#### Performance
- Cache Redis étendu
- Pagination des messages
- Lazy loading des conversations
- Compression des images

#### Fonctionnalités
- Chiffrement de bout en bout (E2EE)
- Appels audio/vidéo (WebRTC)
- Stories/Statuts éphémères
- Bots et API publique

### Considérations de scalabilité

#### Horizontal scaling
- API stateless (facilite la réplication)
- Sessions dans Redis (partagées)
- Sticky sessions pour WebSockets

#### Vertical scaling
- Optimisation des requêtes MongoDB
- Index appropriés
- Connection pooling

#### Database sharding
- Sharding par utilisateur
- Réplication MongoDB
- Read replicas

---

## Diagrammes

### Flux d'authentification

```
Client                  API                   MongoDB
  │                      │                       │
  ├─POST /auth/register─>│                       │
  │                      ├──Hash password───────>│
  │                      ├──Create user─────────>│
  │                      │<─────User created─────┤
  │                      ├──Generate JWT─────────│
  │<─────JWT token───────┤                       │
  │                      │                       │
  ├─GET /users/me───────>│                       │
  │  (Header: JWT)       ├──Verify JWT──────────>│
  │                      ├──Get user────────────>│
  │<─────User data───────┤<─────User data────────┤
```

### Flux d'envoi de message

```
Sender                 API              Socket.io           Receiver
  │                     │                    │                  │
  ├──POST /messages────>│                    │                  │
  │                     ├──Save to DB────────│                  │
  │<────Message saved───┤                    │                  │
  │                     ├──Emit 'new-message'>│                  │
  │                     │                    ├──Broadcast───────>│
  │                     │                    │                  │
  │                     │                    │                  │
  ├──Socket: delivered──│<──Socket: received─┤<─────────────────┤
  │                     │                    │                  │
  ├──Socket: read───────│<──Socket: read─────┤<─────────────────┤
```

---

## Ressources

### Documentation technique
- [Express.js](https://expressjs.com/)
- [Vue.js 3](https://vuejs.org/)
- [Socket.io](https://socket.io/)
- [MongoDB](https://www.mongodb.com/docs/)
- [Pinia](https://pinia.vuejs.org/)

### Guides connexes
- [Guide d'installation](USER_GUIDE_INSTALLATION.md)
- [Guide développeur](DEV_SETUP.md)
- [Deployment Guide](DEPLOYMENT.md)
