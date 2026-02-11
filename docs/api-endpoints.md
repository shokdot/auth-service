# Auth Service — API Endpoints

Base URL for all auth endpoints: **`{AUTH_SERVICE_URL}/api/v1/auth`**

Example: `http://localhost:3000/api/v1/auth`

---

## Authentication

### Access token

- **Where**: `Authorization` header
- **Format**: `Bearer <accessToken>`
- **Required for**: `/me`, `DELETE /me`, `/logout`, `/password/change`, `/2fa/setup`, `/2fa/confirm`, `/2fa/disable`

### Refresh token

- **Where**: HttpOnly cookie named `refreshToken`
- **Path**: Cookie is set for path `/api/v1/auth` (sent to auth endpoints including refresh and logout)
- **SameSite**: `strict`
- **Purpose**: Obtain new access token via `POST /refresh` (with credentials so cookie is sent)

---

## Error response format

All errors use this shape:

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

`details` may be an object for validation errors. HTTP status code matches the error (e.g. 401, 403, 404).

---

## Basic auth

### POST `/register`

Create a new user (email + password). User must verify email before login.

**Rate limit:** 5 requests per minute.

**Request body:**

| Field     | Type   | Required | Description              |
|----------|--------|----------|--------------------------|
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

**Errors:** 400 (validation), 409 (email exists).

---

### POST `/login`

Log in with email and password.

**Rate limit:** 5 requests per minute.

**Request body:**

| Field    | Type   | Required | Description   |
|----------|--------|----------|---------------|
| email    | string | Yes      | User email    |
| password | string | Yes      | User password |

**Success (200) — no 2FA:**

- Response body includes access token; refresh token is set in cookie (path `/api/v1/auth`).

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

- No cookies set. Frontend must collect TOTP code and call `POST /2fa/verify` with `session_token` = `data.twoFaToken`.

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

**Errors:** 400, 401 (invalid credentials), 403 (email not verified), 404 (not registered).

---

### POST `/refresh`

Issue a new access token using the refresh token cookie. No body. Must be called with credentials so the `refreshToken` cookie is sent.

**Rate limit:** 5 requests per minute.

**Success (200):**

- New access token in body; new refresh token set in cookie.

```json
{
  "status": "success",
  "data": {
    "userId": "uuid",
    "accessToken": "jwt...",
    "tokenType": "Bearer",
    "expiresIn": 900
  },
  "message": "Token refreshed successfully"
}
```

**Errors:** 401, 403 (invalid/missing refresh token).

---

### GET `/me`

Get current user info. Requires **Bearer** access token.

**Success (200):**

```json
{
  "status": "success",
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "isEmailVerified": true,
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  },
  "message": "..."
}
```

**Errors:** 401, 403, 404, 500.

---

### DELETE `/me`

Delete the current user. Requires **Bearer** access token.

**Success (200):**

```json
{
  "status": "success",
  "message": "..."
}
```

**Errors:** 401, 403, 404, 500.

---

### POST `/logout`

Invalidate session and clear refresh token cookie. Requires **Bearer** access token.

**Success (200):**

```json
{
  "status": "success",
  "message": "Logout successful"
}
```

**Errors:** 500.

---

### GET `/verify-email`

Verify email using token sent by email after registration.

**Query:**

| Name  | Type   | Required | Description      |
|-------|--------|----------|------------------|
| token | string | Yes      | Verification token |

**Success (200):**

```json
{
  "status": "success",
  "message": "..."
}
```

**Errors:** 400, 500.

**Rate limit:** 5 per minute.

---

## OAuth (GitHub)

### Starting OAuth

Redirect the user to:

```
GET {AUTH_SERVICE_URL}/api/v1/auth/oauth/github
```

User goes to GitHub, authorizes, and is redirected back to the **callback** URL configured on the server (e.g. `{AUTH_SERVICE_URL}/api/v1/auth/oauth/github/callback`). The callback is handled by the backend; it creates/links user and then typically redirects to the frontend (exact redirect is server-configured).

### GET `/oauth/github/callback`

Handled by the backend. Query params come from GitHub. On success, backend sets refresh token cookie and returns JSON (or redirects, depending on setup).

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
  "message": "..."
}
```

**Errors:** 400, 500, 502, 503.

---

## Two-factor authentication (2FA)

### POST `/2fa/setup`

Start 2FA setup. Returns a QR code data URL to scan in an authenticator app. Requires **Bearer** access token.

**Rate limit:** 5 per minute.

**Success (200):**

```json
{
  "status": "success",
  "data": {
    "userId": "uuid",
    "qrCodeDataURL": "data:image/png;base64,..."
  },
  "message": "..."
}
```

**Errors:** 400, 404, 500.

---

### POST `/2fa/confirm`

Confirm 2FA by sending a TOTP code from the app. Requires **Bearer** access token.

**Request body:**

| Field | Type   | Required | Description        |
|-------|--------|----------|--------------------|
| token | string | Yes      | 6-digit TOTP code  |

**Success (200):**

```json
{
  "status": "success",
  "data": { "userId": "uuid" },
  "message": "..."
}
```

**Errors:** 400, 404, 500.

---

### POST `/2fa/verify`

Complete login when 2FA is required. Use the `twoFaToken` from login (or OAuth callback) as `session_token`. No Bearer token.

**Request body:**

| Field         | Type   | Required | Description                                  |
|---------------|--------|----------|----------------------------------------------|
| token         | number | Yes      | 6-digit code from authenticator app          |
| session_token | string | Yes      | Value of `twoFaToken` from login response    |

**Success (200):**

- Access token in body; refresh token set in cookie (same as login).

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

**Errors:** 400, 404, 500.

---

### DELETE `/2fa/disable`

Turn off 2FA for the current user. Requires **Bearer** access token.

**Success (200):**

```json
{
  "status": "success",
  "message": "..."
}
```

**Errors:** 400, 404, 500.

---

## Password

### POST `/password/forgot`

Request a password reset. Sends email with reset link/token (if configured).

**Request body:**

| Field | Type   | Required | Description |
|-------|--------|----------|-------------|
| email | string | Yes      | User email   |

**Success (200):**

```json
{
  "status": "success",
  "message": "..."
}
```

**Errors:** 404, 500. Rate limit: 5 per minute.

---

### POST `/password/reset`

Reset password using token from forgot-password email.

**Request body:**

| Field    | Type   | Required | Description   |
|----------|--------|----------|---------------|
| token    | string | Yes      | Reset token   |
| password | string | Yes      | New password  |

**Success (200):**

```json
{
  "status": "success",
  "message": "..."
}
```

**Errors:** 400, 500. Rate limit: 5 per minute.

---

### PUT `/password/change`

Change password when already logged in. Requires **Bearer** access token.

**Request body:**

| Field        | Type   | Required | Description  |
|-------------|--------|----------|--------------|
| oldPassword | string | Yes      | Current pwd  |
| newPassword | string | Yes      | New password |

**Success (200):**

```json
{
  "status": "success",
  "message": "..."
}
```

**Errors:** 400, 401, 403, 404, 500. Rate limit: 5 per minute.

---

## Summary table

| Method | Path                     | Auth        | Purpose              |
|--------|--------------------------|------------|----------------------|
| POST   | `/register`              | —          | Register             |
| POST   | `/login`                  | —          | Login                |
| POST   | `/refresh`                | Cookie     | Refresh access token |
| GET    | `/me`                     | Bearer     | Current user         |
| DELETE | `/me`                     | Bearer     | Delete account       |
| POST   | `/logout`                 | Bearer     | Logout               |
| GET    | `/verify-email`           | Query token| Verify email         |
| GET    | `/oauth/github`           | —          | Start GitHub OAuth   |
| GET    | `/oauth/github/callback`  | —          | OAuth callback       |
| POST   | `/2fa/setup`              | Bearer     | Start 2FA setup      |
| POST   | `/2fa/confirm`            | Bearer     | Confirm 2FA          |
| POST   | `/2fa/verify`             | —          | Complete 2FA login    |
| DELETE | `/2fa/disable`           | Bearer     | Disable 2FA          |
| POST   | `/password/forgot`        | —          | Request reset        |
| POST   | `/password/reset`        | —          | Reset with token     |
| PUT    | `/password/change`       | Bearer     | Change password      |
