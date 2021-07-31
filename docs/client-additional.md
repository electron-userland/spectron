# Client API Additional Functions

Spectron defines a number of extensions to the WebDriverIO API:

## client.getMainProcessLogs() / getRenderProcessLogs()

Gets the `console` log output from the main / renderer process. The logs are cleared
after they are returned.

Returns a `Promise` that resolves to an array of string log messages.

```ts
const mLogs = await app.client.getMainProcessLogs();
const rLogs = await app.client.getRenderProcessLogs();
mlogs.forEach((mlog) => console.log(`main: ${mlog}`));
rlogs.forEach((rlog) => console.log(`renderer: ${rlog}`));
```

## client.getSelectedText()

Get the selected text in the current window.

```ts
const selectedText = await app.client.getSelectedText();
```

## client.getWindowCount()

Gets the number of open windows.
`<webview>` tags are also counted as separate windows.

```ts
const windowCount = await app.client.getWindowCount();
```

## client.waitUntilTextExists(selector, text, [timeout])

Waits until the element matching the given selector contains the given
text. Takes an optional timeout in milliseconds that defaults to `5000`.

```ts
app.client.waitUntilTextExists('#message', 'Success', 10000);
```

## client.waitUntilWindowLoaded([timeout])

Wait until the window is no longer loading. Takes an optional timeout
in milliseconds that defaults to `5000`.

```ts
app.client.waitUntilWindowLoaded(10000);
```

## client.windowByIndex(index)

Focus a window using its index from the `windowHandles()` array.
`<webview>` tags can also be focused as a separate window.

```ts
app.client.windowByIndex(1);
```
