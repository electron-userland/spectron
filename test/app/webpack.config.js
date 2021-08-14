const { ProgressPlugin } = require('webpack');

const plugins = [new ProgressPlugin()];
const mode = 'development';

module.exports = [
  {
    mode,
    entry: ['./src/main.js'],
    output: {
      path: `${__dirname}/dist`,
      filename: `main.js`,
    },
    plugins,
    resolve: {
      extensions: ['.js'],
    },
    target: 'electron-main',
    node: {
      __dirname: true,
      __filename: true,
    },
  },
  {
    mode,
    entry: ['./src/preload.js'],
    output: {
      path: `${__dirname}/dist`,
      filename: `preload.js`,
    },
    plugins,
    resolve: {
      extensions: ['.js'],
    },
    target: 'electron-preload',
    node: {
      __dirname: true,
      __filename: true,
    },
  },
];
