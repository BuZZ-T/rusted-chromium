module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  runner: 'groups',
  collectCoverageFrom: [
    "*.ts",
    "**/*.ts",
    "!<rootDir>/node_modules/",
    "!<rootDir>/start-local.ts",
    "!public_api.ts",
    "!<rootDir>/test/*",
    "!test.utils.ts",
  ],
}
