module.exports = {
  rules: {
    'node/no-unpublished-bin': 'off', // false positive
    'node/no-unpublished-require': 'off', // false positive
  },
  overrides: [
    {
      files: '*.ts',
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        tsconfigRootDir: __dirname,
        project: './tsconfig.json',
      },
      settings: {
        'import/resolver': {
          typescript: {
            project: [`${__dirname}/tsconfig.json`, `${__dirname}/../../common/tsconfig.json`],
            alwaysTryTypes: true,
          },
        },
      },
      rules: {
        'no-unused-vars': 'off',
        'import/prefer-default-export': 'off',
        'node/no-missing-import': 'off', // duped by import
        'node/no-unpublished-import': 'error', // switched on for the NPM package
        'node/no-unsupported-features/es-syntax': ['error', { ignores: ['modules'] }],
      },
    },
  ],
};
