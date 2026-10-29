# API server image with the web app at /app/. Build from the repo root:
#   docker build -t linguasea-api .
# Ready-made images (amd64 and arm64) are published to ghcr.io/oct17b-stack/linguasea by
# .github/workflows/docker.yml; deploy/qnap/ runs one on a QNAP NAS (docs/DEPLOY-QNAP.md).

# --- Web build of the app (expo export --platform web) -------------------------------------------
# The bundle is plain JavaScript, so it is built once on the build machine for every image platform.
FROM --platform=$BUILDPLATFORM node:22-bookworm-slim AS web
WORKDIR /build
COPY package.json package-lock.json ./
COPY app/package.json app/
COPY tools/package.json tools/
COPY packages/contract/package.json packages/contract/
COPY packages/core/package.json packages/core/
COPY server/package.json server/
RUN npm ci && npm cache clean --force

COPY packages packages
COPY content content
COPY app app
# EXPO_PUBLIC_* values are compiled into the web bundle (public, not secrets).
# "same-origin": the web app calls the server it is served from, whatever its address.
ARG EXPO_PUBLIC_API_URL=same-origin
ARG EXPO_PUBLIC_REVENUECAT_WEB_KEY=
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL \
    EXPO_PUBLIC_REVENUECAT_WEB_KEY=$EXPO_PUBLIC_REVENUECAT_WEB_KEY
RUN npm run content && cd app && npx expo export --platform web --output-dir dist

# --- API server --------------------------------------------------------------------------------
FROM node:22-bookworm-slim

# ffmpeg converts app recordings to the WAV format speech scoring needs.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /srv
ENV NODE_ENV=production

# Install only the server's dependencies (npm needs every workspace manifest to read the lockfile).
COPY package.json package-lock.json ./
COPY app/package.json app/
COPY tools/package.json tools/
COPY packages/contract/package.json packages/contract/
COPY packages/core/package.json packages/core/
COPY server/package.json server/
RUN npm ci --omit=dev --workspace @linguasea/server --include-workspace-root=false && npm cache clean --force

COPY packages/contract/src packages/contract/src
COPY packages/core/src packages/core/src
COPY server/src server/src
COPY server/db server/db
COPY server/public server/public
# Course content: tutor scenarios are built from it; generated speech is served from content/audio.
COPY content content
# The web app, served at https://<server>/app/.
COPY --from=web /build/app/dist web
ENV WEB_DIR=/srv/web

USER node
EXPOSE 8080
CMD ["node", "--import", "tsx", "server/src/main.ts"]
