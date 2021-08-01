module.exports = {
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    'import/no-extraneous-dependencies': 'off',
    'node/no-extraneous-import': 'off',
    'node/no-extraneous-require': 'off',
    'node/no-unpublished-import': 'off',
    'node/no-unpublished-require': 'off',
    'node/no-unsupported-features/es-syntax': ['error', { ignores: ['modules'] }],
  },
  overrides: [
    {
      files: '*.ts',
      env: {
        jasmine: true,
      },
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        tsconfigRootDir: __dirname,
        project: './tsconfig.json',
      },
      settings: {
        'import/resolver': {
          typescript: {
            project: [`${__dirname}/tsconfig.json`, `${__dirname}/../common/tsconfig.json`],
            alwaysTryTypes: true,
          },
        },
        'import/parsers': {
          '@typescript-eslint/parser': ['.ts'],
        },
      },
    },
  ],
};
