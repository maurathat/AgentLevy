# AgentLevy — Frontend

React + Vite dashboard for the AgentLevy protocol demo.

## Setup

```bash
cd frontend
npm install
```

## Run

```bash
npm run dev
```

Opens at http://localhost:5173

## Pages

| Tab | Description |
|-----|-------------|
| **Demo** | Live walkthrough of Publisher Agent ↔ Worker Agent communication — step-by-step flow with payloads |
| **Slides** | Presentation slides (placeholder) |
| **ERC Draft** | ERC-VTEAI standard draft (placeholder) |

## Build

```bash
npm run build   # outputs to dist/
npm run preview # serve the production build locally
```

## Environment

Create a `.env` file if you want the Treasury Dashboard (in `App.jsx`) to read live on-chain data:

```
VITE_TREASURY_ADDRESS=0x...
```
