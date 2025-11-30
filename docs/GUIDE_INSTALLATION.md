# Guide d'installation

## Installation

```bash
# Installer les dépendances
npm run install:all

# Lancer l'application
npm run dev
```

## Variables d'environnement

Créez `api/.env` :

```env
MONGODB_URI=mongodb://localhost:27017/whatsapp
JWT_SECRET=votre-secret-jwt
PORT=3000
NODE_ENV=development
```

## Docker

```bash
docker-compose up -d
```

## Ports

- Frontend : http://localhost:5173
- API : http://localhost:3000
