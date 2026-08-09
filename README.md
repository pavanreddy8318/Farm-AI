<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8a1afd66-9291-47af-936e-f9fb0d955a4f

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
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
