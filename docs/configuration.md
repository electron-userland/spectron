# Spectron Configuration

Spectron reads in configuration parameters via a config file, in a similar way to WebdriverIO.

## `spectron.conf.js`

The configuration file can be placed anywhere but for most applications you will probably want to put it in the root directory of your Electron project. Any WDIO configuration value is valid, although these ones are used by Spectron so will be overwritten if you specify them.

The Spectron-specific configuration options are namespaced under `spectronOpts`.

### spectronOpts

#### `appPath`: string (required, no default)

The path to your built app.

#### `appName`: string (required, no default)

The name of your built app. It is combined with the `appPath` value to generate a path to your Electron binary.

It needs to be the same as the install directory used by `electron-builder`, which is derived from your `package.json` configuration - either `name` or `productName`. You can find more information regarding this in the `electron-builder` [documentation](https://www.electron.build/configuration/configuration#configuration).

#### `logFileName`

## Migrating configuration from older versions of Spectron

Please see the [migration guide](migration.md#configuration).
