FROM node:20-alpine AS front-builder
WORKDIR /app/front
COPY front/package*.json ./
RUN npm ci
COPY front/ .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM node:18-alpine AS api-deps
WORKDIR /app/api
COPY api/package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY --from=api-deps /app/api/node_modules ./api/node_modules
COPY api/ ./api/

COPY --from=front-builder /app/front/dist ./api/public

EXPOSE 3000
USER app
WORKDIR /app/api
CMD ["node", "src/index.js"]


