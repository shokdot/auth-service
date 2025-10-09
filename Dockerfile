FROM node:20 AS builder

WORKDIR /app

COPY apps/core ./apps/core
COPY apps/auth-service ./apps/auth-service

WORKDIR /app/apps/core
RUN npm install && npm run build

WORKDIR /app/apps/auth-service
RUN npm install
COPY apps/auth-service/prisma ./prisma
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

# Copy only the dist files needed for runtime
COPY --from=builder /app/apps/core/dist ./apps/core/dist
COPY --from=builder /app/apps/auth-service/dist ./apps/auth-service/dist
COPY --from=builder /app/apps/auth-service/package*.json ./apps/auth-service/
COPY --from=builder /app/apps/auth-service/prisma ./apps/auth-service/prisma

WORKDIR /app/apps/auth-service

RUN npm install --omit=dev

RUN npx prisma generate

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
