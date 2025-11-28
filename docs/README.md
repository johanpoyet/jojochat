# Documentation JojoChat

Bienvenue dans la documentation complète de JojoChat, une application de messagerie instantanée moderne et open-source.

## 📚 Table des matières

### Documentation Utilisateur

#### 📖 [Guide d'installation](USER_GUIDE_INSTALLATION.md)
Guide complet pour installer JojoChat sur votre système.

**Contenu :**
- Prérequis système
- Installation avec Docker (recommandée)
- Installation manuelle
- Vérification de l'installation
- Résolution des problèmes courants

#### 💬 [Guide d'utilisation](USER_GUIDE.md)
Documentation complète sur l'utilisation de JojoChat.

**Contenu :**
- Création de compte
- Gestion du profil
- Gestion des contacts
- Messagerie (texte, fichiers, médias)
- Groupes
- Paramètres et confidentialité
- Sessions
- Astuces et raccourcis

#### ❓ [FAQ](FAQ.md)
Réponses aux questions fréquemment posées.

**Catégories :**
- Général
- Compte et Connexion
- Messagerie
- Groupes
- Confidentialité et Sécurité
- Problèmes Techniques
- Fonctionnalités

---

### Documentation Développeur

#### 🏗️ [Architecture du système](ARCHITECTURE.md)
Documentation technique complète de l'architecture.

**Contenu :**
- Vue d'ensemble de l'architecture
- Backend (Node.js + Express + Socket.io)
- Frontend (Vue.js 3 + Pinia)
- Base de données (MongoDB + Redis)
- Communication temps réel
- Sécurité
- Déploiement
- Monitoring et Logging

#### 🛠️ [Guide de setup développement](DEV_SETUP.md)
Guide pour configurer l'environnement de développement.

**Contenu :**
- Prérequis et installation
- Configuration du projet
- Structure du code
- Développement
- Tests (unitaires, intégration, E2E)
- Standards de code
- Git workflow
- Debugging
- Contribution

---

## 🚀 Démarrage rapide

### Pour les utilisateurs

```bash
# Cloner le projet
git clone https://github.com/votre-username/jojochat.git
cd jojochat

# Avec Docker (recommandé)
docker-compose up -d

# OU installation manuelle
npm run install:all
npm run dev
```

Accédez à http://localhost:5173

### Pour les développeurs

```bash
# Cloner et installer
git clone https://github.com/votre-username/jojochat.git
cd jojochat
npm run install:all

# Configurer l'environnement
cp api/.env.example api/.env
cp front/.env.example front/.env

# Lancer en mode développement
npm run dev

# Lancer les tests
cd api && npm test
cd front && npm run test:unit
```

---

## 📋 Vue d'ensemble du projet

### Fonctionnalités principales

✅ **Messagerie en temps réel**
- Messages texte instantanés
- Partage de fichiers et médias
- Indicateurs de lecture et de saisie
- Édition et suppression de messages

✅ **Gestion des contacts**
- Ajout et suppression de contacts
- Blocage d'utilisateurs
- Statut en ligne/hors ligne

✅ **Groupes**
- Création et gestion de groupes
- Rôles (administrateurs, membres)
- Paramètres de confidentialité

✅ **Profil utilisateur**
- Photo de profil
- Bio et statut
- Gestion de compte

✅ **Sécurité**
- Authentification JWT
- Hachage des mots de passe (bcrypt)
- Sessions multiples
- Protection CORS

✅ **Monitoring**
- Sentry pour l'error tracking
- Winston pour le logging
- Health checks

### Technologies utilisées

**Backend**
- Node.js 20.x
- Express.js 5.x
- Socket.io 4.x
- MongoDB 7.x
- Redis 7.x
- JWT pour l'authentification

**Frontend**
- Vue.js 3.x
- TypeScript 5.x
- Pinia (state management)
- Vite 7.x
- Socket.io Client

**Tests**
- Mocha + Chai (backend)
- Vitest (frontend)
- Playwright (E2E)
- Couverture à 70%+

**DevOps**
- Docker + Docker Compose
- GitHub Actions (CI/CD)
- ESLint + Prettier

---

## 📁 Structure du projet

```
jojochat/
├── api/                    # Backend Node.js
│   ├── src/
│   │   ├── config/        # Configuration
│   │   ├── controllers/   # Logique métier
│   │   ├── middleware/    # Middleware Express
│   │   ├── models/        # Modèles Mongoose
│   │   ├── routes/        # Routes API
│   │   ├── socket/        # Gestion WebSocket
│   │   └── index.js       # Point d'entrée
│   ├── test/              # Tests
│   └── package.json
│
├── front/                  # Frontend Vue.js
│   ├── src/
│   │   ├── components/    # Composants Vue
│   │   ├── router/        # Vue Router
│   │   ├── stores/        # Pinia stores
│   │   ├── views/         # Pages
│   │   └── main.ts        # Point d'entrée
│   ├── e2e/               # Tests E2E
│   └── package.json
│
├── docs/                   # Documentation
│   ├── USER_GUIDE_INSTALLATION.md
│   ├── USER_GUIDE.md
│   ├── FAQ.md
│   ├── ARCHITECTURE.md
│   ├── DEV_SETUP.md
│   └── README.md
│
├── docker-compose.yml      # Configuration Docker
├── DEPLOYMENT.md           # Guide de déploiement
└── package.json            # Scripts racine
```

---

## 🔗 Liens utiles

### Documentation
- [Guide d'installation](USER_GUIDE_INSTALLATION.md)
- [Guide d'utilisation](USER_GUIDE.md)
- [FAQ](FAQ.md)
- [Architecture](ARCHITECTURE.md)
- [Guide développeur](DEV_SETUP.md)
- [Déploiement](../DEPLOYMENT.md)

### Ressources externes
- [Node.js](https://nodejs.org/)
- [Vue.js](https://vuejs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Socket.io](https://socket.io/)

### Communauté
- GitHub Repository : https://github.com/votre-username/jojochat
- Issues : https://github.com/votre-username/jojochat/issues
- Discussions : https://github.com/votre-username/jojochat/discussions

---

## 🤝 Contribution

Nous accueillons les contributions ! Voici comment participer :

1. **Fork** le projet
2. **Créez** une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. **Commitez** vos changements (`git commit -m 'feat: add some AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrez** une Pull Request

Consultez le [Guide de setup développement](DEV_SETUP.md) pour plus de détails.

---

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## 📧 Support

### Pour les utilisateurs
- Consultez la [FAQ](FAQ.md)
- Ouvrez une [issue](https://github.com/votre-username/jojochat/issues)
- Email : support@jojochat.com

### Pour les développeurs
- Consultez le [Guide développeur](DEV_SETUP.md)
- [GitHub Discussions](https://github.com/votre-username/jojochat/discussions)
- Email : dev@jojochat.com

---

## 🗺️ Roadmap

### Version actuelle (v1.0)
- ✅ Messagerie texte en temps réel
- ✅ Partage de fichiers et médias
- ✅ Groupes
- ✅ Gestion des contacts
- ✅ Authentification JWT
- ✅ Tests automatisés

### Prochaines versions

**v1.1 (Q1 2025)**
- [ ] Chiffrement de bout en bout (E2EE)
- [ ] Appels audio/vidéo (WebRTC)
- [ ] Messages vocaux
- [ ] Application mobile (React Native)

**v1.2 (Q2 2025)**
- [ ] Stories/Statuts éphémères
- [ ] Sondages dans les groupes
- [ ] Bots et API publique
- [ ] Application desktop (Electron)

**v2.0 (Q3 2025)**
- [ ] Architecture microservices
- [ ] Self-hosting facilité
- [ ] Themes personnalisables
- [ ] Plugins et extensions

---

## 🙏 Remerciements

Merci à tous les contributeurs qui ont participé à ce projet !

- [Liste des contributeurs](https://github.com/votre-username/jojochat/graphs/contributors)

---

## ⭐ Star History

Si vous trouvez ce projet utile, n'hésitez pas à lui donner une ⭐ sur GitHub !

---

**Dernière mise à jour** : Novembre 2025

**Version de la documentation** : 1.0.0
