# Guide d'installation - JojoChat

## Table des matières
1. [Prérequis](#prérequis)
2. [Installation rapide avec Docker](#installation-rapide-avec-docker)
3. [Installation manuelle](#installation-manuelle)
4. [Vérification de l'installation](#vérification-de-linstallation)
5. [Résolution des problèmes](#résolution-des-problèmes)

---

## Prérequis

Avant d'installer JojoChat, assurez-vous d'avoir les éléments suivants installés sur votre système :

### Option 1 : Installation avec Docker (Recommandée)
- **Docker** : version 20.10 ou supérieure
- **Docker Compose** : version 2.0 ou supérieure
- **Git** : pour cloner le repository

### Option 2 : Installation manuelle
- **Node.js** : version 20.19.0 ou 22.12.0+
- **npm** : version 8.0 ou supérieure
- **MongoDB** : version 7.0 ou supérieure
- **Redis** : version 7.0 ou supérieure
- **Git** : pour cloner le repository

---

## Installation rapide avec Docker

### Étape 1 : Cloner le repository
```bash
git clone https://github.com/votre-username/jojochat.git
cd jojochat
```

### Étape 2 : Configurer les variables d'environnement
Créez un fichier `.env` à la racine du projet :
```bash
JWT_SECRET=votre-secret-jwt-securise
SENTRY_DSN=votre-sentry-dsn-optionnel
```

### Étape 3 : Lancer l'application
```bash
docker-compose up -d
```

### Étape 4 : Accéder à l'application
- **Frontend** : http://localhost:5173
- **API** : http://localhost:3000

---

## Installation manuelle

### Étape 1 : Cloner le repository
```bash
git clone https://github.com/votre-username/jojochat.git
cd jojochat
```

### Étape 2 : Installer MongoDB et Redis

#### Sur Ubuntu/Debian :
```bash
# MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Redis
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### Sur macOS (avec Homebrew) :
```bash
# MongoDB
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0

# Redis
brew install redis
brew services start redis
```

#### Sur Windows :
- **MongoDB** : Téléchargez depuis https://www.mongodb.com/try/download/community
- **Redis** : Utilisez WSL2 ou téléchargez depuis https://github.com/microsoftarchive/redis/releases

### Étape 3 : Installer les dépendances
```bash
# Installer toutes les dépendances (API + Frontend)
npm run install:all

# OU installer séparément
cd api && npm install
cd ../front && npm install
```

### Étape 4 : Configurer l'API
Créez le fichier `api/.env` :
```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/whatsapp
JWT_SECRET=votre-secret-jwt-securise
NODE_ENV=development
SENTRY_DSN=votre-sentry-dsn-optionnel
```

### Étape 5 : Configurer le Frontend
Créez le fichier `front/.env` :
```bash
VITE_API_URL=http://localhost:3000
```

### Étape 6 : Initialiser la base de données (optionnel)
```bash
npm run seed
```

### Étape 7 : Lancer l'application

#### Lancer en mode développement :
```bash
# Lancer API et Frontend simultanément
npm run dev

# OU lancer séparément
npm run dev:api    # API sur http://localhost:3000
npm run dev:front  # Frontend sur http://localhost:5173
```

#### Lancer en mode production :
```bash
# Build le frontend
cd front
npm run build

# Lancer l'API
cd ../api
npm start
```

---

## Vérification de l'installation

### 1. Vérifier que les services sont démarrés

#### Avec Docker :
```bash
docker-compose ps
```
Tous les services doivent être "Up".

#### Installation manuelle :
```bash
# Vérifier MongoDB
mongosh --eval "db.version()"

# Vérifier Redis
redis-cli ping
# Devrait répondre "PONG"

# Vérifier l'API
curl http://localhost:3000/health
# Devrait répondre {"status":"ok"}
```

### 2. Créer votre premier compte
1. Ouvrez votre navigateur à http://localhost:5173
2. Cliquez sur "S'inscrire"
3. Remplissez le formulaire d'inscription
4. Connectez-vous avec vos identifiants

### 3. Tester la messagerie
1. Créez un second compte (utilisez un autre navigateur ou le mode incognito)
2. Ajoutez le premier utilisateur comme contact
3. Envoyez un message
4. Vérifiez que le message est reçu en temps réel

---

## Résolution des problèmes

### L'API ne démarre pas
**Erreur** : `ECONNREFUSED` ou `MongoDB connection error`
**Solution** :
```bash
# Vérifier que MongoDB est démarré
sudo systemctl status mongod  # Linux
brew services list             # macOS

# Redémarrer MongoDB
sudo systemctl restart mongod  # Linux
brew services restart mongodb-community@7.0  # macOS
```

### Le frontend ne se connecte pas à l'API
**Problème** : Erreur CORS ou connexion refusée
**Solution** :
1. Vérifiez que l'API est bien démarrée sur le port 3000
2. Vérifiez le fichier `front/.env` :
   ```bash
   VITE_API_URL=http://localhost:3000
   ```
3. Redémarrez le serveur de développement frontend

### Les websockets ne fonctionnent pas
**Problème** : Messages non reçus en temps réel
**Solution** :
1. Vérifiez que Socket.io est bien connecté (voir la console du navigateur)
2. Vérifiez les paramètres CORS dans `api/src/index.js`
3. Assurez-vous qu'aucun pare-feu ne bloque les connexions websocket

### Port déjà utilisé
**Erreur** : `EADDRINUSE: address already in use`
**Solution** :
```bash
# Trouver le processus utilisant le port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Tuer le processus
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# OU changer le port dans api/.env
PORT=3001
```

### Docker : conteneurs ne démarrent pas
**Solution** :
```bash
# Voir les logs
docker-compose logs

# Reconstruire les images
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Nettoyer Docker (attention : supprime tous les volumes)
docker system prune -a --volumes
```

### Problème de permissions (uploads)
**Erreur** : `EACCES: permission denied` lors de l'upload de fichiers
**Solution** :
```bash
# Créer le dossier uploads avec les bonnes permissions
mkdir -p api/uploads
chmod 755 api/uploads
```

---

## Support

Si vous rencontrez d'autres problèmes :
1. Vérifiez les logs de l'application
2. Consultez la [FAQ](FAQ.md)
3. Ouvrez une issue sur GitHub
4. Contactez l'équipe de support

---

## Prochaines étapes

Maintenant que JojoChat est installé, consultez :
- [Guide d'utilisation](USER_GUIDE.md) : Découvrez toutes les fonctionnalités
- [FAQ](FAQ.md) : Réponses aux questions fréquentes
- [Guide développeur](DEV_SETUP.md) : Pour contribuer au projet
