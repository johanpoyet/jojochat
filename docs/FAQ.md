# FAQ - Questions Fréquemment Posées

## Table des matières
1. [Général](#général)
2. [Compte et Connexion](#compte-et-connexion)
3. [Messagerie](#messagerie)
4. [Groupes](#groupes)
5. [Confidentialité et Sécurité](#confidentialité-et-sécurité)
6. [Problèmes Techniques](#problèmes-techniques)
7. [Fonctionnalités](#fonctionnalités)

---

## Général

### Qu'est-ce que JojoChat ?
JojoChat est une application de messagerie instantanée open-source qui permet d'échanger des messages, fichiers et médias en temps réel. Elle offre des fonctionnalités similaires à WhatsApp avec un focus sur la confidentialité et la performance.

### JojoChat est-il gratuit ?
Oui, JojoChat est entièrement gratuit et open-source. Vous pouvez l'utiliser, le modifier et le déployer librement.

### Sur quelles plateformes JojoChat est-il disponible ?
Actuellement, JojoChat est disponible en tant qu'application web. Les versions mobiles (iOS, Android) et desktop sont prévues dans les prochaines versions.

### Comment puis-je contribuer au projet ?
Consultez le [Guide de setup développement](DEV_SETUP.md) pour commencer à contribuer. Les contributions sont les bienvenues via GitHub pull requests.

---

## Compte et Connexion

### Comment créer un compte ?
1. Accédez à l'application
2. Cliquez sur "S'inscrire"
3. Remplissez le formulaire avec nom d'utilisateur, email et mot de passe
4. Validez votre inscription

### J'ai oublié mon mot de passe, que faire ?
Actuellement, la fonctionnalité de récupération de mot de passe est en cours de développement. Contactez l'administrateur de votre instance pour réinitialiser votre mot de passe.

### Puis-je changer mon nom d'utilisateur ?
Non, le nom d'utilisateur est unique et ne peut pas être modifié après la création du compte. Vous pouvez cependant modifier votre nom d'affichage dans les paramètres du profil.

### Comment supprimer mon compte ?
1. Allez dans Paramètres → Compte
2. Faites défiler vers le bas
3. Cliquez sur "Supprimer le compte"
4. Confirmez votre choix

⚠️ **Attention** : Cette action est irréversible. Toutes vos données, messages et médias seront définitivement supprimés.

### Puis-je utiliser le même compte sur plusieurs appareils ?
Oui, vous pouvez vous connecter sur plusieurs appareils simultanément. Gérez vos sessions actives dans Paramètres → Sessions.

### Comment me déconnecter d'un appareil à distance ?
1. Allez dans Paramètres → Sessions
2. Trouvez la session à déconnecter
3. Cliquez sur "Déconnecter"

---

## Messagerie

### Les messages sont-ils cryptés ?
Actuellement, les messages utilisent une connexion HTTPS sécurisée. Le chiffrement de bout en bout (E2EE) est prévu dans une future version.

### Quelle est la taille maximale des fichiers que je peux envoyer ?
La taille maximale par fichier est de 50 MB. Pour les vidéos plus volumineuses, il est recommandé d'utiliser un service de partage de fichiers externe.

### Puis-je modifier ou supprimer un message après l'avoir envoyé ?
**Modifier** : Oui, survolez le message → Menu (•••) → Modifier

**Supprimer** :
- "Supprimer pour moi" : toujours possible
- "Supprimer pour tous" : possible dans les 24 heures après l'envoi

### Comment savoir si mon message a été lu ?
Les indicateurs de lecture s'affichent sous chaque message :
- ✓ (un check gris) : Envoyé
- ✓✓ (deux checks gris) : Délivré
- ✓✓ (deux checks bleus) : Lu

### Puis-je désactiver les accusés de lecture ?
Actuellement, cette fonctionnalité n'est pas disponible. Elle est prévue dans une future mise à jour.

### Les messages sont-ils sauvegardés ?
Oui, tous les messages sont sauvegardés dans la base de données. Tant que vous ne les supprimez pas, ils restent accessibles.

### Comment rechercher un message spécifique ?
Utilisez l'icône de recherche 🔍 en haut de l'application, puis tapez votre recherche. Les résultats afficheront tous les messages correspondants avec leur contexte.

### Puis-je envoyer des messages vocaux ?
Cette fonctionnalité est prévue dans une future version. Actuellement, vous pouvez envoyer des fichiers audio.

---

## Groupes

### Combien de membres puis-je ajouter dans un groupe ?
Il n'y a actuellement pas de limite stricte, mais pour des performances optimales, nous recommandons de ne pas dépasser 256 membres par groupe.

### Quelle est la différence entre membre et administrateur ?
**Membres** : Peuvent envoyer des messages et voir les informations du groupe (selon les paramètres)

**Administrateurs** : Peuvent également :
- Ajouter/retirer des membres
- Modifier les informations du groupe
- Promouvoir/révoquer des administrateurs
- Modifier les paramètres du groupe
- Supprimer le groupe

### Comment quitter un groupe ?
1. Ouvrez le groupe
2. Cliquez sur le nom du groupe (en haut)
3. Faites défiler vers le bas
4. Cliquez sur "Quitter le groupe"

Si vous êtes le seul administrateur, vous devrez d'abord promouvoir un autre membre.

### Puis-je créer un groupe sans ajouter de membres immédiatement ?
Non, vous devez ajouter au minimum 2 membres lors de la création d'un groupe. Vous pouvez ensuite ajouter ou retirer des membres.

### Comment empêcher les membres d'envoyer des messages dans un groupe ?
1. Ouvrez les informations du groupe
2. Allez dans Paramètres → Permissions
3. Changez "Qui peut envoyer des messages" à "Administrateurs uniquement"

---

## Confidentialité et Sécurité

### Qui peut voir ma photo de profil ?
Vous pouvez contrôler cela dans Paramètres → Confidentialité → Photo de profil :
- Tout le monde
- Mes contacts uniquement
- Personne

### Qui peut voir quand je suis en ligne ?
Contrôlez cela dans Paramètres → Confidentialité → Dernière connexion.

### Comment bloquer un contact ?
1. Ouvrez la conversation ou le profil du contact
2. Cliquez sur Menu (•••)
3. Sélectionnez "Bloquer"

Les contacts bloqués ne peuvent plus vous envoyer de messages ni voir votre statut.

### Comment débloquer un contact ?
1. Allez dans Paramètres → Confidentialité → Contacts bloqués
2. Trouvez le contact
3. Cliquez sur "Débloquer"

### Mes messages sont-ils visibles par les administrateurs du serveur ?
Les messages sont stockés dans la base de données. Les administrateurs du serveur ont techniquement accès à la base de données. Pour une confidentialité maximale, utilisez une instance que vous contrôlez ou attendez le chiffrement de bout en bout.

### Comment signaler un utilisateur abusif ?
Cette fonctionnalité est en cours de développement. Pour l'instant, bloquez l'utilisateur et contactez l'administrateur de votre instance.

---

## Problèmes Techniques

### L'application ne se charge pas, que faire ?
1. Vérifiez votre connexion Internet
2. Actualisez la page (F5 ou Ctrl+R)
3. Videz le cache du navigateur
4. Vérifiez que l'API est bien démarrée (http://localhost:3000/health)
5. Consultez la console du navigateur pour les erreurs (F12)

### Les messages n'arrivent pas en temps réel
**Vérifications** :
1. Assurez-vous que les WebSockets sont bien connectés (voir la console du navigateur)
2. Vérifiez qu'aucun pare-feu ne bloque les connexions WebSocket
3. Rechargez la page
4. Vérifiez les logs du serveur

### Je ne peux pas télécharger de fichiers
**Solutions** :
1. Vérifiez la taille du fichier (max 50 MB)
2. Vérifiez le format du fichier (formats supportés dans le guide utilisateur)
3. Assurez-vous d'avoir les permissions d'écriture dans le dossier `uploads`
4. Vérifiez les logs du serveur pour les erreurs

### L'application est lente
**Optimisations** :
1. Videz le cache de l'application
2. Vérifiez votre connexion Internet
3. Archivez les anciennes conversations
4. Supprimez les fichiers en cache (Paramètres → Données et stockage)
5. Utilisez un navigateur moderne et à jour

### Erreur "Session expirée"
Reconnectez-vous simplement. Les sessions expirent après une période d'inactivité pour des raisons de sécurité.

### Les notifications ne fonctionnent pas
1. Vérifiez que les notifications sont activées dans les paramètres du navigateur
2. Allez dans Paramètres → Notifications et vérifiez qu'elles sont activées
3. Assurez-vous que le site a la permission d'envoyer des notifications

### Erreur CORS lors de la connexion
Vérifiez que le fichier `front/.env` contient la bonne URL de l'API :
```
VITE_API_URL=http://localhost:3000
```

### MongoDB connection error
1. Vérifiez que MongoDB est démarré :
   ```bash
   sudo systemctl status mongod  # Linux
   brew services list            # macOS
   ```
2. Vérifiez la chaîne de connexion dans `api/.env`
3. Redémarrez MongoDB si nécessaire

---

## Fonctionnalités

### Puis-je personnaliser l'interface ?
Oui, vous pouvez modifier le thème (clair/sombre) dans Paramètres → Apparence.

### Y a-t-il une application mobile ?
Pas encore, mais c'est prévu ! En attendant, l'application web est responsive et fonctionne sur mobile.

### Comment exporter mes données ?
Cette fonctionnalité est en cours de développement. Pour l'instant, contactez l'administrateur de votre instance.

### Puis-je créer des sondages dans les groupes ?
Cette fonctionnalité n'est pas encore disponible mais est prévue dans une future version.

### Y a-t-il des appels vidéo/audio ?
Pas encore. Les appels audio et vidéo sont prévus dans une future version majeure.

### Puis-je programmer l'envoi de messages ?
Non, cette fonctionnalité n'est pas encore disponible.

### Existe-t-il un mode "disparition des messages" ?
Non, mais c'est une fonctionnalité prévue pour une future version.

### Puis-je créer des statuts/stories ?
La fonctionnalité de statut est disponible dans Profil → Modifier le statut. Les stories (statuts éphémères avec médias) sont prévues dans une future version.

---

## Questions sur le Développement

### Comment contribuer au projet ?
Consultez le [Guide de setup développement](DEV_SETUP.md) pour démarrer.

### Où signaler des bugs ?
Ouvrez une issue sur GitHub : https://github.com/votre-repo/issues

### Quelle est la roadmap du projet ?
Consultez le fichier ROADMAP.md ou le projet GitHub pour voir les fonctionnalités planifiées.

### Puis-je utiliser JojoChat dans un projet commercial ?
Oui, JojoChat est sous licence MIT (à vérifier). Vous êtes libre de l'utiliser dans des projets commerciaux.

---

## Support

### Comment obtenir de l'aide ?
1. Consultez la documentation :
   - [Guide d'installation](USER_GUIDE_INSTALLATION.md)
   - [Guide d'utilisation](USER_GUIDE.md)
   - [Guide développeur](DEV_SETUP.md)
2. Recherchez dans les issues GitHub
3. Posez une question sur GitHub Discussions
4. Contactez le support : support@jojochat.com

### Où trouver les logs pour diagnostiquer un problème ?
**Frontend** :
- Ouvrez la console du navigateur (F12)
- Onglet Console pour les erreurs JavaScript

**Backend** :
- Logs dans le terminal où le serveur est lancé
- Ou dans les logs Docker : `docker-compose logs api`

### Comment activer le mode debug ?
Ajoutez dans votre fichier `.env` :
```bash
# API
NODE_ENV=development
DEBUG=*

# Frontend
VITE_DEBUG=true
```

---

## Vous n'avez pas trouvé de réponse ?

- Consultez la documentation complète
- Ouvrez une issue sur GitHub
- Contactez-nous : support@jojochat.com
- Rejoignez notre communauté Discord (lien à venir)
