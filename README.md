# Auth Service

> Part of the [ft_transcendence](https://github.com/shokdot/ft_transcendence) project.

Authentication microservice for the ft_transcendence platform. Handles user registration, login (email/password and GitHub OAuth), email verification, JWT-based sessions, two-factor authentication (2FA), and password management.

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Fastify 5
- **ORM**: Prisma (SQLite)
- **Auth**: JWT (access + refresh), signed cookies, bcrypt, speakeasy (2FA)

## Quick Start

```bash
npm install
npm run dev
```

Service listens on `HOST:PORT` (default `0.0.0.0:3000`).

### Docker

Built from monorepo root; see project `Dockerfile` and `docker-compose*.yml`.

## Environment

| Variable               | Required | Description                      |
|------------------------|----------|----------------------------------|
| `PORT`                 | No       | Server port (default: 3000)      |
| `HOST`                 | No       | Bind address (default: 0.0.0.0)  |
| `USER_SERVICE_URL`     | Yes      | User service base URL            |
| `SERVICE_TOKEN`        | Yes      | Service-to-service token         |
| `JWT_SECRET`           | Yes      | Access token signing secret      |
| `JWT_REFRESH_SECRET`   | Yes      | Refresh token signing secret     |
| `JWT_TWO_FA`           | Yes      | 2FA temporary token secret       |

Optional: `NODE_ENV`, mailer config (email verification/reset), `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` for OAuth.

---

## API Endpoints

Base URL: **`{AUTH_SERVICE_URL}/api/v1/auth`**

### Authentication

- **Access token** — `Authorization: Bearer <accessToken>` header
- **Refresh token** — HttpOnly cookie named `refreshToken` (path `/api/v1/auth`, SameSite strict)

### Error Response Format

```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": null
  }
}
```

---

### Basic Auth

#### `POST /register`

Create a new user (email + password). User must verify email before logging in.

**Rate limit:** 5 req/min

**Body:**

| Field    | Type   | Required | Description               |
|----------|--------|----------|---------------------------|
| email    | string | Yes      | Valid email               |
| username | string | Yes      | Display name (min 1 char) |
| password | string | Yes      | Min 6 characters          |

**Success (201):**

```json
{
  "status": "success",
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "username": "DisplayName"
  },
  "message": "..."
}
```

**Errors:** 400 (validation), 409 (email exists)

---

#### `POST /login`

Log in with email and password.

**Rate limit:** 5 req/min

**Body:**

| Field    | Type   | Required | Description   |
|----------|--------|----------|---------------|
| email    | string | Yes      | User email    |
| password | string | Yes      | User password |

**Success (200) — no 2FA:**

```json
{
  "status": "success",
  "data": {
    "userId": "uuid",
    "accessToken": "jwt...",
    "tokenType": "Bearer",
    "expiresIn": 900
  },
  "message": "Login successful"
}
```

**Success (200) — 2FA required:**

```json
{
  "status": "pending",
  "data": {
    "userId": "uuid",
    "twoFactorRequired": true,
    "twoFaToken": "jwt..."
  },
  "message": "Two-factor authentication required"
}
```

**Errors:** 400, 401 (invalid credentials), 403 (email not verified), 404

---

#### `POST /refresh`

Issue a new access token using the refresh token cookie. No body. Must be called with credentials.

**Rate limit:** 5 req/min

**Success (200):**

```json
{
  "status": "success",
  "data": {
    "userId": "uuid",
    "accessToken": "jwt...",
    "tokenType": "Bearer",
    "expiresIn": 900
  }
}
```

**Errors:** 401, 403

---

#### `GET /me`

Get current user info. **Auth: Bearer**

**Success (200):**

```json
{
  "status": "success",
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "isEmailVerified": true,
    "hasPassword": true,
    "githubLinked": false,
    "twoFactorEnabled": false,
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

**Errors:** 401, 403, 404, 500

---

#### `DELETE /me`

Delete the current user. **Auth: Bearer**

**Success (200):** `{ "status": "success", "message": "..." }`

**Errors:** 401, 403, 404, 500

---

#### `POST /logout`

Invalidate session and clear refresh token cookie. **Auth: Bearer**

**Success (200):** `{ "status": "success", "message": "Logout successful" }`

---

#### `GET /verify-email`

Verify email using token sent after registration.

**Query:** `token` (string, required)

**Success (200):** `{ "status": "success", "message": "..." }`

**Rate limit:** 5 req/min

---

### OAuth (GitHub)

#### `GET /oauth/github`

Redirect user to this URL to start GitHub OAuth flow. Backend handles the callback and redirects to frontend.

#### `GET /oauth/github/callback`

Handled by the backend. On success, sets refresh token cookie.

**Success (200) — no 2FA:**

```json
{
  "status": "success",
  "data": { "userId": "uuid", "accessToken": "jwt...", "tokenType": "Bearer", "expiresIn": 900 }
}
```

**Success (200) — 2FA required:** same as login 2FA pending response.

**Errors:** 400, 500, 502, 503

---

#### `DELETE /oauth/github`

Disconnect linked GitHub account (only if user has a password). **Auth: Bearer**

**Rate limit:** 5 req/min

**Success (200):** `{ "status": "success", "message": "GitHub account has been disconnected." }`

**Errors:** 400 (`GITHUB_NOT_LINKED`, `PASSWORD_REQUIRED_FOR_DISCONNECT`), 401, 404, 500

---

### Two-Factor Authentication (2FA)

#### `POST /2fa/setup`

Start 2FA setup — returns QR code data URL. **Auth: Bearer** / Rate limit: 5 req/min

**Success (200):**

```json
{
  "status": "success",
  "data": { "userId": "uuid", "qrCodeDataURL": "data:image/png;base64,..." }
}
```

---

#### `POST /2fa/confirm`

Confirm 2FA with TOTP code. **Auth: Bearer**

**Body:** `{ "token": "123456" }`

**Success (200):** `{ "status": "success", "data": { "userId": "uuid" } }`

---

#### `POST /2fa/verify`

Complete login when 2FA is required. Use `twoFaToken` from login as `session_token`. No Bearer needed.

**Body:**

| Field         | Type   | Required | Description                            |
|---------------|--------|----------|----------------------------------------|
| token         | number | Yes      | 6-digit TOTP code                      |
| session_token | string | Yes      | `twoFaToken` value from login response |

**Success (200):** Full access token response (same as login success).

---

#### `DELETE /2fa/disable`

Disable 2FA for the current user. **Auth: Bearer**

**Success (200):** `{ "status": "success", "message": "..." }`

---

### Password

#### `POST /password/forgot`

Request a password reset email.

**Body:** `{ "email": "user@example.com" }`

**Rate limit:** 5 req/min — **Errors:** 404, 500

---

#### `POST /password/reset`

Reset password using token from email.

**Body:** `{ "token": "...", "password": "newpassword" }`

**Rate limit:** 5 req/min — **Errors:** 400, 500

---

#### `PUT /password/change`

Change password while logged in. **Auth: Bearer** / Rate limit: 5 req/min

**Body:**

| Field       | Type   | Required | Description      |
|-------------|--------|----------|------------------|
| oldPassword | string | Yes      | Current password |
| newPassword | string | Yes      | New password     |

---

#### `PUT /password/set`

Set a password for OAuth-only users (no existing password). **Auth: Bearer** / Rate limit: 5 req/min

**Body:** `{ "newPassword": "..." }`

**Errors:** 400 (`PASSWORD_ALREADY_SET`, `WEAK_PASSWORD`), 401, 404, 500

---

### Summary

| Method | Path                       | Auth         | Purpose               |
|--------|----------------------------|--------------|-----------------------|
| POST   | `/register`                | —            | Register              |
| POST   | `/login`                   | —            | Login                 |
| POST   | `/refresh`                 | Cookie       | Refresh access token  |
| GET    | `/me`                      | Bearer       | Current user info     |
| DELETE | `/me`                      | Bearer       | Delete account        |
| POST   | `/logout`                  | Bearer       | Logout                |
| GET    | `/verify-email`            | Query token  | Verify email          |
| GET    | `/oauth/github`            | —            | Start GitHub OAuth    |
| GET    | `/oauth/github/callback`   | —            | OAuth callback        |
| DELETE | `/oauth/github`            | Bearer       | Disconnect GitHub     |
| POST   | `/2fa/setup`               | Bearer       | Start 2FA setup       |
| POST   | `/2fa/confirm`             | Bearer       | Confirm 2FA           |
| POST   | `/2fa/verify`              | —            | Complete 2FA login    |
| DELETE | `/2fa/disable`             | Bearer       | Disable 2FA           |
| POST   | `/password/forgot`         | —            | Request reset         |
| POST   | `/password/reset`          | —            | Reset with token      |
| PUT    | `/password/change`         | Bearer       | Change password       |
| PUT    | `/password/set`            | Bearer       | Set password (OAuth)  |
