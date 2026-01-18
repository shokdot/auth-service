FROM node:20 AS builder

WORKDIR /apps

COPY core/package*.json core/
COPY core/tsconfig.json core/
COPY core/src core/src

WORKDIR /apps/core
RUN npm install && npm run build

WORKDIR /apps

COPY auth-service/package*.json auth-service/
COPY auth-service/prisma.config.ts auth-service/
COPY auth-service/tsconfig.json auth-service/
COPY auth-service/tsup.config.ts auth-service/
COPY auth-service/prisma auth-service/prisma
COPY auth-service/src auth-service/src

WORKDIR /apps/auth-service

RUN npm install
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /apps

COPY --from=builder /apps/core/dist core/dist
COPY --from=builder /apps/auth-service/dist auth-service/dist
COPY --from=builder /apps/auth-service/package*.json auth-service/
COPY --from=builder /apps/auth-service/prisma.config.ts auth-service/
COPY --from=builder /apps/auth-service/prisma auth-service/prisma

WORKDIR /apps/auth-service

RUN npm install --omit=dev

EXPOSE 3000

CMD ["npm", "run", "start"]
