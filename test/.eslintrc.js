module.exports = {
  rules: {
    'import/no-extraneous-dependencies': 'off',
    'node/no-extraneous-import': 'off',
    'node/no-unpublished-import': 'off',
  },
  overrides: [
    {
      files: '*.ts',
      env: {
        jasmine: true,
      },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        tsconfigRootDir: __dirname,
        project: './tsconfig.json',
      },
    },
  ],
};
