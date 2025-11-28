# Guide de Setup Développement - JojoChat

## Table des matières
1. [Introduction](#introduction)
2. [Prérequis](#prérequis)
3. [Installation de l'environnement](#installation-de-lenvironnement)
4. [Configuration du projet](#configuration-du-projet)
5. [Structure du code](#structure-du-code)
6. [Développement](#développement)
7. [Tests](#tests)
8. [Standards de code](#standards-de-code)
9. [Git workflow](#git-workflow)
10. [Debugging](#debugging)
11. [Contribution](#contribution)

---

## Introduction

Ce guide s'adresse aux développeurs souhaitant contribuer au projet JojoChat. Il couvre la configuration de l'environnement de développement, les bonnes pratiques, et le processus de contribution.

### Stack technique

**Backend**
- Node.js 20.x
- Express.js 5.x
- Socket.io 4.x
- MongoDB 7.x
- Redis 7.x (optionnel en dev)
- Mocha + Chai pour les tests

**Frontend**
- Vue.js 3.x
- TypeScript 5.x
- Pinia (state management)
- Vite 7.x
- Vitest pour les tests
- Playwright pour les tests E2E

---

## Prérequis

### Logiciels requis

#### Obligatoires
- **Node.js** : v20.19.0 ou v22.12.0+
  ```bash
  node --version
  ```
- **npm** : v8.0+
  ```bash
  npm --version
  ```
- **Git** : version récente
  ```bash
  git --version
  ```
- **MongoDB** : v7.0+
  ```bash
  mongod --version
  ```

#### Recommandés
- **Redis** : v7.0+ (pour le cache et les sessions)
- **Docker** : pour le développement containerisé
- **Postman** : pour tester l'API

### IDE et extensions

#### Visual Studio Code (recommandé)
Extensions essentielles :
- **Vue - Official** (Vue.volar)
- **ESLint**
- **Prettier - Code formatter**
- **MongoDB for VS Code**
- **REST Client** ou **Thunder Client**
- **GitLens**
- **Docker**

Configuration VS Code (`.vscode/settings.json`) :
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "vue"
  ],
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## Installation de l'environnement

### 1. Cloner le repository

```bash
# Clone via SSH (recommandé)
git clone git@github.com:votre-username/jojochat.git

# OU via HTTPS
git clone https://github.com/votre-username/jojochat.git

cd jojochat
```

### 2. Installer les dépendances

#### Option A : Installation globale (recommandée)
```bash
npm run install:all
```

#### Option B : Installation séparée
```bash
# Backend
cd api
npm install

# Frontend
cd ../front
npm install
```

### 3. Configurer MongoDB

#### Linux/macOS
```bash
# Installer MongoDB
# Ubuntu/Debian
sudo apt install -y mongodb-org

# macOS
brew install mongodb-community@7.0

# Démarrer MongoDB
sudo systemctl start mongod  # Linux
brew services start mongodb-community@7.0  # macOS

# Vérifier
mongosh
```

#### Windows
1. Télécharger depuis https://www.mongodb.com/try/download/community
2. Installer avec les options par défaut
3. Démarrer le service MongoDB

### 4. Configurer Redis (optionnel)

#### Linux/macOS
```bash
# Ubuntu/Debian
sudo apt install -y redis-server

# macOS
brew install redis

# Démarrer Redis
sudo systemctl start redis  # Linux
brew services start redis  # macOS

# Vérifier
redis-cli ping  # Devrait répondre PONG
```

#### Windows
Utiliser WSL2 ou Docker

### 5. Seed la base de données (optionnel)

```bash
npm run seed
```

Cela créera des utilisateurs, conversations, et messages de test.

---

## Configuration du projet

### Variables d'environnement

#### Backend (`api/.env`)
```bash
# Serveur
PORT=3000
NODE_ENV=development

# Base de données
MONGODB_URI=mongodb://localhost:27017/whatsapp

# Redis (optionnel)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=votre-secret-jwt-tres-securise-pour-dev

# Sentry (optionnel)
SENTRY_DSN=

# Upload
MAX_FILE_SIZE=52428800  # 50 MB en bytes
```

#### Frontend (`front/.env`)
```bash
# API URL
VITE_API_URL=http://localhost:3000

# Sentry (optionnel)
VITE_SENTRY_DSN=

# Debug
VITE_DEBUG=true
```

#### Tests (`api/.env.test`)
```bash
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/whatsapp_test
JWT_SECRET=test-secret
```

---

## Structure du code

### Backend (`api/`)

```
api/
├── src/
│   ├── config/              # Configuration
│   │   ├── database.js      # Connexion MongoDB
│   │   └── sentry.js        # Sentry setup
│   │
│   ├── controllers/         # Logique métier
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── messageController.js
│   │   ├── groupController.js
│   │   ├── contactController.js
│   │   ├── notificationController.js
│   │   └── mediaController.js
│   │
│   ├── middleware/          # Middleware Express
│   │   ├── auth.js          # Authentification JWT
│   │   └── upload.js        # Upload fichiers (Multer)
│   │
│   ├── models/              # Modèles Mongoose
│   │   ├── User.js
│   │   ├── Message.js
│   │   ├── Conversation.js
│   │   ├── Group.js
│   │   ├── Contact.js
│   │   ├── Notification.js
│   │   ├── Media.js
│   │   └── Session.js
│   │
│   ├── routes/              # Routes Express
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── groupRoutes.js
│   │   ├── contactRoutes.js
│   │   ├── notificationRoutes.js
│   │   └── mediaRoutes.js
│   │
│   ├── socket/              # Socket.io handlers
│   │   └── socketHandler.js
│   │
│   └── index.js             # Point d'entrée
│
├── test/                    # Tests
│   ├── setup.js
│   ├── auth.test.js
│   ├── user.test.js
│   ├── message.test.js
│   ├── group.test.js
│   └── contact.test.js
│
├── scripts/
│   └── seed.js              # Script de seed
│
├── uploads/                 # Fichiers uploadés (gitignored)
│
├── .env                     # Variables d'environnement
├── .env.test                # Variables de test
├── .eslintrc.cjs            # Config ESLint
├── .mocharc.json            # Config Mocha
└── package.json
```

### Frontend (`front/`)

```
front/
├── src/
│   ├── assets/              # Assets statiques
│   │   ├── styles/
│   │   └── images/
│   │
│   ├── components/          # Composants Vue
│   │   ├── ChatView.vue
│   │   ├── ChatWindow.vue
│   │   ├── ConversationList.vue
│   │   ├── LoginView.vue
│   │   ├── RegisterView.vue
│   │   ├── ProfileView.vue
│   │   └── __tests__/       # Tests des composants
│   │
│   ├── router/              # Vue Router
│   │   └── index.ts
│   │
│   ├── stores/              # Pinia stores
│   │   ├── auth.ts
│   │   ├── chat.ts
│   │   ├── contact.ts
│   │   └── notification.ts
│   │
│   ├── views/               # Pages
│   │   ├── HomeView.vue
│   │   └── AboutView.vue
│   │
│   ├── App.vue              # Composant racine
│   └── main.ts              # Point d'entrée
│
├── public/                  # Assets publics
│
├── e2e/                     # Tests E2E (Playwright)
│   └── example.spec.ts
│
├── .env                     # Variables d'environnement
├── eslint.config.ts         # Config ESLint
├── tsconfig.json            # Config TypeScript
├── vite.config.ts           # Config Vite
├── vitest.config.ts         # Config Vitest
└── package.json
```

---

## Développement

### Lancer l'application en mode développement

#### Tout lancer simultanément (recommandé)
```bash
# À la racine du projet
npm run dev
```

Cela démarre :
- API sur http://localhost:3000
- Frontend sur http://localhost:5173

#### Lancer séparément

**Backend**
```bash
cd api
npm run dev  # Nodemon avec auto-reload
```

**Frontend**
```bash
cd front
npm run dev  # Vite dev server avec HMR
```

### Accéder à l'application

- **Frontend** : http://localhost:5173
- **API** : http://localhost:3000
- **Health check** : http://localhost:3000/health
- **MongoDB** : mongodb://localhost:27017/whatsapp

### Hot Module Replacement (HMR)

- **Frontend** : Vite HMR activé par défaut
- **Backend** : Nodemon redémarre automatiquement à chaque changement

---

## Tests

### Tests Backend

#### Tests unitaires et d'intégration (Mocha + Chai)
```bash
cd api

# Lancer tous les tests
npm test

# Lancer les tests en mode watch
npm run test:watch

# Générer le rapport de couverture
npm run coverage
```

#### Structure des tests
```javascript
// test/auth.test.js
const { expect } = require('chai');
const request = require('supertest');
const { app } = require('../src/index');

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          fullName: 'Test User'
        });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('token');
    });
  });
});
```

### Tests Frontend

#### Tests unitaires (Vitest)
```bash
cd front

# Lancer les tests
npm run test:unit

# Mode watch
npm run test:unit -- --watch

# Avec UI
npm run test:unit -- --ui
```

#### Tests E2E (Playwright)
```bash
cd front

# Installer les navigateurs (première fois)
npx playwright install

# Lancer les tests E2E
npm run test:e2e

# Mode UI
npm run test:e2e -- --ui

# Tests sur un navigateur spécifique
npm run test:e2e -- --project=chromium
```

#### Structure des tests Vue
```typescript
// components/__tests__/ChatWindow.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatWindow from '../ChatWindow.vue'

describe('ChatWindow', () => {
  it('renders properly', () => {
    const wrapper = mount(ChatWindow, {
      props: { conversationId: '123' }
    })
    expect(wrapper.find('.chat-window').exists()).toBe(true)
  })
})
```

### Couverture de code

**Backend** : Objectif 70%
```bash
cd api
npm run coverage
```

**Frontend** :
```bash
cd front
npm run test:unit -- --coverage
```

---

## Standards de code

### ESLint

#### Backend
```bash
cd api
npm run lint
```

Configuration dans [.eslintrc.cjs](../api/.eslintrc.cjs)

#### Frontend
```bash
cd front
npm run lint
```

Configuration dans [eslint.config.ts](../front/eslint.config.ts)

### Conventions de code

#### JavaScript/TypeScript

**Nommage**
- Variables/fonctions : `camelCase`
- Classes/composants : `PascalCase`
- Constantes : `UPPER_SNAKE_CASE`
- Fichiers : `kebab-case.js` ou `PascalCase.vue`

**Exemples**
```javascript
// ✅ Bon
const userProfile = getUserProfile();
class UserManager {}
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// ❌ Mauvais
const UserProfile = getUserProfile();
class userManager {}
const maxfilesize = 50 * 1024 * 1024;
```

#### Vue.js

**Composants**
- Utiliser la Composition API
- Script setup avec TypeScript
- Props avec validation de types

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  conversationId: string
  userId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  messageSent: [messageId: string]
}>()

const message = ref('')

const isValid = computed(() => message.value.trim().length > 0)

function sendMessage() {
  if (!isValid.value) return
  emit('messageSent', '123')
  message.value = ''
}
</script>

<template>
  <div class="chat-window">
    <input v-model="message" @keyup.enter="sendMessage" />
    <button @click="sendMessage" :disabled="!isValid">
      Send
    </button>
  </div>
</template>

<style scoped>
.chat-window {
  /* styles */
}
</style>
```

#### Mongoose Models

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^\S+@\S+\.\S+$/
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.password;
      return ret;
    }
  }
});

// Index
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

// Méthodes
userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

#### Express Routes

```javascript
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const userController = require('../controllers/userController');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.get('/me', authMiddleware, userController.getProfile);
router.put('/me', authMiddleware, userController.updateProfile);
router.delete('/me', authMiddleware, userController.deleteAccount);

module.exports = router;
```

### Git Commit Messages

Format : `type(scope): message`

**Types**
- `feat` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `docs` : Documentation
- `style` : Formatage, points-virgules manquants, etc.
- `refactor` : Refactoring de code
- `test` : Ajout ou modification de tests
- `chore` : Maintenance, dépendances, etc.

**Exemples**
```bash
feat(auth): add password reset functionality
fix(chat): resolve message duplication issue
docs(readme): update installation instructions
test(user): add tests for user registration
refactor(api): simplify error handling
chore(deps): update dependencies
```

---

## Git workflow

### Branches

**Branches principales**
- `main` : Production
- `develop` : Développement

**Branches de fonctionnalité**
- `feature/nom-de-la-fonctionnalite`
- `fix/nom-du-bug`
- `docs/nom-de-la-doc`

### Workflow

#### 1. Créer une branche
```bash
# Depuis develop
git checkout develop
git pull origin develop

# Créer votre branche
git checkout -b feature/add-video-calls
```

#### 2. Développer
```bash
# Commits réguliers
git add .
git commit -m "feat(video): add video call UI component"
```

#### 3. Tests et linting
```bash
# Backend
cd api
npm run lint
npm test

# Frontend
cd front
npm run lint
npm run test:unit
```

#### 4. Push et Pull Request
```bash
# Push votre branche
git push origin feature/add-video-calls

# Créer une Pull Request sur GitHub
# Vers develop (pas main !)
```

#### 5. Code Review
- Attendez la review
- Appliquez les changements demandés
- Résolvez les conflits si nécessaire

#### 6. Merge
- Après approbation, merge dans develop
- La branche est supprimée automatiquement

---

## Debugging

### Backend

#### Console logging
```javascript
console.log('User:', user);
console.error('Error:', error);
```

#### Debugger Node.js
```bash
# Lancer avec inspect
node --inspect src/index.js

# Ou avec nodemon
nodemon --inspect src/index.js
```

Puis ouvrir `chrome://inspect` dans Chrome.

#### VS Code Debugger
Configuration `.vscode/launch.json` :
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API",
      "program": "${workspaceFolder}/api/src/index.js",
      "cwd": "${workspaceFolder}/api",
      "envFile": "${workspaceFolder}/api/.env"
    }
  ]
}
```

#### Logs Winston
```javascript
const logger = require('./config/logger');

logger.info('User logged in', { userId: user._id });
logger.error('Database error', { error: err.message });
logger.debug('Request body', { body: req.body });
```

### Frontend

#### Vue DevTools
1. Installer l'extension Vue DevTools
2. Ouvrir les DevTools (F12)
3. Onglet Vue

#### Console logging
```typescript
console.log('State:', chatStore.messages)
console.warn('Warning:', 'Invalid message')
console.error('Error:', error)
```

#### Vite Debug
```typescript
// vite.config.ts
export default defineConfig({
  // ...
  server: {
    sourcemap: true
  }
})
```

#### Breakpoints dans VS Code
Configuration `.vscode/launch.json` :
```json
{
  "type": "chrome",
  "request": "launch",
  "name": "Debug Frontend",
  "url": "http://localhost:5173",
  "webRoot": "${workspaceFolder}/front/src",
  "sourceMaps": true
}
```

### Socket.io Debugging

#### Serveur
```javascript
const io = new Server(server, {
  // ...
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.onAny((event, ...args) => {
    console.log('Event:', event, 'Args:', args);
  });
});
```

#### Client
```typescript
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000', {
  debug: true
})

socket.onAny((event, ...args) => {
  console.log('Event received:', event, args)
})
```

### MongoDB Debugging

```bash
# Connexion à MongoDB
mongosh

# Voir les bases de données
show dbs

# Utiliser la base whatsapp
use whatsapp

# Voir les collections
show collections

# Requêtes
db.users.find()
db.messages.find({ sender: ObjectId("...") })
db.conversations.find().limit(10)

# Statistiques
db.messages.countDocuments()
db.users.stats()
```

---

## Contribution

### Checklist avant de soumettre une PR

- [ ] Code respecte les standards ESLint
- [ ] Tous les tests passent
- [ ] Nouveaux tests ajoutés si applicable
- [ ] Documentation mise à jour
- [ ] Pas de console.log oubliés
- [ ] Commit messages suivent les conventions
- [ ] Branche à jour avec develop
- [ ] Aucun conflit

### Code Review

Lors de la review :
- Respectez le contributeur
- Soyez constructif
- Expliquez vos suggestions
- Approuvez quand c'est bon

### Documentation

Si vous ajoutez une fonctionnalité :
- Mettez à jour le README si nécessaire
- Ajoutez des commentaires pour le code complexe
- Documentez les nouvelles API dans ARCHITECTURE.md
- Mettez à jour la FAQ si pertinent

---

## Ressources

### Documentation officielle
- [Node.js](https://nodejs.org/docs/)
- [Express](https://expressjs.com/)
- [Vue.js 3](https://vuejs.org/)
- [Socket.io](https://socket.io/docs/)
- [MongoDB](https://www.mongodb.com/docs/)
- [Mongoose](https://mongoosejs.com/)
- [Pinia](https://pinia.vuejs.org/)
- [Vite](https://vitejs.dev/)

### Guides connexes
- [Guide d'installation](USER_GUIDE_INSTALLATION.md)
- [Architecture](ARCHITECTURE.md)
- [Deployment](DEPLOYMENT.md)

### Communauté
- GitHub Issues : https://github.com/votre-repo/issues
- GitHub Discussions : https://github.com/votre-repo/discussions

---

## Aide et Support

Si vous avez des questions :
1. Consultez la documentation
2. Cherchez dans les issues existantes
3. Posez une question sur GitHub Discussions
4. Contactez les mainteneurs

Bon développement ! 🚀
