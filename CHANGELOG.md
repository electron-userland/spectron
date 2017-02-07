# 3.6.0

  * Supports Electron `1.6.x` releases.

# 3.5.0

  * Supports Electron `1.5.x` releases.

# 3.4.1

  * Fixed an issue where an error would be thrown when the `process` global
    was set to `null`.

# 3.4.0

  * Supports Electron `1.4.x` releases.
  * The `Application.isRunning()` API is now public.
  * Added an `Application.getSettings()` API to access the settings specified to
    the `Application` constructor.
  * Fixed an issue where `waitUntilWindowLoaded()` did not properly resolve when
    the `webContents` reported as loaded.
  * Fixed an issue where `waitUntilTextExists()` did not properly reject when
    the element did not exist or a timeout occurred.
  * Fixed an issue where a broken pipe error could occur in certain apps.

# 3.3.0

  * Supports Electron `1.3.x` releases.

# 3.2.6
  * Add `ignoreRules` option to `app.client.auditAccessibility(options)`. See
    README for usage details.

# 3.2.5

  * Add `app.client.auditAccessibility` API that audits the window for
    accessibility issues. See README for usage details.

# 3.2.3

  * Add `chromeDriverLogPath` option to `Application`. See README for usage
    details.

# 3.2.2

  * Add `debuggerAddress` option to `Application`. See README for usage details.

# 3.2.0

  * Supports Electron `1.2.x` releases.

# 3.1.3

  * Improve detection of Node integration inside application and gracefully
    handle disabled Node integration.

# 3.1.2

  * Add support for the async `WebContents.savePage` API. See the README
    for usage details.

# 3.1.1

  * Add support for the async `BrowserWindow.capturePage` API. See the README
    for usage details.

# 3.1.0

  * Supports Electron `1.1.x` releases.

# 3.0.1

  * Added a new `requireName` option to `Application` for if your app is
    re-assigning the `require` function to a different name on `window`.
  * Fixed an issue where applications setting `nodeIntegration` to `false` could
    not be tested.

# 3.0.0

  * Spectron now runs with `electron-chromedriver` 1.0 and is targeted at
    apps using Electron 1.0 or later.
  * No API changes.

# 2.37.0

  * Added a `restart()` method to `Application`
  * Added support for the full Electron API
  * Many custom helpers have been removed in favor of accessing the Electron
    APIs directly through the new properties on the `Application` object.
      * `app.client.getWindowBounds()` should now be `app.browserWindow.getBounds()`
      * `app.client.getClipboardText()` should now be `app.electron.clipboard.readText()`
      * See the README or https://github.com/kevinsawicki/spectron/pull/18 for
        more details.
  * You should now use `app.transferPromiseness` instead of `app.client.transferPromiseness`
    to ensure these new properties are correctly transferred to chained promises.

# 1.37.1

  * Add the `getAppPath(name)` that maps to the
    `require('electron').app.getPath(name)` API.

# 1.37.0

  * Upgraded to WebdriverIO 4.0.4
  * Added a `connectionRetryCount` config option to `Application` that sets the
    default number of connection retries to make to ChromeDriver.
  * Added a `connectionRetryTimeout` config option to `Application` that sets
    the default number of milliseconds to wait when connecting to ChromeDriver.

# 0.36.1

* Added a `cwd` config option to `Application` that sets the working
  directory of the launched application. This option defaults to
  `process.cwd()`.
* Added a `getCwd` command helper to get the current working directory of the
  main process.

# 0.35.5

* Added a `startTimeout` config option to `Application` that sets the default
  millisecond timeout to wait for ChromeDriver to start up. This option
  defaults to 5 seconds.
* Added a `nodePath` config option to `Application` that sets the path to a
  `node` executable that will be used to launch the ChromeDriver startup
  script.

# 0.35.4

* Added `getMainProcessGlobal` command helper to get a global from the main
  process.

# 0.35.2

* Remove use of deprecated Electron APIs.

# 0.35.1

* Added `getMainProcessLogs` command helpers to get main process logs.
* Added `getRenderProcessLogs` command helpers to get render process logs.

# 0.34.1

* Added a `waitTimeout` config option to `Application` that sets the default
  millisecond timeout for all wait-based command helpers like `waitUntil`,
  `waitUntilWindowLoaded`, etc. This option defaults to 5 seconds.
* Added a `windowByIndex(index)` command helper that focuses a window by
  index in the `windowHandles()` array order.
* Added `setRepresentedFilename` and `getRepresentedFilename` command helpers.
* Added `isDocumentEdited` and `setDocumentEdited` command helpers.
* `setWindowDimensions` was renamed to `setWindowBounds` to mirror the new
  Electron `BrowserWindow.setBounds` API. It also takes a `bounds` object
  argument instead of multiple arguments for size and position. See the
  `README` for an example
* `getWindowDimensions` was renamed to `getWindowBounds` to mirror the new
  Electron `BrowserWindow.getBounds` API. See the `README` for an example.
