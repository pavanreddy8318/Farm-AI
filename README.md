# FarmAI

Smart farming assistant for crop health monitoring.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in `.env` to your Gemini API key
3. Run the app:
   `npm run dev`

## Run with Docker

**Prerequisites:** Docker Desktop (or Docker Engine + Compose plugin)

The stack runs three containers: PostgreSQL 18 (+ pgvector), the FarmAI web app
(React + Express), and an optional Python FastAPI ML service.

1. Create `.env` from the example and set `GEMINI_API_KEY`:
   ```
   cp .env.example .env
   ```
2. Start the database and web app:
   ```
   docker compose up -d db web
   ```
   - App: http://localhost:3000
   - Postgres: localhost:5432 (db `farmai`, user/password from `.env`)
   - The schema (`db_schema.sql`) is applied automatically on first boot.

3. (Optional) Start the Python YOLOv8/FGCN inference service:
   ```
   docker compose --profile ai up -d
   ```
   Mount your trained `backend/models/best.pt` before starting. The service
   listens on http://localhost:8000.

4. Development mode with hot reload (mounts source, runs Vite):
   ```
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db web
   ```

Useful commands:
- View logs: `docker compose logs -f web`
- Stop: `docker compose down`
- Reset database: `docker compose down -v` (wipes the `pgdata` volume)

> Note: The Python image installs torch, torch-geometric, and ultralytics, so
> first build of the `ai` profile is large (several GB). The Node `web` image
> does not include Python.

## Deploy to Render

**Prerequisites:** a GitHub account and the repo already pushed to GitHub.

1. Push this repository to GitHub (Render deploys straight from the repo).
2. Go to https://render.com and sign in (GitHub OAuth is supported, no credit
   card needed on the free tier).
3. Click **New > Blueprint** and select the `Farm-AI` repository. Render reads
   [`render.yaml`](render.yaml), which provisions:
   - `farmai-web` — the Node/Express app (React UI + REST API)
   - `farmai-db` — managed PostgreSQL with the `pgvector` extension
4. On the first deploy the schema is applied automatically by
   `node scripts/init-db.js` (runs as the `preDeployCommand`).
5. Set the two environment variables in **Dashboard > farmai-web > Environment**:
   - `GEMINI_API_KEY` — your Gemini API key (https://aistudio.google.com/apikey)
   - `APP_URL` — your Render URL (e.g. `https://farmai-web.onrender.com`)
   - `JWT_SECRET` is auto-generated for you.
6. Redeploy (`Manual Deploy > Deploy latest commit`).

Free-tier notes:
- The free PostgreSQL instance expires after **30 days** (upgrade to `basic`
  to keep it).
- Free web services sleep after ~15 minutes of inactivity; the first request
  takes 30–60s to wake up.

Health check: `GET /api/health`.
