# RUNBOOK: AI Check-in

## 1) Backend setup (fitbharat)

1. Install dependencies:
   - `npm install`
2. Configure env in `.env`:
   - `PORT=3000`
   - `MONGO_URI=<your mongo uri>`
   - `JWT_SECRET=<your jwt secret>`
   - `CORS_ALLOWED_ORIGINS=http://localhost:8081,http://localhost:3000`
   - `AI_CHECKIN_PROVIDER=openai` (or keep fallback behavior by omitting key)
   - `AI_CHECKIN_MODEL=gpt-4.1-mini`
   - `AI_CHECKIN_MAX_UPLOAD_MB=10`
   - `OPENAI_API_KEY=<optional for real analysis>`
3. Run server:
   - `npm run dev`

## 2) App setup (fitbharatapp)

Configure `.env`:
- `EXPO_PUBLIC_AI_CHECKIN_ENABLED=true`
- `EXPO_PUBLIC_AI_CHECKIN_API_BASE_URL=http://localhost:3000`
- `EXPO_PUBLIC_AI_CHECKIN_UPLOAD_PATH=/api/ai-checkin/upload`
- `EXPO_PUBLIC_AI_CHECKIN_STATUS_PATH=/api/ai-checkin`

Run app:
- `npm start`

## 3) API contract

### Upload photo
- `POST /api/ai-checkin/upload`
- `multipart/form-data`
- field: `image` (jpg/png/webp)
- required fields:
  - `consentAccepted=true`
  - `disclaimerAccepted=true`

Response:
```json
{ "checkinId": "...", "status": "queued", "message": "Upload accepted and queued for analysis." }
```

### Get status/result
- `GET /api/ai-checkin/:id`

Returns queued/processing/completed/failed plus result/recommendations/error.

## 4) Testing quick commands

Upload:
```bash
curl -X POST http://localhost:3000/api/ai-checkin/upload \
  -F "image=@/absolute/path/photo.jpg" \
  -F "consentAccepted=true" \
  -F "disclaimerAccepted=true"
```

Status:
```bash
curl http://localhost:3000/api/ai-checkin/<checkinId>
```

## 5) Operational notes

- Rate limit: 10 upload requests / 15 minutes / IP.
- CORS is controlled by `CORS_ALLOWED_ORIGINS`.
- Uploads are stored at `uploads/ai-checkins/`.
- Without `OPENAI_API_KEY`, service stores upload and returns fallback analysis text.
- This feature provides wellness guidance and is not a medical diagnosis system.
