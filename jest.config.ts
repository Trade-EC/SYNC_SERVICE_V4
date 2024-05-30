/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */
import type { Config } from "jest";

const config: Config = {
  transform: {
    "^.+\\.ts?$": "ts-jest"
  },
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  collectCoverageFrom: [
    "**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/*.types.ts",
    "!**/coverage/**",
    "!**/node_modules/**",
    "!**/babel.config.js",
    "!**/jest.config.js"
  ],
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^/opt/nodejs/(.*)$": "<rootDir>/src/layers/$1",
    "^@middy/core$":
      "<rootDir>/src/layers/sync-service-layer/node_modules/@middy/core"
  },
  setupFilesAfterEnv: ["./src/setupTestsAfterEnv.ts"],
  moduleDirectories: [
    "node_modules",
    "src/layers/sync-service-layer/node_modules"
  ]
};

export default config;
