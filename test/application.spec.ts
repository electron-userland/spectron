const { setupBrowser, WebdriverIOBoundFunctions } = require('@testing-library/webdriverio');
const { queries } = require('@testing-library/dom');
const { initSpectron } = require('@goosewobbler/spectron');

describe('application loading', () => {
  let screen: WebdriverIOBoundFunctions<typeof queries>;
  let app;

  describe('App', () => {
    beforeAll(async () => {
      app = await initSpectron({
        quitTimeout: 0,
      });
    });

    beforeEach(async () => {
      await browser.waitUntilWindowLoaded();
      screen = setupBrowser(browser);
    }, 30000);

    afterEach(async () => {
      if (app) {
        await app.quit();
      }
    }, 30000);

    it('launches the application', async () => {
      const response = await browser.getWindowHandles();
      expect(response.length).toEqual(1);

      const bounds = await app.browserWindow.getBounds();
      expect(bounds.width).toEqual(200);
      expect(bounds.height).toEqual(300);
      await browser.waitUntilTextExists('html', 'Hello');
      const title = await browser.getTitle();
      expect(title).toEqual('Test');
    });
  });
});
