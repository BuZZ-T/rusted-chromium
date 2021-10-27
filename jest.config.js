module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: [
    "*.ts",
    "**/*.ts",
    "!<rootDir>/node_modules/",
    "!<rootDir>/start-local.ts",
    "!public_api.ts",
  ],
}
