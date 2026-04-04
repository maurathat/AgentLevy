import { executeAndStore, mockStore } from "../worker"
import { TASKS } from "../tasks"

// Pinata is not configured in tests — worker will fall back to mockStore
// No network calls are made

describe("executeAndStore()", () => {
  let spec: ReturnType<typeof TASKS["product_scrape"]["buildSpec"]>

  beforeEach(() => {
    spec = TASKS["product_scrape"].buildSpec()
    // Clear mock store between tests
    for (const key of Object.keys(mockStore)) {
      delete mockStore[key]
    }
  })

  test("returns result, resultHash, and storageURI", async () => {
    const work = await executeAndStore(spec)

    expect(work).toHaveProperty("result")
    expect(work).toHaveProperty("resultHash")
    expect(work).toHaveProperty("storageURI")
  })

  test("resultHash is a 0x-prefixed hex string", async () => {
    const { resultHash } = await executeAndStore(spec)
    expect(resultHash).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  test("storageURI uses local mock when PINATA_JWT is not set", async () => {
    const { storageURI } = await executeAndStore(spec)
    expect(storageURI).toMatch(/^local:\/\//)
  })

  test("result is stored in mockStore under the task id", async () => {
    await executeAndStore(spec)
    expect(mockStore[spec.id]).toBeDefined()
  })

  test("throws if no handler matches the verification type", async () => {
    const badSpec = {
      ...spec,
      verification: { type: "checksum_match" as const, criteria: {} },
    }
    await expect(executeAndStore(badSpec)).rejects.toThrow(
      "No handler for verification type: checksum_match"
    )
  })
})