import type { Config } from "jest"

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "^../../shared/(.*)$": "<rootDir>/shared/$1",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(uuid)/)",
  ],
}

export default config