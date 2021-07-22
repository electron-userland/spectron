# <img src="https://cloud.githubusercontent.com/assets/378023/15063284/cf544f2c-1383-11e6-9336-e13bd64b1694.png" width="60px" align="center" alt="Spectron icon"> Spectron

[![CI](https://github.com/goosewobbler/spectron/workflows/CI/badge.svg)](https://github.com/goosewobbler/spectron/actions)
[![dependencies](https://img.shields.io/david/goosewobbler/spectron.svg)](https://david-dm.org/goosewobbler/spectron) [![license:mit](https://img.shields.io/badge/license-mit-blue.svg)](https://opensource.org/licenses/MIT) [![npm:](https://img.shields.io/npm/v/@goosewobbler/spectron.svg)](https://www.npmjs.com/package/@goosewobbler/spectron) [![downloads](https://img.shields.io/npm/dm/@goosewobbler/spectron.svg)](https://www.npmjs.com/package/@goosewobbler/spectron)

Easily test your [Electron](http://electronjs.org) apps using
[ChromeDriver](https://sites.google.com/chromium.org/driver/) and
[WebdriverIO](http://webdriver.io).

## Differences between this fork and @electron-userland/spectron

This was forked to fulfil a simple requirement - bring Spectron in line with modern Electron development, by any means necessary. I deleted a lot of code and some things might not work as expected. Spectron really needs a complete rewrite, this is a start.

Other options: [Playwright](https://playwright.dev) (currently experimental support for Electron).

This version of Spectron is designed to be used with `nodeIntegration: false`, `enableRemoteModule: false`, and `contextIsolation: true`. These are recommended defaults for modern secure Electron apps.

## Installation & Quick Start

Install using your favourite package manager:

```sh
npm install --save-dev @goosewobbler/spectron

---

yarn add -D @goosewobbler/spectron

---

pnpm i -D @goosewobbler/spectron
```

In your main process root (index) file, add the following import:

```js
import '@goosewobbler/spectron/main';
```

In your preload file, add the following import:

```js
import '@goosewobbler/spectron/preload';
```

Add a spec file - the following is an example using Jest and Testing Library, on a Mac:

```js
import path from 'path';
import { Application } from '@goosewobbler/spectron';
import { setupBrowser } from '@testing-library/webdriverio';

const app: Application = new Application({
  path: path.join(
    process.cwd(), // This works assuming you run npm test from project root
    // The path to the binary depends on your platform and architecture
    'dist/mac/lists.app/Contents/MacOS/lists',
  ),
});

describe('App', () => {
  beforeEach(async () => {
    await app.start();
    await app.client.waitUntilWindowLoaded();
  });

  afterEach(async () => {
    if (app && app.isRunning()) {
      await app.stop();
    }
  });

  it('should launch app', async () => {
    const isVisible = await app.browserWindow.isVisible();
    expect(isVisible).toBe(true);
  });

  it('should display a new list button', async () => {
    const button = await screen.getByText('New List');
    expect(button).toBeDefined();
  });

  describe('when the new list button is clicked', () => {
    it('should create a new list input box', async () => {
      const button = await screen.getByText('New List');
      await button.click();
      const input = await screen.getByLabelText('List Title');
      expect(await input.getValue()).toEqual('New List');
    });
  });
});
```

Obviously this depends on your app binary so you will need to ensure it is built before the tests are executed.

## Known Limitations / WIP

The old functionality of the electron.remote API is not yet fully replicated, each of the APIs has to be added back separately. Some API functions may not work due to serialisation errors - this is a consequence of the new way of accessing electron methods from renderer processes and is by design - however it should be possible to create workarounds for most of these cases.

The accessibility testing is gone, not considering putting that back as the tool being used hasn't had a commit for 4 years, and there are better devtools-based alternatives for accessibility. \<webview\> is being deprecated so I deleted those tests, BrowserView support will be added before long.

Logging all tasks here:

https://github.com/goosewobbler/spectron/projects/1

## Configuration

Details of how to configure Spectron can be found [here](./docs/configuration.md).

## Core APIs

All API methods are functions returning Promises.

### client - WebDriverIO

The `client` API is WebdriverIO's `browser` object. Documentation can be found
[here](http://webdriver.io/api.html). Differences to the API are detailed [here](./docs/client-additional.md).

To get the text of an element:

```js
const errorText = await app.client.getText('#error-alert');
```

### browserWindow - Electron

The `browserWindow` property provides you access to the current [BrowserWindow](http://electronjs.org/docs/latest/api/browser-window/).

To check if the current window is visible:

```js
const visible = await app.client.isVisible();
```

### webContents - Electron

The `webContents` property provides you access to the [WebContents](http://electronjs.org/docs/latest/api/web-contents/)
for the current window.

To check if the current window's webContents is loading:

```js
const loading = await app.webContents.isLoading();
```

### mainProcess / rendererProcess - Electron

The `mainProcess` and `rendererProcess` properties you access to the [process](http://electronjs.org/docs/latest/api/process/) object in a given context.

To check args passed to the main process:

```js
const argv = await app.mainProcess.argv();
```

### app - Electron

The `app` property gives you access to the [app](http://electronjs.org/docs/latest/api/app/) object. It is also available as `electronApp`.

To get the version string of the loaded application:

```js
const version = await app.electronApp.getVersion();
```

## Application Methods

Methods available to control Spectron directly:

### start()

Starts the application. Returns a `Promise` that will be resolved when the
application is ready to use.

### stop()

Stops the application. Returns a `Promise` that will be resolved once the
application has stopped.

### restart()

Stops the application and then starts it. Returns a `Promise` that will be
resolved once the application has started again.

### isRunning()

Checks to determine if the application is running or not.

Returns a `Boolean`.

### getSettings()

Get all the configured options passed to the `new Application()` constructor.
This will include the default options values currently being used.

Returns an `Object`.
