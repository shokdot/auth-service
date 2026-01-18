import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/server.ts'],
    format: ['esm'],
    target: 'es2022',
    outDir: 'dist',
    external: [
        'fastify-metrics',
        'pino',
        'fastify',
        '@fastify/cookie',
        '@fastify/cors',
        '@fastify/helmet',
        '@fastify/oauth2',
        '@fastify/rate-limit',
        '@fastify/swagger',
        '@fastify/swagger-ui',
        '@prisma/client',
        'axios',
        'bcrypt',
        'dotenv',
        'jsonwebtoken',
        'nodemailer',
        'qrcode',
        'speakeasy',
        'uuid',
        'zod',
        'zxcvbn'
    ],
    noExternal: ['@core'],
});
