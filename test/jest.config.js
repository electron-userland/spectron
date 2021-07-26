module.exports = {
  preset: 'ts-jest',
  coverageReporters: ['html', 'lcov', 'text'],
  coverageDirectory: '<rootDir>/coverage',
  transform: {
    '^.+\\.ts': 'ts-jest',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  collectCoverageFrom: ['../../packages/spectron/lib/**/*'],
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
  testMatch: ['<rootDir>/*.spec.ts'],
  testURL: 'https://github.com/goosewobbler/',
  testEnvironment: 'jsdom',
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/tsconfig.json',
      packageJson: '<rootDir>/package.json',
    },
  },
};
