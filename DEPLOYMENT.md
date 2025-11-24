# Deployment Guide

## Overview
This repository uses GitHub Actions for CI and CD with separate workflows for production and staging. Docker multi-stage builds produce a lightweight image that serves the Vue frontend through the Node/Express backend.

## Workflows
- CI: `.github/workflows/ci.yml` — lint, tests (API + front), build, security audit, coverage artifacts.
- Production deploy: `.github/workflows/deploy.yml` — triggered on push to `main`, builds and pushes Docker image, triggers platform deploy, performs health checks.
- Staging deploy: `.github/workflows/staging.yml` — triggered on push to `develop`, similar to production but targets staging.
- Docker build: `.github/workflows/docker-build.yml` — builds and pushes image on tag push (vX.Y.Z).

## Required Secrets
Configure these in GitHub repository settings → Secrets and variables → Actions:

- PROD_API_URL: Base URL of production API (e.g., https://api.example.com)
- STAGING_API_URL: Base URL of staging API
- JWT_SECRET_PROD: JWT secret for production (also used in pre-deploy tests)
- DOCKERHUB_USERNAME: Docker Hub username
- DOCKERHUB_TOKEN: Docker Hub access token (write)
- IMAGE_NAME: Docker repository name (e.g., tp-websocket)
- PROD_DEPLOY_WEBHOOK: Webhook URL to trigger production deploy on your platform
- STAGING_DEPLOY_WEBHOOK: Webhook URL to trigger staging deploy on your platform

Optional (if platform requires):
- CLOUD_PROVIDER_TOKEN / HEROKU_API_KEY / RAILWAY_TOKEN …

## Manual Deploy
- Production: push to `main` branch.
- Staging: push to `develop` branch.
- Tagged Docker release: push a tag like `v1.0.0`.

## Rollback Procedure
1. Identify previous image tag in Docker Hub or from workflow logs.
2. Trigger platform rollback to previous image (via provider UI/CLI), or redeploy with a specific tag by calling your platform webhook with the desired image tag.
3. Verify health at `/health` endpoint.

## Health Checks
Workflows check `${BASE_URL}/health`. Ensure backend exposes this route and returns 200.

## Migrations
Add a migration script in `api/scripts/migrate.js` and a package script `"migrate": "node scripts/migrate.js"`. Then insert a step in deploy workflows before deploying.

## Notes
- Node 18 is used in CI/CD to align with the TP requirements.
- Frontend build artifacts are copied into `api/public` at image build time.


