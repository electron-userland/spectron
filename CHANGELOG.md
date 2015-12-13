# 0.35.5

* Added a `startTimeout` config option to `Application` that sets the default
  millisecond timeout to wait for ChromeDriver to start up. This option
  defaults to 5 seconds.

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
