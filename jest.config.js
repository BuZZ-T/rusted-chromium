module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: [
    "*.ts",
    "**/*.ts",
    "!<rootDir>/node_modules/"
  ],
}
