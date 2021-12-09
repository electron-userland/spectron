## Testing Spectron

The original Spectron did not have any unit tests, and relied on a series of E2E scenarios built using `mocha` and executed through `xvfb-maybe`. The goal for the new version of Spectron is to have good unit coverage as well as a series of self-documenting E2E specs which cover all the main use cases.

### Test Audit - Migrating the old tests

Here we will discuss the old tests, what they are designed to do and which (parts) of them mignt be beneficial to recreate in the new world.

#### [accessibility-test.js](https://github.com/electron-userland/spectron/blob/master/test/accessibility-test.js)

The accessibility functionality has been [removed](migration.md#accessibility) in favour of modern accessibility testing through devtools-based approaches such as [Axe](https://www.deque.com/axe). As such, these tests are not needed.

#### [application-test.js](https://github.com/electron-userland/spectron/blob/master/test/application-test.js)

- 'launches the application' - Aggregate startup behaviour and valid responses from `browserWindow` API and a bunch of client API methods - This should be split up.
- 'passes through args to the launched app' - testing `args` config value - this can be replicated.
- 'passes through env to the launched app' - testing `env` config value - functionality removed, should be replicated if reinstated.
- 'passes through cwd to the launched app' - testing `cwd` config value - functionality removed, should be replicated if reinstated.
- 'throws an error when no path is specified' - testing empty path to app - this can be replicated as part of testing config validation.
- 'start() rejects with an error if the application does not exist' - testing valid application path - could be replicated but likely to duplicate WDIO / CD functionality
- 'start() rejects with an error if ChromeDriver does not start within the specified timeout' - testing `startTimeout` config value. Should be replicated _if_ the config value is reimplemented.
- 'stop() quits the application' - testing teardown through a logfile - WDIO handles teardown now, not required.
- 'stop() rejects with an error if the application is not running' - WDIO handles teardown now, not required.
- 'restart() restarts the application' - testing CD restart - Not required with new WDIO / CD service. Will be replicated in `wdio-electron-service` if required.
- 'restart() rejects with an error if the application is not running' - testing CD restart fail case - Not required with new WDIO / CD service. Will be replicated in `wdio-electron-service` if required.
- 'getSettings() returns an object with all the configured options' - testing a likely pointless function - functionality removed, should be replicated if reinstated.
- 'getRenderProcessLogs gets the render process console logs and clears them' - testing log retrieval - `getRenderProcessLogs` is just a wrapper for Chromium [`getLogs`](https://webdriver.io/docs/api/chromium/#getlogs) on WDIO browser object. Will replicate test if the wrapper is put back.
- 'getMainProcessLogs gets the main process console logs and clears them' - testing CD logs - this is now handled by CD service, will replicate in `wdio-electron-service` if that route is taken.
- 'getMainProcessLogs does not include any deprecation warnings' - likely added to test the hacky approach to re
