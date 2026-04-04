import "dotenv/config";

import { createServer } from "node:http";

import type { InferenceRequest, MarketplaceRunRequest } from "../shared/demo.js";
import { ZeroClawDemoService } from "./zeroClawDemo.js";

const service = new ZeroClawDemoService();
const port = Number.parseInt(process.env.ZEROCLAW_API_PORT || "8787", 10);

function sendJson(res: import("node:http").ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
}

async function readJsonBody<T>(req: import("node:http").IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {} as T;
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
}

const server = createServer(async (req, res) => {
  try {
    if (!req.url || !req.method) {
      sendJson(res, 400, { error: "Invalid request." });
      return;
    }

    if (req.method === "OPTIONS") {
      sendJson(res, 204, {});
      return;
    }

    if (req.method === "GET" && req.url === "/") {
      sendJson(res, 200, {
        name: "ZeroClaw demo API",
        status: "ok",
        frontendUrl: "http://localhost:5173",
        endpoints: [
          "GET /api/status",
          "GET /health",
          "POST /api/inference/steve",
          "POST /api/inference/woz",
          "POST /api/marketplace/run",
        ],
      });
      return;
    }

    if (req.method === "GET" && req.url === "/health") {
      sendJson(res, 200, { status: "ok" });
      return;
    }

    if (req.method === "GET" && req.url === "/api/status") {
      sendJson(res, 200, await service.getDashboardSnapshot());
      return;
    }

    if (req.method === "POST" && req.url === "/api/inference/steve") {
      const body = await readJsonBody<InferenceRequest>(req);
      sendJson(res, 200, await service.triggerInference(body.prompt));
      return;
    }

    if (req.method === "POST" && req.url === "/api/inference/woz") {
      const body = await readJsonBody<InferenceRequest>(req);
      sendJson(res, 200, await service.triggerInferenceForAgent("Woz_ZC", body.prompt));
      return;
    }

    if (req.method === "POST" && req.url === "/api/marketplace/run") {
      const body = await readJsonBody<MarketplaceRunRequest>(req);
      sendJson(res, 200, await service.runMarketplaceDemo(body));
      return;
    }

    sendJson(res, 404, { error: "Not found." });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(port, () => {
  console.log(`ZeroClaw demo API listening on http://localhost:${port}`);
});
