module.exports = {
  overrides: [
    {
      files: '*.ts',
      extends: [
        'airbnb-base-typescript',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:import/errors',
        'plugin:import/typescript',
        'plugin:import/warnings',
        'plugin:prettier/recommended',
        'plugin:node/recommended',
        'plugin:jest/recommended',
        'plugin:jest/style',
      ],
      plugins: ['@typescript-eslint', 'import', 'node', 'prettier', 'jest'],
      env: {
        jest: true,
      },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        tsconfigRootDir: __dirname,
        project: './tsconfig.json',
      },
      settings: {
        'import/resolver': {
          typescript: {
            project: [`${__dirname}/tsconfig.json`, `${__dirname}/../../../common/tsconfig.json`],
            alwaysTryTypes: true,
          },
        },
      },
      // rules re-declared here because the "extends" above nukes the inherited ones
      rules: {
        'no-unused-vars': 'off',
        'import/prefer-default-export': 'off',
        'node/no-missing-import': 'off', // duped by import
        'node/no-unpublished-import': 'error',
        'node/no-unsupported-features/es-syntax': ['error', { ignores: ['modules'] }],
        'import/no-extraneous-dependencies': 'off',
        'node/no-extraneous-import': 'off',
        'node/no-extraneous-require': 'off',
        'node/no-unpublished-require': 'off',
        '@typescript-eslint/unbound-method': 'off',
        'jest/unbound-method': 'error',
      },
    },
  ],
};
