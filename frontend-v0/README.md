# Frontend

This folder contains the self-contained demo UI for the Steve_ZC / Woz_ZC flow.

## Contents

- `src/` React application code, styles, assets, and frontend-only API types
- `public/` static files served by Vite
- `package.json` frontend scripts
- `vite.config.ts` Vite config with `/api` proxy to the local agent API

## Local setup

```bash
cd frontend-v0
npm install
npm run dev
```

The frontend expects the demo API from `0G-agents` to be running at `http://localhost:8787`. The `/api` requests are proxied there by [frontend-v0/vite.config.ts](/Users/sebastien/000-MyData/330-Sandbox/AgentLevy/frontend-v0/vite.config.ts).

If the backend is not running, the UI will show `Demo API unavailable` on first load.

## Commands

```bash
npm run dev
npm run build
npm run lint
```
