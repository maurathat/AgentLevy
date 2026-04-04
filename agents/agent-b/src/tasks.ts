import { TaskSpec, VerificationType } from "../../shared/types"
import { v4 as uuidv4 } from "uuid"

// ─── Task definitions Agent B knows how to execute ───────────────────────────
// Each entry defines what B can do and how its result will be verified.

export interface TaskDefinition {
  name: string
  description: string
  verificationType: VerificationType
  // Returns the task spec Agent A will post on-chain
  buildSpec(overrides?: Partial<TaskSpec["payment"]>): TaskSpec
  // The actual execution logic (runs in worker.ts)
  execute(): Promise<unknown>
}

export const TASKS: Record<string, TaskDefinition> = {
  // ── Example: product listing scrape ─────────────────────────────────────
  product_scrape: {
    name: "product_scrape",
    description: "Deliver 10 mock product listings as JSON",
    verificationType: "json_schema",

    buildSpec(overrides = {}): TaskSpec {
      return {
        id: uuidv4(),
        description: "Deliver 10 product listings with id, name, price, url",
        verification: {
          type: "json_schema",
          criteria: {
            schema: {
              type: "array",
              minItems: 10,
              items: {
                type: "object",
                required: ["product_id", "name", "price", "url"],
                properties: {
                  product_id: { type: "string", minLength: 1 },
                  name:       { type: "string", minLength: 1 },
                  price:      { type: "number", minimum: 0 },
                  url:        { type: "string", format: "uri" },
                },
              },
            },
          },
        },
        payment: {
          amount: overrides.amount ?? "0.05",
          token: "USDC",
          timeoutSeconds: overrides.timeoutSeconds ?? 300,
        },
        postedAt: Date.now(),
        posterAddress: "", // filled by Agent A before posting
      }
    },

    async execute() {
      // Phase 1: return mock data
      // Phase 3: replace with real scraping logic
      return Array.from({ length: 10 }, (_, i) => ({
        product_id: `prod-${i + 1}`,
        name: `Product ${i + 1}`,
        price: parseFloat((Math.random() * 100).toFixed(2)),
        url: `https://example.com/products/${i + 1}`,
      }))
    },
  },
}
