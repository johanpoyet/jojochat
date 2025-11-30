# FAQ

## Spécificités du projet

### Architecture
- **Backend** : Node.js + Express + Socket.io
- **Frontend** : Vue.js 3 + TypeScript + Pinia
- **Base de données** : MongoDB
- **Communication** : WebSocket pour le temps réel

### Authentification
- JWT (JSON Web Tokens)
- Sessions multiples supportées
- Mots de passe hachés avec bcrypt

### WebSocket
- Connexion authentifiée via token JWT
- Events bidirectionnels pour la messagerie
- Gestion des erreurs avec retry automatique

### Limites
- Taille max fichier : 10 Mo
- Types supportés : images, vidéos, audio, documents
- Pas de chiffrement bout-en-bout (pour l'instant)

### Tests
- Coverage : 70%+ (Mocha + Chai)
- Tests unitaires et d'intégration
- Tests E2E avec Playwright (frontend)

### Déploiement
- Docker Compose pour le développement
- Support Railway/Heroku pour la production
- Variables d'environnement requises : `MONGODB_URI`, `JWT_SECRET`
