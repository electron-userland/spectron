module.exports = {
  preset: 'ts-jest',
  coverageReporters: ['html', 'lcov', 'text'],
  coverageDirectory: '<rootDir>/coverage',
  transform: {
    '^.+\\.ts': 'ts-jest',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/../../packages/spectron/lib/*.js'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  clearMocks: true,
  testPathIgnorePatterns: ['.node_modules_production'],
  modulePathIgnorePatterns: ['.node_modules_production'],
  testMatch: ['**/test/unit/*.spec.ts'],
  testURL: 'https://github.com/goosewobbler/',
  testEnvironment: 'jsdom',
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json',
      packageJson: 'package.json',
    },
  },
};
