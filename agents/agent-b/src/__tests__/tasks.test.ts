import { TASKS } from "../tasks"

describe("TASKS registry", () => {
  describe("product_scrape", () => {
    const task = TASKS["product_scrape"]

    test("is defined", () => {
      expect(task).toBeDefined()
    })

    test("buildSpec() returns a valid TaskSpec shape", () => {
      const spec = task.buildSpec()

      expect(typeof spec.id).toBe("string")
      expect(spec.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
      expect(typeof spec.description).toBe("string")
      expect(spec.verification.type).toBe("json_schema")
      expect(spec.payment.token).toBe("USDC")
      expect(spec.payment.amount).toBe("0.05")
      expect(spec.payment.timeoutSeconds).toBe(300)
      expect(typeof spec.postedAt).toBe("number")
    })

    test("buildSpec() accepts payment overrides", () => {
      const spec = task.buildSpec({ amount: "0.10", timeoutSeconds: 600 })
      expect(spec.payment.amount).toBe("0.10")
      expect(spec.payment.timeoutSeconds).toBe(600)
    })

    test("buildSpec() generates a unique id each call", () => {
      const id1 = task.buildSpec().id
      const id2 = task.buildSpec().id
      expect(id1).not.toBe(id2)
    })

    test("execute() returns an array of 10 products", async () => {
      const result = await task.execute() as any[]
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(10)
    })

    test("each product has required fields with correct types", async () => {
      const result = await task.execute() as any[]
      for (const item of result) {
        expect(typeof item.product_id).toBe("string")
        expect(item.product_id.length).toBeGreaterThan(0)
        expect(typeof item.name).toBe("string")
        expect(typeof item.price).toBe("number")
        expect(item.price).toBeGreaterThanOrEqual(0)
        expect(typeof item.url).toBe("string")
        expect(item.url).toMatch(/^https?:\/\//)
      }
    })

    test("verification type matches task definition", () => {
      expect(task.verificationType).toBe("json_schema")
    })
  })
})