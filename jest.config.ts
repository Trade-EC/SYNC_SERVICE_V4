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
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^/opt/nodejs/(.*)$": "<rootDir>/src/layers/sync-service-layer/$1"
  },
  setupFilesAfterEnv: ["./src/setupTestsAfterEnv.ts"],
  moduleDirectories: [
    "node_modules",
    "src/layers/sync-service-layer/node_modules",
    "src/functions/**/node_modules"
  ]
};

export default config;
