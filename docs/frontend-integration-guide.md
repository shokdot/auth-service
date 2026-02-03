# Frontend Integration Guide — Auth Service

This guide explains how a **React/Next.js** frontend should integrate with the Auth Service: flows, what requests to make, how to handle tokens and cookies, and recommended patterns.

---

## Base URL and CORS

- **Base URL**: `{AUTH_SERVICE_URL}/api/v1/auth` (e.g. `http://localhost:3000/api/v1/auth`).
- **CORS**: Configure the auth service to allow your frontend origin. For cookie-based refresh, use **same-site** or ensure credentials are sent (see below).
- **Credentials**: For `POST /refresh` and any request that must send the refresh cookie, use **`credentials: 'include'`** (fetch) or **`withCredentials: true`** (axios).

---

## Token and cookie overview

| Item           | Where it lives        | How frontend uses it |
|----------------|-----------------------|------------------------|
| Access token   | In memory / state     | Send as `Authorization: Bearer <token>` on every authenticated request. |
| Refresh token  | HttpOnly cookie       | Not readable by JS. Sent automatically when calling the refresh endpoint with credentials. |
| twoFaToken     | In memory (temporary) | When login returns 2FA pending, store it and send as `session_token` in `POST /2fa/verify`. |

**Important:**

- **Access token**: Store in memory (React state/context) or a non-http cookie if you need persistence; avoid `localStorage` if you want to reduce XSS impact.
- **Refresh token**: Never read by frontend; browser sends it only to the auth service refresh URL (path `/refresh`).
- **expiresIn**: Response says `900` (15 minutes). Refresh before expiry or on 401.

---

## Recommended flow overview

1. **Login** (or OAuth callback / 2FA verify) → receive **access token** in JSON; **refresh token** in cookie.
2. **Authenticated requests** → send **Bearer** access token in `Authorization` header.
3. **On 401** or before expiry → call **POST /refresh** with credentials → get new access token (and new refresh cookie).
4. **Logout** → call **POST /logout** with Bearer token, then clear local access token and redirect.

---

## 1. Register

**Purpose:** Create account (email + password). User must verify email before they can log in.

**Flow:**

1. User submits: `email`, `username`, `password`.
2. Frontend: `POST /api/v1/auth/register` with JSON body.
3. On 201: show “Check your email to verify” and redirect to login or verification-sent page.
4. User clicks link in email → link goes to **GET /api/v1/auth/verify-email?token=...**.  
   - Either: link points directly at auth service (then backend returns HTML/redirect to your app).  
   - Or: link points to your app, and your app does `GET /api/v1/auth/verify-email?token=...` (e.g. in `getServerSideProps` or a route handler) and then shows success/error.

**Request example:**

```ts
const res = await fetch(`${AUTH_BASE}/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, username, password }),
});
```

---

## 2. Login (email / password)

**Purpose:** Authenticate user and get access + refresh tokens (or 2FA pending).

**Flow:**

1. User submits: `email`, `password`.
2. Frontend: `POST /api/v1/auth/login` with **credentials** (so future refresh cookie is stored).
3. Check `response.status` and `data.status`:
   - **status === 'success'**:  
     - Save `data.accessToken` (and optionally `data.expiresIn`).  
     - Cookie `refreshToken` is set by server (path `/refresh`).  
     - Redirect to app (e.g. dashboard).
   - **status === 'pending'** (2FA):  
     - Save `data.userId` and **`data.twoFaToken`** (this is the `session_token` for 2FA verify).  
     - Show 2FA code input; on submit call **POST /2fa/verify** (see below).

**Request example:**

```ts
const res = await fetch(`${AUTH_BASE}/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email, password }),
});
const json = await res.json();
if (json.status === 'success') {
  setAccessToken(json.data.accessToken);
  setExpiresAt(Date.now() + json.data.expiresIn * 1000);
  router.push('/dashboard');
} else if (json.status === 'pending') {
  setTwoFaToken(json.data.twoFaToken);
  setUserId(json.data.userId);
  setStep('2fa');
}
```

---

## 3. Refresh token

**Purpose:** Get a new access token when the current one is expired or when the app loads and you only have a refresh cookie.

**When to call:**

- On app load (e.g. in a root layout or auth provider) if you have no access token in memory but the user might have a refresh cookie.
- After receiving **401** on any authenticated request (then retry the request with the new token).
- Optionally: before access token expiry (e.g. when `expiresIn` is 15 min, refresh at ~12 min).

**Flow:**

1. Frontend: `POST /api/v1/auth/refresh` with **no body**, **credentials: 'include'**.
2. On 200: replace stored access token with `data.accessToken`, update `expiresIn` if you store expiry.
3. On 401/403: treat as “logged out” — clear token, redirect to login.

**Request example:**

```ts
const res = await fetch(`${AUTH_BASE}/refresh`, {
  method: 'POST',
  credentials: 'include',
});
if (!res.ok) {
  clearAccessToken();
  redirectToLogin();
  return;
}
const json = await res.json();
setAccessToken(json.data.accessToken);
```

**Important:** The refresh cookie is only sent to the **auth service** URL (and only for path `/refresh`). So this request must go to the auth service origin (same origin or configured CORS with credentials).

---

## 4. Authenticated requests

**Purpose:** Call protected endpoints (auth service `/me`, `/logout`, `/password/change`, `/2fa/*`, or other microservices).

**Flow:**

- Add header: `Authorization: Bearer <accessToken>`.
- If you get **401**, try once: call refresh, then retry with the new token. If refresh fails, clear token and redirect to login.

**Example (fetch):**

```ts
const res = await fetch(`${AUTH_BASE}/me`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
if (res.status === 401) {
  const newToken = await refreshAccessToken();
  if (newToken) return fetch(`${AUTH_BASE}/me`, { headers: { Authorization: `Bearer ${newToken}` } });
  redirectToLogin();
}
```

---

## 5. Logout

**Purpose:** Invalidate session and clear refresh cookie.

**Flow:**

1. Call `POST /api/v1/auth/logout` with **Bearer** access token and **credentials: 'include'**.
2. Clear access token from memory/state.
3. Redirect to login page.

**Request example:**

```ts
await fetch(`${AUTH_BASE}/logout`, {
  method: 'POST',
  credentials: 'include',
  headers: { Authorization: `Bearer ${accessToken}` },
});
clearAccessToken();
router.push('/login');
```

---

## 6. OAuth (GitHub)

**Purpose:** Let user sign in (or register) with GitHub.

**Flow:**

1. Frontend: redirect user to  
   `GET {AUTH_BASE}/oauth/github`  
   (full URL, e.g. `http://localhost:3000/api/v1/auth/oauth/github`).
2. User authorizes on GitHub; GitHub redirects to auth service callback (`/api/v1/auth/oauth/github/callback`). Backend handles callback and usually redirects to your **frontend** with success (and maybe tokens in query/fragment) or error. Exact redirect URL is configured on the backend.
3. On the frontend page that handles this redirect (e.g. `/auth/callback`):
   - If backend redirected with tokens in URL, read them and store access token.
   - If backend set cookies and redirected, frontend can call **GET /me** or **POST /refresh** with credentials to confirm session and get access token.
   - If backend returns **pending** (2FA), show 2FA form and use `twoFaToken` in **POST /2fa/verify** as below.

**Frontend (start OAuth):**

```ts
window.location.href = `${AUTH_BASE}/oauth/github`;
```

---

## 7. Two-factor authentication (2FA)

### 7.1 Completing login (2FA verify)

**Purpose:** After login (or OAuth) returned `status: 'pending'` and `twoFaToken`, complete sign-in by sending TOTP code.

**Flow:**

1. User enters 6-digit code from authenticator app.
2. Frontend: `POST /api/v1/auth/2fa/verify` with body:  
   `{ "token": 123456, "session_token": "<twoFaToken from login>" }`.  
   Use the **exact** `twoFaToken` from the login response (named `twoFaToken` in API, sent as `session_token` in this request).
3. On 200: same as login success — store `data.accessToken`; refresh cookie is set. Redirect to app.

**Request example:**

```ts
const res = await fetch(`${AUTH_BASE}/2fa/verify`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ token: parseInt(code, 10), session_token: twoFaToken }),
});
```

### 7.2 Enabling 2FA (setup + confirm)

**Purpose:** User turns on 2FA from settings (authenticated).

**Flow:**

1. **Setup:**  
   `POST /api/v1/auth/2fa/setup` with **Bearer** access token.  
   Response: `data.qrCodeDataURL` (image). Show QR so user can scan with Google Authenticator (or similar).
2. User scans QR and gets first code.  
   **Confirm:**  
   `POST /api/v1/auth/2fa/confirm` with **Bearer** and body `{ "token": "123456" }`.  
   On success, 2FA is enabled for the account.

### 7.3 Disabling 2FA

**Purpose:** User turns off 2FA (authenticated).

**Flow:**  
`DELETE /api/v1/auth/2fa/disable` with **Bearer** access token. No body.

---

## 8. Password flows

### Forgot password

1. User enters email.  
2. `POST /api/v1/auth/password/forgot` with `{ "email": "..." }`.  
3. Show “If an account exists, we sent a reset link.” (Do not reveal whether email exists.)

### Reset password (from email link)

1. User lands on your page with token in URL (e.g. from email link).  
2. User enters new password.  
3. `POST /api/v1/auth/password/reset` with `{ "token": "<from URL>", "password": "..." }`.  
4. On success, redirect to login.

### Change password (logged in)

1. User enters current password and new password.  
2. `POST /api/v1/auth/password/change` with **Bearer** and body:  
   `{ "oldPassword": "...", "newPassword": "..." }`.  
   (API uses `oldPassword` / `newPassword`; confirm in [api-endpoints](api-endpoints.md).)

---

## 9. React/Next.js integration tips

### Central auth state

- Use **React Context** or state management (Zustand, etc.) to hold:
  - `accessToken`
  - Optional: `userId`, `expiresAt`
- On app init (e.g. `_app.tsx` or root layout), call **POST /refresh** with credentials. If 200, set access token and “logged in”. If not, leave user as guest.

### Axios/fetch interceptor

- **Request:** Add `Authorization: Bearer ${accessToken}` when token exists.
- **Response:** On 401, call refresh, retry once with new token; if refresh fails, clear token and redirect to login.

### Next.js (App Router)

- **Server components:** Cannot send cookies to another origin easily. Prefer calling auth from **Client Components** or **Route Handlers** that run on server and proxy to auth service with cookies from the incoming request.
- **Route Handler** (e.g. `app/auth/refresh/route.ts`): Forward `POST` to auth service with `credentials` and forward `Cookie` header from request, then return the response; frontend can call this route instead of auth service directly if you need same-origin cookies.

### Cookie domain

- If frontend and auth service are on different origins (e.g. `app.example.com` vs `auth.example.com`), refresh cookie must be set with a **domain** the frontend can send (e.g. `.example.com`). Backend must set that; frontend just uses `credentials: 'include'` when calling the auth service (or your proxy).

---

## 10. Quick reference: what to do when

| User action / Event     | Request to make                                      | Then |
|-------------------------|--------------------------------------------------------|------|
| Register                | `POST /register`                                      | Show “verify email” |
| Open verify-email link  | `GET /verify-email?token=...` (or backend handles link)| Show success / error |
| Login                   | `POST /login` (credentials: include)                   | Store access token or show 2FA |
| Login with 2FA          | `POST /2fa/verify` (session_token + token)             | Store access token |
| Load app (check session)| `POST /refresh` (credentials: include)                 | Set or clear access token |
| Any protected API       | Header `Authorization: Bearer <accessToken>`          | On 401 → refresh then retry |
| Logout                  | `POST /logout` (Bearer + credentials)                 | Clear token, redirect to login |
| Start GitHub login      | Redirect to `GET /oauth/github`                        | Backend redirects back to app |
| Enable 2FA              | `POST /2fa/setup` then `POST /2fa/confirm` (Bearer)    | Show QR then confirm code |
| Disable 2FA             | `DELETE /2fa/disable` (Bearer)                         | Show success |
| Forgot password        | `POST /password/forgot`                                | Show “check email” |
| Reset password          | `POST /password/reset` (token + password)              | Redirect to login |
| Change password         | `PUT /password/change` (Bearer + old/new)              | Show success |

Using this guide together with [API Endpoints](api-endpoints.md) you have everything needed to integrate the React/Next.js frontend with the Auth Service.
