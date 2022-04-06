module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    runner: 'groups',
    collectCoverageFrom: [
        '*.ts',
        '**/*.ts',
        '!<rootDir>/start-local.ts',
        '!public_api.ts',
        '!<rootDir>/test/*',
        '!public_api.ts',
        '!<rootDir>/examples/*'
    ],
}
