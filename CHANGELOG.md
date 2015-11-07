# 0.34.1

* `setWindowDimensions` was renamed to `setWindowBounds` to mirror the new
  Electron `BrowserWindow.setBounds` API. It also takes a `bounds` object
  argument instead of multiple arguments for size and position. See the
  `README` for an example
* `getWindowDimensions` was renamed to `getWindowBounds` to mirror the new
  Electron `BrowserWindow.getBounds` API. See the `README` for an example.
