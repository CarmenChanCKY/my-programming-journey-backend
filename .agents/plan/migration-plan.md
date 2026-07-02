# Migration: SuperTokens → Better Auth

## Overview
Switch from SuperTokens (cloud, EmailPassword, header-based sessions) to Better Auth (self-hosted, MySQL, email/password, cookie-based sessions) for a hobby blog CMS backend.

**Project:** Express v5 + TypeScript + MySQL (mysql2/promise)
**CMS Frontend:** React (localhost:5173) — handled separately
**API Path:** `/token-admin` (matching current path)

---

## Phase 1 — Install & Configure

### 1. Install Better Auth & remove SuperTokens
```bash
npm uninstall supertokens-node
npm install better-auth
```

### 2. Add `timezone: "Z"` to mysql2 pool
In `config/database/connect.ts`, add `timezone: "Z"` to `createPool()` options.

### 3. Create `src/middleware/auth/auth.ts`
Better Auth server config with:
- `database`: reuse existing `dbPool`
- `basePath: "/token-admin"`
- `baseURL`: from `BETTER_AUTH_URL` env var
- `emailAndPassword`: `{ enabled: true, disableSignUp: true }`
  - Start with `false`, create admin account, then flip to `true`
- `trustedOrigins`: `[CMS_PATH, FRONTEND_PATH]`
- Rate limiting: enable Better Auth's built-in limiter (applies per-endpoint defaults like 3 req/10s on sign-in). Keep existing `express-rate-limit` for blog routes — they complement each other, no overlap.
- Session: 7-day expiry, 24h update age, cookie cache with JWE strategy
- `advanced.useSecureCookies: true` in production
- Skip `sendResetPassword`
- Skip email verification
- Export `type Session = typeof auth.$Infer.Session`

---

## Phase 2 — Wire into Express

### 4. Update `src/index.ts`
Replace SuperTokens wiring:
```ts
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth } from "@/middleware/auth/auth";
```
- Remove SuperTokens imports (`middleware`, `errorHandler`, `verifySession`)
- Remove `initTokens()` call
- Remove `supertokens.getAllCORSHeaders()` from CORS
- Remove `app.use(middleware())`
- Remove `app.use(errorHandler())`

Add Better Auth handler:
```ts
app.all("/token-admin/*splat", toNodeHandler(auth));  // Express v5 syntax
```
Place BEFORE `express.json()`.

### 5. Create `src/middleware/auth/require_auth.ts`
Middleware using `fromNodeHeaders` + `auth.api.getSession`:
```ts
export const requireAuth = async (req, res, next) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session) return res.status(401).json({ error: "Unauthorized" });
  (req as any).user = session.user;
  next();
};
```

### 6. Replace `verifySession()` with `requireAuth`
In `src/index.ts`, on all CMS routes:
```ts
// Before:
app.use("/cms/tags", cmsRateLimitMiddleware, verifySession(), cmsTagsRouter);
// After:
app.use("/cms/tags", cmsRateLimitMiddleware, requireAuth, cmsTagsRouter);
```

### 7. Update CMS route handlers
Files: `src/routes/cms/post.ts`, `categories.ts`, `tags.ts`, `upload.ts`
- Remove `import { SessionRequest }`
- Add a local type or cast: `(req as any).user`
- Access `req.user` instead of `req.session`

### 8. Simplify CORS
```ts
// Remove ...supertokens.getAllCORSHeaders()
app.use(cors({ origin: allowedOrigins, credentials: true }));
```

---

## Phase 3 — Environment & Database

### 9. Update `.env` files
```env
# Add
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3100

# Remove
AUTH_API_DOMAIN=
AUTH_WEB_DOMAIN=
API_BASE_PATH=
CORE_CONNECTION_URL=
CORE_API_KEY=
ADMIN_EMAIL=
```

### 10. Run migration
```bash
npx auth@latest migrate
```
Creates `user`, `session`, `account`, `verification` tables.

### 11. Create admin account
One-time script (run with `disableSignUp: false` in config):
```ts
// scripts/create-admin.ts
import { auth } from "../src/middleware/auth/auth";
await auth.api.signUpEmail({
  body: { email: "your@email.com", password: "your-password", name: "Admin" }
});
```
After successful creation, set `disableSignUp: true`.

---

## Phase 4 — Cleanup

### 12. Delete old files
- `src/middleware/security-tokens/` (entire directory)
- Remove `supertokens-node` imports from all CMS route files

### 13. Verify
- `GET /token-admin/ok` → `{ status: "ok" }`
- `POST /token-admin/sign-in/email` → session created
- CMS routes → 401 without session, 200 with valid session

---

## Security Checklist

| Item | Status |
|------|--------|
| `BETTER_AUTH_SECRET` (32+ chars, `openssl rand -base64 32`) | ✅ Generate & set |
| `trustedOrigins` with CMS + frontend URLs | ✅ Add to config |
| CSRF protection: `disableCSRFCheck: false` (default) | ✅ Keep default |
| Secure cookies: `useSecureCookies: true` in production | ✅ Add to config |
| Better Auth rate limiter (sign-in brute force protection) | ✅ Enable |
| Existing `express-rate-limit` (blog + CMS CRUD routes) | ✅ Keep as-is |
| Sign-up disabled after first account | ✅ `disableSignUp: true` |
| Cookie-based session — frontend needs `credentials: 'include'` | ⚠️ Update frontend fetch calls |
