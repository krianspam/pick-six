export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  testMatch: ["**/*.test.ts"],
  modulePathIgnorePatterns: ["<rootDir>/outputs/"],
};
