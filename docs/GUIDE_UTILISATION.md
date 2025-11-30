# Guide d'utilisation

## Fonctionnalités principales

### Messagerie
- Messages texte en temps réel via WebSocket
- Partage de fichiers (max 10 Mo)
- Réponses à des messages
- Édition et suppression de messages

### Contacts
- Ajout de contacts
- Blocage/déblocage d'utilisateurs
- Statuts en ligne/hors ligne

### Groupes
- Création de groupes
- Gestion des membres (ajout/suppression)
- Rôles administrateurs

### Profil
- Photo de profil
- Nom d'utilisateur
- Message de statut

### Sessions
- Gestion des sessions actives
- Déconnexion de sessions distantes

## API Endpoints principaux

### Authentification
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter

### Messages
- `GET /api/messages/conversations` - Liste des conversations
- `POST /api/messages` - Envoyer un message
- `PUT /api/messages/:id` - Modifier un message
- `DELETE /api/messages/:id` - Supprimer un message

### Groupes
- `GET /api/groups` - Liste des groupes
- `POST /api/groups` - Créer un groupe
- `POST /api/groups/:id/members` - Ajouter un membre

### Media
- `POST /api/media/upload` - Upload un fichier
- `GET /api/media` - Liste des médias

## WebSocket Events

### Client → Server
- `send-message` - Envoyer un message
- `send-group-message` - Envoyer un message dans un groupe
- `typing` - Indicateur de saisie
- `message-read` - Marquer un message comme lu

### Server → Client
- `new-message` - Nouveau message reçu
- `new-group-message` - Nouveau message de groupe
- `user-typing` - Utilisateur en train de taper
- `user-online` - Utilisateur en ligne
