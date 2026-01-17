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
3. Run the app:
   `npm run dev`

### Settings API (required)

Settings are persisted in the database via the settings API. Start the API (`npm run server`) and set
`VITE_API_URL` (e.g. `http://localhost:3034/api/settings` or `/api/settings`). When using a relative URL, the dev
server proxies `/api` to `VITE_API_PROXY_TARGET` (default: `http://localhost:3034`). This uses the SQLite-backed
`settings.db` by default (override with `DB_FILE`). 
