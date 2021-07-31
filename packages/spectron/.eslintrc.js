module.exports = {
  extends: ['airbnb-base', 'prettier', 'plugin:node/recommended'],
  plugins: ['import', 'node', 'prettier', 'promise'],
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  rules: {
    'curly': 'error',
    'import/extensions': ['error', 'never', { json: 'always' }],
    'import/no-default-export': 'error',
    'import/prefer-default-export': 'off',
    'no-param-reassign': ['error', { props: false }],
  },
  globals: {
    module: false,
    require: false,
    __dirname: false,
  },
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
      ],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      env: {
        node: true,
      },
      rules: {
        'no-unused-vars': 'off',
        'import/prefer-default-export': 'off',
        'node/no-unsupported-features/es-syntax': ['error', { ignores: ['modules'] }],
      },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        tsconfigRootDir: __dirname,
        project: '../../../tsconfig.json',
      },
      settings: {
        node: {
          tryExtensions: ['.js', '.json', '.node', '.ts'],
        },
      },
    },
  ],
};
