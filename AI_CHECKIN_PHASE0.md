# AI Check-in Phase 0 Audit (Backend - fitbharat)

Date: 2026-02-24

## Current env/secrets usage audit

### Files reviewed
- `.env` (tracked locally; currently contains `JWT_SECRET`)
- `src/index.ts`
- `src/controllers/authController.ts`
- `src/middlewares/authMiddleware.ts`
- `src/routes/chat.route.ts`

### Current environment variables in use
- `JWT_SECRET` (token signing/verification)
- `MONGO_URI` (Mongo connection)
- `PORT` (server port)
- `NODE_ENV` (cookie security behavior)

### Observed risks (pre-existing)
- `.env` exists with a real `JWT_SECRET` value; rotate if shared.
- No AI-specific env variables yet (added as template in this phase).
- CORS is currently broad (`origin: '*'`) in `src/index.ts`.

## Phase 0 additions for AI Check-in
- Added API skeleton routes only (no model/provider integration).
- Added schema contract at `src/ai/schema.ts`.
- Added env template placeholders in `.env.example` (AI-only keys).

## Next-phase guidance
- Add multipart parser (`multer` or equivalent) when real upload processing begins.
- Persist check-ins to DB (current placeholder store is in-memory).
- Add request auth/rate-limit for AI check-in routes before production use.
