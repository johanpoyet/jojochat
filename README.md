# JojoChat

Application de messagerie instantanée en temps réel avec WebSocket.

## 🚀 Get Started

### Prérequis

- Node.js 20+
- MongoDB
- npm

### Installation

```bash
# Installer toutes les dépendances
npm run install:all

# Configurer les variables d'environnement
cp api/.env.example api/.env  # Si le fichier existe
```

### Lancer l'application

```bash
# Lancer API + Frontend en même temps
npm run dev
```

L'application sera accessible sur :
- Frontend : http://localhost:5173
- API : http://localhost:3000

### Avec Docker

```bash
docker-compose up -d
```

## 📦 Structure

```
├── api/          # Backend (Node.js + Express + Socket.io)
└── front/        # Frontend (Vue.js 3 + TypeScript)
```

## 🧪 Tests

```bash
# Tests backend
cd api && npm test

# Coverage
cd api && npm run coverage
```

## 🛠️ Scripts disponibles

- `npm run dev` - Lance API + Frontend
- `npm run install:all` - Installe toutes les dépendances
- `npm test` - Lance les tests backend
- `npm run coverage` - Génère le rapport de couverture

## 📝 Technologies

- **Backend** : Node.js, Express, Socket.io, MongoDB
- **Frontend** : Vue.js 3, TypeScript, Pinia, Vite
- **Tests** : Mocha, Chai, Vitest, Playwright

## 📚 Documentation

- [Guide d'installation](docs/GUIDE_INSTALLATION.md)
- [Guide d'utilisation](docs/GUIDE_UTILISATION.md)
- [FAQ](docs/FAQ.md)

