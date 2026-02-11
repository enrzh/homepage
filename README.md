<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1yVf9yDcsF1ct2xEkpnkReSOezKv2St1Y

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app (starts both the Vite dev server and settings API):
   `npm run dev`

### Settings API (required)

Settings are persisted in the database via the settings API. The default `npm run dev` script starts
the API (`npm run server`) alongside the Vite dev server. If you only want the frontend, use
`npm run dev:client` and set `VITE_API_URL` (e.g. `http://localhost:3034/api/settings`). If not set,
the app defaults to `/api/settings` so the Vite dev server proxy is used. The dev server proxies
`/api` to `VITE_API_PROXY_TARGET` (default: `http://localhost:3034`). This uses the SQLite-backed
`settings.db` by default (override with `DB_FILE`).

## Docker Persistence (public-safe)

Use the included `docker-compose.yaml` for persistent settings data:

1. Build and run:
   `docker compose up -d --build`
2. Settings are stored at `/data/settings.db` inside the container using the named volume `homepage_data`.
3. App restarts run a fresh frontend build on startup, but database content is preserved by the volume.

Notes:
- Do not commit runtime database files to the repository.
- Keep secrets (for example `GEMINI_API_KEY`) in local env files only.
