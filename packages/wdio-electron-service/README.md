# WDIO Spectron Service

(Based entirely on [wdio-chromedriver-service](https://github.com/webdriverio-community/wdio-chromedriver-service).)

This service runs ChromeDriver seamlessly when running tests with [Spectron](http://webdriver.io/guide/testrunner/gettingstarted.html). It uses the [chromedriver](https://www.npmjs.com/package/chromedriver) NPM package that wraps the ChromeDriver for you.

Note - this service does not require a Selenium server, but uses ChromeDriver to communicate with the browser directly.
Obviously, it only supports:

```js
capabilities: [
  {
    browserName: 'chrome',
  },
];
```

## Installation

The easiest way is to keep `wdio-electron-service` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "wdio-electron-service": "^6.0.0"
  }
}
```

You can simple do it by:

```bash
npm install wdio-chromedriver-service --save-dev
```

Note! You have to install [chromedriver](https://www.npmjs.com/package/chromedriver) separately, as it's a peerDependency of this project, and you're free to choose what version to use. Install it using:

```bash
npm install chromedriver --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](http://webdriver.io/guide/getstarted/install.html)

## Configuration

By design, only Google Chrome is available (when installed on the host system). In order to use the service you need to add `spectron` to your service array:

```js
// wdio.conf.js
export.config = {
  outputDir: 'all-logs',
  // ...
  services: [
    ['spectron', {
        logFileName: 'wdio-spectron.log', // default
        outputDir: 'driver-logs', // overwrites the config.outputDir
        args: ['--silent']
    }]
  ],
  // ...
};
```

## Options

### port

The port on which the driver should run on

Example: 7676

Type: `number`

### path

The path on which the driver should run on

Example: `/`

Type: `string`

### protocol

The protocol on which the driver should use

Example: `http`

Type: `string`

### hostname

The protocol on which the driver should use

Example: `localhost`

Type: `string`

### outputDir

The path where the output of the ChromeDriver server should be stored (uses the config.outputDir by default when not set).

Example: `driver-logs`

Type: `string`

### logFileName

The name of the log file to be written in `outputDir`.

Example: `wdio-chromedriver.log`

Type: `string`

### chromedriverCustomPath

To use a custome chromedriver different than the one installed through "chromedriver npm module", provide the path.

Example: `/path/to/chromedriver` (Linux / MacOS), `./chromedriver.exe` or `d:/driver/chromedriver.exe` (Windows)

Type: `string`

For more information on WebdriverIO see the [homepage](https://webdriver.io).
