# <img src="https://cloud.githubusercontent.com/assets/378023/15063284/cf544f2c-1383-11e6-9336-e13bd64b1694.png" width="60px" align="center" alt="Spectron icon"> Spectron

[![CI](https://github.com/goosewobbler/spectron/workflows/CI/badge.svg)](https://github.com/goosewobbler/spectron/actions)
[![dependencies](https://img.shields.io/david/goosewobbler/spectron.svg)](https://david-dm.org/goosewobbler/spectron) [![license:mit](https://img.shields.io/badge/license-mit-blue.svg)](https://opensource.org/licenses/MIT) [![npm:](https://img.shields.io/npm/v/@goosewobbler/spectron.svg)](https://www.npmjs.com/package/@goosewobbler/spectron) [![downloads](https://img.shields.io/npm/dm/@goosewobbler/spectron.svg)](https://www.npmjs.com/package/@goosewobbler/spectron)

Easily test your [Electron](http://electronjs.org) apps using
[ChromeDriver](https://sites.google.com/chromium.org/driver/) and
[WebdriverIO](http://webdriver.io).

## Differences between this fork and @electron-userland/spectron

This was forked to fulfil a simple requirement - bring Spectron in line with modern Electron development, by any means necessary. I deleted a lot of code and some things might not work as expected. This is a rewrite with much greater WebDriverIO integration than the original - for instance, all handling of ChromeDriver is now delegated to the WDIO ChromeDriver service.

Other, non-WebDriver based options for your Electron E2E testing:

[Playwright](https://playwright.dev) (currently experimental support for Electron).
[Puppeteer-in-electron](https://github.com/TrevorSundberg/puppeteer-in-electron)

This version of Spectron is designed to be used with `nodeIntegration: false`, `enableRemoteModule: false`, and `contextIsolation: true`. These are recommended defaults for modern secure Electron apps.

## Installation & Quick Start

Install Spectron using your favourite package manager. You will also need a WebDriverIO framework dependency for whichever [framework](https://webdriver.io/docs/frameworks/) you want to use, for instance Jasmine:

```sh
npm install --save-dev @goosewobbler/spectron @wdio/jasmine-framework

---

yarn add -D @goosewobbler/spectron @wdio/jasmine-framework

---

pnpm i -D @goosewobbler/spectron @wdio/jasmine-framework
```

In your main process root (index) file, add the following import:

```ts
import '@goosewobbler/spectron/main';
```

In your preload file, add the following import:

```ts
import '@goosewobbler/spectron/preload';
```

Add a spec file - the following is an example using Jasmine and Testing Library, on a Mac:

```ts
import { BrowserBase, setupBrowser, WebdriverIOBoundFunctions } from '@testing-library/webdriverio';
import { queries } from '@testing-library/dom';
import { initSpectron } from '@goosewobbler/spectron';
import { SpectronApp } from '../packages/spectron/lib/application';

describe('application loading', () => {
  let screen: WebdriverIOBoundFunctions<typeof queries>;
  let app: SpectronApp;

  describe('App', () => {
    beforeAll(async () => {
      app = await initSpectron({
        quitTimeout: 1000,
      });
    });

    beforeEach(async () => {
      await app.client.waitUntilWindowLoaded();
      screen = setupBrowser(app.client as unknown as BrowserBase);
    }, 30000);

    afterEach(async () => {
      if (app) {
        await app.quit();
      }
    }, 30000);

    it('launches the application', async () => {
      const response = await app.client.getWindowHandles();
      expect(response.length).toEqual(1);

      const bounds = await app.browserWindow.getBounds();
      expect(bounds.width).toEqual(200);
      expect(bounds.height).toEqual(300);
      await app.client.waitUntilTextExists('html', 'Hello');
      const title = await app.client.getTitle();
      expect(title).toEqual('Test');
    });
  });
});
```

Obviously this depends on your app binary so you will need to ensure it is built before the tests are executed.

Next you will need a config file. Spectron uses the exact same format as the [WebDriverIO config file](https://webdriver.io/docs/configurationfile) for their TestRunner, the only difference is that you won't need to configure ChromeDriver in `services` or anything in the `capabilities` section as these are handled by Spectron. Config merging is handled by WDIO.

Finally, you can execute your tests in a similar way to WebDriverIO (Spectron wraps the WDIO TestRunner):

```sh
npx spectron ./spectron.conf.ts

---

yarn spectron ./spectron.conf.ts

---

pnpx spectron ./spectron.conf.ts
```

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

```ts
const errorText = await app.client.getText('#error-alert');
```

### browserWindow - Electron

The `browserWindow` property provides you access to the current [BrowserWindow](http://electronjs.org/docs/latest/api/browser-window/).

To check if the current window is visible:

```ts
const visible = await app.client.isVisible();
```

### webContents - Electron

The `webContents` property provides you access to the [WebContents](http://electronjs.org/docs/latest/api/web-contents/)
for the current window.

To check if the current window's webContents is loading:

```ts
const loading = await app.webContents.isLoading();
```

### mainProcess / rendererProcess - Electron

The `mainProcess` and `rendererProcess` properties you access to the [process](http://electronjs.org/docs/latest/api/process/) object in a given context.

To check args passed to the main process:

```ts
const argv = await app.mainProcess.argv();
```

### app - Electron

The `app` property gives you access to the [app](http://electronjs.org/docs/latest/api/app/) object. It is also available as `electronApp`.

To get the version string of the loaded application:

```ts
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
