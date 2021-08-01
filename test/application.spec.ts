import { BrowserBase, setupBrowser, WebdriverIOBoundFunctions } from '@testing-library/webdriverio';
import { queries } from '@testing-library/dom';
import { initSpectron } from '@goosewobbler/spectron';
import { SpectronApp } from '../packages/spectron/lib/application';

describe('application loading', () => {
  let screen: WebdriverIOBoundFunctions<typeof queries>;
  let app: SpectronApp;

  describe('App', () => {
    beforeAll(async () => {
      app = await initSpectron({
        quitTimeout: 0,
      });
    });

    beforeEach(async () => {
      await app.client.waitUntilWindowLoaded();
      screen = setupBrowser(app.client as BrowserBase);
    }, 30000);

    afterEach(async () => {
      if (app) {
        await app.quit();
      }
    }, 30000);

    it('launches the application', async () => {
      const response = await app.client.getWindowHandles();
      expect(response.length).toEqual(1);

      const bounds = app.browserWindow.getBounds();
      expect(bounds.width).toEqual(200);
      expect(bounds.height).toEqual(300);
      await app.client.waitUntilTextExists('html', 'Hello');
      const title = await app.client.getTitle();
      expect(title).toEqual('Test');
      expect(screen.getByText('word1 word2')).toBeDefined();
    });
  });
});
