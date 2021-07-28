const { setupBrowser, WebdriverIOBoundFunctions } = require('@testing-library/webdriverio');
const { queries } = require('@testing-library/dom');
const { Application } = require('@goosewobbler/spectron');

describe('application loading', () => {
  const app = new Application({
    chromeDriverLogPath: join(process.cwd(), 'chromeDriver.log'),
    webdriverLogPath: process.cwd(),
    quitTimeout: 0,
  });

  let screen: WebdriverIOBoundFunctions<typeof queries>;

  describe('App', () => {
    beforeEach(async () => {
      await app.start();
      await app.client.waitUntilWindowLoaded();
      screen = setupBrowser(app.client);
    }, 30000);

    afterEach(async () => {
      if (app) {
        await app.mainProcess.abort();
        // await app.stop();
      }
    }, 30000);

    afterAll(() => {});

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
