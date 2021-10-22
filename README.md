# <img src="https://cloud.githubusercontent.com/assets/378023/15063284/cf544f2c-1383-11e6-9336-e13bd64b1694.png" width="60px" align="center" alt="Spectron icon"> Spectron

[![CI](https://github.com/goosewobbler/spectron/workflows/CI/badge.svg)](https://github.com/goosewobbler/spectron/actions)
[![dependencies](https://img.shields.io/david/goosewobbler/spectron.svg)](https://david-dm.org/goosewobbler/spectron) [![license:mit](https://img.shields.io/badge/license-mit-blue.svg)](https://opensource.org/licenses/MIT) [![npm:](https://img.shields.io/npm/v/@goosewobbler/spectron.svg)](https://www.npmjs.com/package/@goosewobbler/spectron) [![downloads](https://img.shields.io/npm/dm/@goosewobbler/spectron.svg)](https://www.npmjs.com/package/@goosewobbler/spectron)

Easily test your [Electron](http://electronjs.org) apps using [WebdriverIO](http://webdriver.io) and [Chromedriver](https://sites.google.com/chromium.org/driver/).

## Rationale

This fork of Spectron exists to fulfil a simple requirement - bring Spectron in line with modern versions of Electron & WebdriverIO, by any means necessary. The code has been completely rewritten in Typescript with modern dependencies and a much greater WebdriverIO integration.

## Installation & Quick Start

Install Spectron using your favourite package manager. You will also need to install WebdriverIO and a framework dependency for whichever [framework](https://webdriver.io/docs/frameworks/) you want to use, for instance Mocha:

```sh
npm install --save-dev @goosewobbler/spectron webdriverio @wdio/mocha-framework

yarn add -D @goosewobbler/spectron webdriverio @wdio/mocha-framework

pnpm i -D @goosewobbler/spectron webdriverio @wdio/mocha-framework
```

In your main process root (index) file, add the following import:

```ts
import '@goosewobbler/spectron/main';
```

In your preload file, add the following import:

```ts
import '@goosewobbler/spectron/preload';
```

Add a spec file - the following is a basic example in TypeScript using [Mocha](https://mochajs.org) and [Testing Library](https://testing-library.com/docs/webdriverio-testing-library/intro):

```ts
import { initSpectron, SpectronApp } from '@goosewobbler/spectron';
import { setupBrowser, WebdriverIOQueries } from '@testing-library/webdriverio';

let app: SpectronApp;
let screen: WebdriverIOQueries;

describe('App', () => {
  before(async (): Promise<void> => {
    app = await initSpectron();
    await app.client.waitUntilWindowLoaded();
    screen = setupBrowser(app.client);
  });

  it('should launch the app', async () => {
    const isVisible = await app.browserWindow.isVisible();
    expect(isVisible).toBe(true);
  });

  it('should display a button', async () => {
    const button = await screen.getByText('This is a button');
    expect(button).toBeDefined();
  });
});
```

Running tests with Spectron depends on your app binary so you will need to ensure it is built before the tests are executed.

Next you will need some configuration. Spectron uses the exact same format as the [WebdriverIO configuration file](https://webdriver.io/docs/configurationfile) for their TestRunner, the only difference is that you won't need to configure Chromedriver in `services` or anything in the `capabilities` section as these are handled by Spectron. Here is a sample configuration:

```js
const { join } = require('path');
const fs = require('fs-extra');

const packageJson = JSON.parse(fs.readFileSync('./package.json'));
const {
  build: { productName },
} = packageJson;

const config = {
  spectronOpts: {
    appPath: join(process.cwd(), 'dist'),
    appName: productName,
  },
  port: 9515,
  waitforTimeout: 5000,
  connectionRetryCount: 10,
  connectionRetryTimeout: 30000,
  logLevel: 'debug',
  runner: 'local',
  outputDir: 'wdio-logs',
  specs: ['./test/e2e/*.spec.ts'],
  autoCompileOpts: {
    autoCompile: true,
    tsNodeOpts: {
      transpileOnly: true,
      files: true,
      project: './tsconfig.json',
    },
    tsConfigPathsOpts: {
      baseUrl: './',
    },
  },
  framework: 'mocha',
};

module.exports = { config };
```

Finally, you can execute your tests by pointing Spectron at your configuration file:

```sh
npx spectron ./spectron.conf.js

yarn spectron ./spectron.conf.js

pnpx spectron ./spectron.conf.js
```

## API

API details can be found [here](docs/api.md).

## Architecture

The architecture of Spectron is documented [here](docs/architecture.md).

## Known Limitations / WIP

Not all Electron APIs are currently supported.

The old functionality of the Electron `remote` API (now found [here](https://github.com/electron/remote)) is not yet fully replicated.

Some Electron API functions may not work due to serialisation errors; this is a consequence of the new way of accessing electron methods from renderer processes, this is by design and can be worked around.

## Development

Logging all tasks for development [here](https://github.com/goosewobbler/spectron/projects/1).

## Configuration

Details of how to configure Spectron can be found [here](./docs/configuration.md).

## Alternative options for Electron E2E testing:

[Playwright](https://playwright.dev) (currently experimental Electron support) \
[Puppeteer-in-electron](https://github.com/TrevorSundberg/puppeteer-in-electron)
