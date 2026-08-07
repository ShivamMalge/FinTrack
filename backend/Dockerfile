FROM node:20-alpine

WORKDIR /app

# Copy package files and install all deps (including dev for tsc build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy prisma schema and config, generate client
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

# Copy source and compile TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

# Prune devDependencies for production
RUN npm prune --production

# Copy entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 4001

ENTRYPOINT ["./docker-entrypoint.sh"]
