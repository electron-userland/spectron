## Migrating from older versions of Spectron

Spectron has changed a lot from the original, here we discuss these changes in more depth with a view to solving migration issues.

### Legacy Electron apps

This version of Spectron is designed to be used without `nodeIntegration` and `enableRemoteModule`, and with `contextIsolation` enabled. These are recommended settings for modern secure Electron apps.

`nodeIntegration: true` [was removed](https://www.electronjs.org/docs/latest/breaking-changes#default-changed-nodeintegration-and-webviewtag-default-to-false-contextisolation-defaults-to-true) as a default in Electron 5.0.0.

The `remote` module [was removed](https://www.electronjs.org/docs/latest/breaking-changes#removed-remote-module) in Electron 14.0.0. There is a replacement in [`@electron/remote`](https://github.com/electron/remote), though modernising legacy applications is preferable.

`contextIsolation: false` [was removed](https://www.electronjs.org/docs/latest/breaking-changes#default-changed-contextisolation-defaults-to-true) as a default in Electron 12.0.0.

If you have a legacy application which needs to use any of these deprecated options then you should use the old version of Spectron to test it.

#### Further reading:

Excellent deep dive article on why `remote` is bad can be found [here](https://nornagon.medium.com/electrons-remote-module-considered-harmful-70d69500f31). \
https://www.electronjs.org/docs/latest/tutorial/security

### Chromedriver restart behaviour

All handling of Chromedriver (CD) is now delegated to the `wdio-chromedriver-service`, which is a WebdriverIO (WDIO) "launcher service". This means that Spectron no longer restarts Chromedriver for each test, which massively speeds up test runs but may mean that some suites experience problems with state leak between tests.

The original behaviour might be reinstated in future through creation of a Spectron "worker service" (e.g. `wdio-spectron-service`) to manage the CD process between tests.

#### Further reading:

Discussion around CD process management can be found [here](https://github.com/goosewobbler/spectron/pull/10).\
https://webdriver.io/docs/wdio-chromedriver-service \
https://webdriver.io/docs/customservices

### Accessibility

The accessibility audit functionality was removed; there are other options for accessibility such as [Lighthouse](https://developers.google.com/web/tools/lighthouse) which is part of Chromium/Electron dev tools.
You can also install [axe devtools](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd) via [electron-devtools-installer](https://www.npmjs.com/package/electron-devtools-installer).

### `<webview>` support

`<webview>` has been deprecated in modern Electron builds, if you have a legacy application which uses it then you should use the original version of Spectron. Otherwise, the replacement is [BrowserView](https://www.electronjs.org/docs/latest/api/browser-view) - support for which will be added to the new Spectron:

```ts
const loading = await app.browserView.isLoading();
```

### Configuration

These are the old configuration values (passed into the Spectron constructor) and their equivalents in the new Spectron. There are some equivalents missing from the new version, these will be added in time - some possible replacements are detailed. More details on configuration can be found [here](configuration.md).

- `path` - Replaced by `appPath` and `appName` in the `spectronOpts` section of the config file.
- `args` - This was an array of arguments to pass to the Electron application. It has been replaced with an environment variable which needs to be set in the config file so that it is available to WDIO before it starts. See [here](https://sites.google.com/a/chromium.org/chromedriver/capabilities) for details on Chromium arguments.
  e.g. `process.env.SPECTRON_APP_ARGS = ['--foo', '--bar=baz'].toString();`
- `chromeDriverArgs` - This was an array of arguments to pass to ChromeDriver. The Chromedriver service [documentation](https://webdriver.io/docs/wdio-chromedriver-service/#configuration) shows an `args` option in their configuration example, though this is not detailed in the "options" section of that page. There is also the WDIO option [`execArgv`](https://webdriver.io/docs/options/#execargv) which applies node arguments to WDIO child processes. No replacement as yet.
- `cwd`- This was the path to the working directory to use for the launched application. It was [passed through](https://github.com/electron-userland/spectron/blob/798cf1401cb7ec0596558ebdc8b4c0e8427a25f7/lib/chrome-driver.js#L41) to the Chromedriver child process. There is no CD service equivalent for this option, though it might be resurrected with a `wdio-spectron-service`. No replacement as yet.
- `env` - This was an object of additional environment variables to set in the launched application. These values were [passed to Chromium](https://github.com/electron-userland/spectron/blob/798cf1401cb7ec0596558ebdc8b4c0e8427a25f7/lib/application.js#L178) in `capabilities` as `spectron-env-foo=bar`. No replacement as yet.
- `host` - This was the host name of the launched Chromedriver process. The CD service has [an option](https://webdriver.io/docs/wdio-chromedriver-service/#hostname) for this. No replacement as yet.
- `port` - This can be set in the config file using the WDIO `port` [option](https://webdriver.io/docs/options/#port).
- `nodePath` - This was a path to a `node` executable to launch Chromedriver with. The CD service has [an option](https://webdriver.io/docs/wdio-chromedriver-service/#chromedrivercustompath) which might fulfil this. No replacement as yet.
- `connectionRetryCount` - This was a number of retry attempts to make when connecting to Chromedriver. WDIO has an [equivalent](https://webdriver.io/docs/options/#connectionretrycount) which _may_ apply to CD.
- `connectionRetryTimeout` - This was a timeout to wait for connections to Chromedriver to be made. WDIO has an [equivalent](https://webdriver.io/docs/options/#connectionretrytimeout) which _may_ apply to CD.
- `quitTimeout` - This was a timeout to delay the application quitting. WDIO doesn't allow to configure this, possible but unlikely to introduce it as a delay somewhere in a `wdio-spectron-service`. No replacement as yet.
- `startTimeout` - This was a timeout to delay the start of Chromedriver. There is no Chromedriver service option for this, though it could potentially be reimplemented as either a delay to the WDIO launcher run, or as part of a `wdio-spectron-service`. No replacement as yet.
- `waitTimeout` - This was the timeout value for calls like `waitUntilTextExists` and `waitUntilWindowLoaded` to complete - this value is now passed in on the call itself. The default is still `5000ms`.
- `debuggerAddress` - This was passed through to Chromium config in [`capabilities`](https://github.com/electron-userland/spectron/blob/798cf1401cb7ec0596558ebdc8b4c0e8427a25f7/lib/application.js#L207). No replacement as yet.
- `chromeDriverLogPath` - Chromedriver logs are now output with the other WDIO logs (see `outputDir`) in the `wdio-chromedriver.log` file. No replacement as yet, though the Chromedriver service has two options we can use to resurrect this customisation option - [`outputDir`](https://webdriver.io/docs/wdio-chromedriver-service/#outputdir) and [`logFileName`](https://webdriver.io/docs/wdio-chromedriver-service/#logfilename).
- `webdriverLogPath` - This can be set in the config file using the WDIO `outputDir` [option](https://webdriver.io/docs/options/#outputdir).
- `webdriverOptions` - All webdriver options are now set using the config file.
