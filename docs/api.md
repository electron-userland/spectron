## Core API

All API methods are functions returning Promises. Examples assume an initialised Spectron object:

```ts
const app = await initSpectron();
```

### client - WebdriverIO

The `client` API is WebdriverIO's `browser` object. WDIO Documentation can be found
[here](http://webdriver.io/api.html), and Spectron extensions are detailed [here](#client-api).

To get the text of an element:

```ts
const errorText = await app.client.getText('#error-alert');
```

### browserWindow - Electron

The `browserWindow` property provides you access to the current [BrowserWindow](http://electronjs.org/docs/latest/api/browser-window/).

To check if the current window is visible:

```ts
const visible = await app.browserWindow.isVisible();
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

To get the version string of the loaded application you can use one of:

```ts
const version = await app.app.getVersion();
const version = await app.electronApp.getVersion();
```

## Client API

Spectron defines a number of extensions to the WebdriverIO browser API:

### client.getMainProcessLogs() / getRenderProcessLogs()

Gets the `console` log output from the main / renderer process. The logs are cleared
after they are returned.

Returns a `Promise` that resolves to an array of string log messages.

```ts
const mLogs = await app.client.getMainProcessLogs();
const rLogs = await app.client.getRenderProcessLogs();
mlogs.forEach((mlog) => console.log(`main: ${mlog}`));
rlogs.forEach((rlog) => console.log(`renderer: ${rlog}`));
```

### client.getSelectedText()

Get the selected text in the current window.

```ts
const selectedText = await app.client.getSelectedText();
```

### client.getWindowCount()

Gets the number of open windows.

```ts
const windowCount = await app.client.getWindowCount();
```

### client.waitUntilTextExists(selector, text, [timeout])

Waits until the element matching the given selector contains the given
text. Takes an optional timeout in milliseconds that defaults to `5000`.

```ts
app.client.waitUntilTextExists('#message', 'Success', 10000);
```

### client.waitUntilWindowLoaded([timeout])

Wait until the window is no longer loading. Takes an optional timeout
in milliseconds that defaults to `5000`.

```ts
app.client.waitUntilWindowLoaded(10000);
```

### client.windowByIndex(index)

Focus a window using its index from the `windowHandles()` array.

```ts
app.client.windowByIndex(1);
```
