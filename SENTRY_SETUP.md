# Intégration Sentry — guide rapide

Ce fichier explique comment activer Sentry pour le backend (API) et le frontend (Vite/Vue).

## Variables d'environnement

Backend (API)
- `SENTRY_DSN` : DSN Sentry (projet) pour l'API
- `NODE_ENV` : `production`/`development` (déjà utilisé)

Frontend (Vite)
- `VITE_SENTRY_DSN` : DSN Sentry pour le frontend
- `VITE_SENTRY_RELEASE` : identifiant de release (par ex. `myapp@1.2.3`)

Conseil: placez ces variables dans vos pipelines CI/CD / secrets de déploiement. Pour le développement local, ajoutez-les dans le `.env` (préfixez par `VITE_` pour celles du front si vous voulez y accéder via `import.meta.env`).

## Dépendances à installer

Frontend (depuis `front/`)

```bash
# depuis le dossier front
npm install
# puis ajouter Sentry
npm install @sentry/vue @sentry/tracing --save
```

Backend (depuis `api/`)

`@sentry/node` est déjà présent dans `api/package.json`. Si besoin :

```bash
cd api
npm install
```

## Upload des sourcemaps (fortement recommandé pour le frontend)

Pour que Sentry affiche des stacks lisibles côté front, il faut uploader les sourcemaps lors de la build. Deux options :

1) Utiliser `@sentry/cli` et la configuration dans votre pipeline CI :
   - Installer `@sentry/cli` sur le runner
   - Dans la pipeline, définir `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `VITE_SENTRY_RELEASE`
   - Après `vite build`, lancer :

```bash
sentry-cli releases new $VITE_SENTRY_RELEASE
sentry-cli releases files $VITE_SENTRY_RELEASE upload-sourcemaps dist --url-prefix "~" --rewrite
sentry-cli releases finalize $VITE_SENTRY_RELEASE
```

2) Utiliser un plugin Vite (ex : `vite-plugin-sentry`) — option plus intégrée.

Voir la documentation Sentry pour Vite pour des exemples.

## Tester l'intégration

Backend
1. Démarrer l'API avec `SENTRY_DSN` configuré.
2. Générer une erreur non gérée (ex: lancer une route qui jette une exception) et vérifier dans Sentry que l'événement est reçu.

Frontend
1. Construisez ou lancez le dev server avec `VITE_SENTRY_DSN`.
2. Dans la console, exécutez `throw new Error('Test Sentry frontend')` ou naviguez vers une route qui déclenche une erreur. Vérifiez l'arrivée de l'event dans Sentry.

## Remarques et bonnes pratiques
- Utilisez `VITE_SENTRY_RELEASE` synchronisé avec votre version (git tag ou `package.json` version) pour associer sourcemaps et events.
- Configurez `tracesSampleRate` en production à une valeur raisonnable (ex: 0.2) pour limiter le coût.
- Ne mettez pas le DSN en clair dans les dépôts ; utilisez des secrets.

---
Si vous voulez, je peux :
- ajouter la configuration pour uploader automatiquement les sourcemaps via `sentry-cli` (ajout d'un script npm),
- ou ajouter une page de test dans le frontend qui déclenche volontairement une exception pour valider la remontée.

Dites-moi ce que vous préférez et je l'implémente.
