import request from "supertest"
import app from "../server"

describe("Agent B HTTP server", () => {
  describe("GET /health", () => {
    test("returns 200 with agent B status", async () => {
      const res = await request(app).get("/health")
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ status: "ok", agent: "B", phase: 1 })
    })
  })

  describe("GET /tasks", () => {
    test("returns 200 with a tasks array", async () => {
      const res = await request(app).get("/tasks")
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.tasks)).toBe(true)
      expect(res.body.tasks.length).toBeGreaterThan(0)
    })

    test("each task entry has name, description, verificationType, spec", async () => {
      const res = await request(app).get("/tasks")
      for (const task of res.body.tasks) {
        expect(typeof task.name).toBe("string")
        expect(typeof task.description).toBe("string")
        expect(typeof task.verificationType).toBe("string")
        expect(task.spec).toBeDefined()
      }
    })

    test("product_scrape is listed", async () => {
      const res = await request(app).get("/tasks")
      const names = res.body.tasks.map((t: any) => t.name)
      expect(names).toContain("product_scrape")
    })
  })

  describe("GET /tasks/:name/spec", () => {
    test("returns spec for a valid task", async () => {
      const res = await request(app).get("/tasks/product_scrape/spec")
      expect(res.status).toBe(200)
      expect(res.body.spec).toBeDefined()
      expect(res.body.spec.verification.type).toBe("json_schema")
      expect(res.body.spec.payment.token).toBe("USDC")
    })

    test("returns 404 for unknown task", async () => {
      const res = await request(app).get("/tasks/nonexistent/spec")
      expect(res.status).toBe(404)
      expect(res.body.error).toMatch(/not found/i)
    })
  })

  describe("POST /tasks/:name/execute", () => {
    test("executes product_scrape and returns 10 products", async () => {
      const res = await request(app)
        .post("/tasks/product_scrape/execute")
        .send({ taskId: "test-abc" })

      expect(res.status).toBe(200)
      expect(res.body.taskId).toBe("test-abc")
      expect(Array.isArray(res.body.result)).toBe(true)
      expect(res.body.result).toHaveLength(10)
      expect(typeof res.body.executedAt).toBe("number")
    })

    test("uses 'no-task-id' when taskId is omitted", async () => {
      const res = await request(app)
        .post("/tasks/product_scrape/execute")
        .send({})

      expect(res.status).toBe(200)
      expect(res.body.taskId).toBe("no-task-id")
    })

    test("returns 404 for unknown task", async () => {
      const res = await request(app)
        .post("/tasks/nonexistent/execute")
        .send({ taskId: "x" })

      expect(res.status).toBe(404)
      expect(res.body.error).toMatch(/not found/i)
    })
  })
})