# Auth Service

Authentication microservice for the ft_transcendence platform. Handles user registration, login (email/password and GitHub OAuth), email verification, JWT-based sessions, two-factor authentication (2FA), and password management.

## Features

- **Basic auth**: Register, login, logout, email verification
- **OAuth**: GitHub login/register
- **2FA**: TOTP setup, confirm, verify, disable (e.g. Google Authenticator)
- **Password**: Forgot password, reset with token, change password (authenticated)
- **Sessions**: Access token (Bearer) + refresh token (httpOnly cookie)

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Fastify 5
- **ORM**: Prisma (SQLite)
- **Auth**: JWT (access + refresh), signed cookies, bcrypt, speakeasy (2FA)

## Quick Start

### Prerequisites

- Node.js 20+
- Environment variables (see [Environment](#environment))

### Install & Run

```bash
npm install
npm run dev
```

- **Dev**: `npm run dev` (uses `tsx watch`, runs Prisma deploy + generate)
- **Build**: `npm run build`
- **Start**: `npm start` (production)

Service listens on `HOST:PORT` (default `0.0.0.0:3000`).

### Docker

Built from monorepo root; see project `Dockerfile` and `docker-compose*.yml`.

## Environment

| Variable           | Required | Description                    |
|--------------------|----------|--------------------------------|
| `PORT`             | No       | Server port (default: 3000)    |
| `HOST`             | No       | Bind address (default: 0.0.0.0)|
| `USER_SERVICE_URL` | Yes      | User service base URL          |
| `SERVICE_TOKEN`    | Yes      | Service-to-service token       |
| `JWT_SECRET`       | Yes      | Access token signing secret    |
| `JWT_REFRESH_SECRET` | Yes    | Refresh token signing secret   |
| `JWT_TWO_FA`       | Yes      | 2FA temporary token secret     |

Optional: `NODE_ENV`, mailer config for verification/reset emails, `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` for OAuth. API prefix defaults to `/api/v1` (from core).

## API Base URL

All auth routes are under:

```
{baseUrl}/api/v1/auth
```

Examples:

- Register: `POST /api/v1/auth/register`
- Login: `POST /api/v1/auth/login`
- Refresh: `POST /api/v1/auth/refresh` (sends refresh token via cookie)
- OAuth start: redirect user to `GET /api/v1/auth/oauth/github`
- OAuth callback: `GET /api/v1/auth/oauth/github/callback` (handled by backend)

## Documentation

- **[API Endpoints](docs/api-endpoints.md)** — Full list of endpoints, request/response bodies, and error format.
- **[Frontend Integration Guide](docs/frontend-integration-guide.md)** — Flows, usage from React/Next.js, cookies, and token handling.

## Project Structure

```
src/
├── controllers/   # Request handlers (basic, oauth, password, twofa)
├── services/      # Business logic
├── routes/        # Route definitions
├── schemas/       # Validation & OpenAPI-style schemas
├── dto/           # Data transfer types
└── utils/         # env, prisma, JWT, email
prisma/
└── schema.prisma  # AuthUser, RefreshToken, PasswordResetToken
```

## License

Part of ft_transcendence project.
