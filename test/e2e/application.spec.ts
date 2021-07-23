import path from 'path';
import { setupBrowser, WebdriverIOBoundFunctions } from '@testing-library/webdriverio';
import { queries } from '@testing-library/dom';
import { Application } from '@goosewobbler/spectron';

describe('application loading', function () {
  const app = new Application({
    path: path.join(process.cwd(), 'dist/mac/test.app/Contents/MacOS/test'),
    chromeDriverLogPath: path.join(process.cwd(), 'chromeDriver.log'),
  });

  //@ts-ignore
  let screen: WebdriverIOBoundFunctions<typeof queries>;

  describe('App', () => {
    beforeEach(async () => {
      await app.start();
      await app.client.waitUntilWindowLoaded();
      screen = setupBrowser(app.client);
    }, 30000);

    afterEach(async () => {
      if (app && app.isRunning()) {
        await app.stop();
      }
    }, 30000);

    it('launches the application', async function () {
      const response = await app.client.getWindowHandles();
      expect(response.length).toEqual(1);

      const bounds = await app.browserWindow.getBounds();
      expect(bounds).toEqual({
        x: 25,
        y: 35,
        width: 200,
        height: 100,
      });
      await app.client.waitUntilTextExists('html', 'Hello');
      const title = await app.client.getTitle();
      expect(title).toEqual('Test');
    });
  });
});
