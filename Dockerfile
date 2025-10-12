FROM node:20 AS builder

WORKDIR /apps

COPY core core
COPY auth-service auth-service

WORKDIR /apps/core
RUN npm install && npm run build

WORKDIR /apps/auth-service
RUN npm install

COPY auth-service/prisma ./prisma
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /apps

# Copy only the dist files needed for runtime
COPY --from=builder /apps/core/dist core/dist
COPY --from=builder /apps/auth-service/dist auth-service/dist
COPY --from=builder /apps/auth-service/package*.json auth-service/
COPY --from=builder /apps/auth-service/prisma auth-service/prisma

WORKDIR /apps/auth-service

RUN npm install --omit=dev

RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
