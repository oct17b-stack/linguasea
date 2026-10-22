# API server image. Build from the repo root: docker build -t linguasea-api .
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

USER node
EXPOSE 8080
CMD ["node", "--import", "tsx", "server/src/main.ts"]
