/* eslint  import/no-extraneous-dependencies: 'off', node/no-extraneous-require: off */
const fs = require('fs-extra');
const { pathsToModuleNameMapper } = require('ts-jest/utils');

const tsConfig = JSON.parse(fs.readFileSync('./tsconfig.json'));
const { paths } = tsConfig.compilerOptions;
const moduleNameMapper = pathsToModuleNameMapper(paths, { prefix: '<rootDir>/' });

module.exports = {
  preset: 'ts-jest',
  coverageReporters: ['html', 'lcov', 'text'],
  coverageDirectory: '<rootDir>/coverage',
  transform: {
    '^.+\\.ts': 'ts-jest',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/lib/*.ts'],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  clearMocks: true,
  rootDir: '.',
  roots: ['<rootDir>', '<rootDir>/../../common'],
  modulePaths: ['<rootDir>', '<rootDir>/../../common'],
  modulePathIgnorePatterns: ['dist', '.node_modules_production'],
  testMatch: ['<rootDir>/test/*.spec.ts'],
  testURL: 'https://github.com/goosewobbler/',
  testEnvironment: 'jsdom',
  moduleNameMapper,
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsConfig: './test/tsconfig.json',
      packageJson: './package.json',
    },
  },
};
