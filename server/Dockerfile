# Multi-stage build: compile TS + prisma client, then copy a slim runtime image.
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl

COPY package.json package-lock.json* ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
# npm workspaces — install everything, we'll prune in the runtime stage.
RUN npm install --workspace @paradox/server --include-workspace-root --no-audit --fund=false

COPY server ./server
RUN npm --workspace @paradox/server run build

FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache openssl dumb-init

ENV NODE_ENV=production
COPY package.json package-lock.json* ./
COPY server/package.json ./server/package.json
RUN npm install --workspace @paradox/server --omit=dev --no-audit --fund=false

COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER node
EXPOSE 4000
WORKDIR /app/server
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
