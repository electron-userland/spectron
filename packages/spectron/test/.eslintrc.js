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
    },
  ],
};
