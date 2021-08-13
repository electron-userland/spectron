export const config = {
  // hostname: '127.0.0.1',
  port: 9515,
  waitforTimeout: 5000,
  connectionRetryCount: 10,
  connectionRetryTimeout: 30000,
  logLevel: 'debug',
  runner: 'local',
  outputDir: 'all-logs',
  specs: ['./*.spec.ts'],
  autoCompileOpts: {
    autoCompile: true,
    // see https://github.com/TypeStrong/ts-node#cli-and-programmatic-options
    // for all available options
    tsNodeOpts: {
      transpileOnly: true,
      files: true,
      moduleTypes: {
        // WDIO doesn't currently support ESM
        '*.conf.ts': 'cjs',
        '*.spec.ts': 'cjs',
      },
      project: './tsconfig.json',
    },
    // tsconfig-paths is only used if "tsConfigPathsOpts" are provided, if you
    // do please make sure "tsconfig-paths" is installed as dependency
    tsConfigPathsOpts: {
      baseUrl: './',
    },
  },
  framework: 'mocha',
};
