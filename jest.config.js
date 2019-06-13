const config = {
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  testEnvironment: "jest-environment-node",
  setupFilesAfterEnv: ["<rootDir>/setupTests.js"]
};

module.exports = config;
