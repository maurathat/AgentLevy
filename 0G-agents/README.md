# Agents

This folder contains the self-contained 0G runtime and agent-side code for the Steve_ZC / Woz_ZC demo.

## Contents

- `src/server/` local demo API for Steve_ZC and Woz_ZC
- `src/scripts/` helper scripts such as Keychain-backed 0G CLI login
- `src/bot/` Discord bot and command handlers
- `src/services/` 0G, wallet, Keychain, reputation, and payment services
- `src/shared/` shared runtime-side data models
- `.env` runtime configuration
- `.env.example` starter config for local setup

## Local setup

```bash
cd 0G-agents
npm install
cp .env.example .env
npm run demo:doctor
```

`Steve_ZC` must already exist in macOS Keychain before the marketplace demo can run. Add it with:

```bash
security add-generic-password -a "zeroclaw" -s "Steve_ZC_PRIVATE_KEY" -w "<PRIVATE_KEY>" -U
```

The runtime reads Steve_ZC and Woz_ZC directly from macOS Keychain. Private keys are not expected in `.env`, and you should not store them on disk there.

If your team uses a different key name, Keychain account, or agent addresses, update `.env` accordingly.

If you want Woz_ZC to have a stable identity instead of being auto-generated on first run, add it to Keychain too:

```bash
security add-generic-password -a "zeroclaw" -s "Woz_ZC_PRIVATE_KEY" -w "<PRIVATE_KEY>" -U
```

The marketplace flow works in `dry-run` mode by default. Live 0G inference is optional and requires:

- `ZEROCLAW_INFERENCE_URL`
- `ZEROCLAW_INFERENCE_MODEL`
- `ZEROCLAW_INFERENCE_API_KEY`

For separate agent identities on the compute layer, prefer:

- `ZEROCLAW_STEVE_ZC_INFERENCE_URL`
- `ZEROCLAW_STEVE_ZC_INFERENCE_MODEL`
- `ZEROCLAW_STEVE_ZC_INFERENCE_API_KEY`
- `ZEROCLAW_WOZ_ZC_INFERENCE_URL`
- `ZEROCLAW_WOZ_ZC_INFERENCE_MODEL`
- `ZEROCLAW_WOZ_ZC_INFERENCE_API_KEY`

The shared `ZEROCLAW_INFERENCE_*` variables are still supported as a fallback, but per-agent variables are better when Steve_ZC and Woz_ZC should authenticate separately.

If inference is not configured, the deterministic marketplace run still works, but the inference panels will show the missing configuration instead of a live model response.

## Commands

```bash
npm run demo:doctor
npm run demo:server
npm run 0g:login
npm run bot
npm run build
npm run lint
```

## Discord testing

If `DISCORD_TOKEN` and `DISCORD_OWNER_ID` are configured, start the bot with:

```bash
npm run bot
```

Then in Discord use:

- `/setup` to create the private ZeroClaw channels
- `/chat-steve prompt:...` to send a prompt to Steve_ZC
- `/chat-woz prompt:...` to send a prompt to Woz_ZC

## Demo API

The demo server listens on `http://localhost:8787` by default and exposes:

- `GET /api/status`
- `POST /api/inference/steve`
- `POST /api/inference/woz`
- `POST /api/marketplace/run`
