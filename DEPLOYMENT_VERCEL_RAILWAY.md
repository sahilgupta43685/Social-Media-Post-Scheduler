# Deploy Guide (Vercel + Railway)

## 1) Deploy Backend API on Railway

1. Create a new Railway project from your GitHub repo.
2. Open the service settings and set **Root Directory** to `backend`.
3. Keep build as auto (Nixpacks), or use project `backend/railway.json`.
4. Set required variables from `backend/.env.example`.
5. Click Deploy.

### Required backend variables (minimum)
- `MONGO_URI`
- `JWT_SECRET`
- `REDIS_URL`
- `FRONTEND_URL` (or `FRONTEND_URLS`)
- `TOKEN_ENCRYPTION_KEY` or `TOKEN_ENCRYPTION_KEYS`

### Health check
- `https://<your-railway-domain>/api/health`

---

## 2) Deploy Frontend on Vercel

1. Create a new Vercel project from the same GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Add environment variable:
   - `VITE_API_BASE_URL=https://<your-railway-domain>/api`
4. Deploy.

---

## 3) Connect Frontend ↔ Backend

After Vercel deploy, copy the exact frontend domain:
- Example: `https://social-media-post-scheduler.vercel.app`

Set in Railway:
- `FRONTEND_URL=https://social-media-post-scheduler.vercel.app`

If you use Vercel preview deployments too, set:
- `FRONTEND_URLS=https://social-media-post-scheduler.vercel.app,https://social-media-post-scheduler-git-main-<team>.vercel.app`

Redeploy Railway after updating variables.

---

## 4) Deploy Worker on Railway (required for scheduled publishing)

Create a second Railway service from the same repo:
1. Root Directory: `backend`
2. Start command: `npm run worker`
3. Same variables as API service

Without this worker service, scheduled posts will stay pending.

---

## 5) Most Common Errors

1. **CORS blocked**
- Cause: wrong/missing `FRONTEND_URL` or `FRONTEND_URLS`
- Fix: set exact Vercel origin and redeploy backend

2. **App crashes at startup**
- Cause: missing required env vars
- Fix: check Railway logs for `Server boot failed: Missing required environment variable: ...`

3. **Frontend calls localhost in production**
- Cause: missing `VITE_API_BASE_URL`
- Fix: set it in Vercel project env and redeploy

4. **Posts not auto-publishing**
- Cause: worker service not deployed/running
- Fix: deploy worker service with `npm run worker`

5. **OAuth callback errors**
- Cause: redirect URL mismatch between provider dashboard and backend env
- Fix: make callback URLs exactly match deployed backend URLs

---

## 6) Post-Deploy Test Checklist

1. Open frontend URL.
2. Register/login.
3. Create, edit, delete post.
4. Schedule post for +1 minute.
5. Confirm status changes from `pending` to `posted`.
6. Connect one social provider and verify callback.
