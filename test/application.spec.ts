import { BrowserBase, setupBrowser, WebdriverIOBoundFunctions } from '@testing-library/webdriverio';
import { queries } from '@testing-library/dom';
import { initSpectron } from '@goosewobbler/spectron';
import { SpectronApp } from '~/common/types';

describe('application loading', () => {
  let screen: WebdriverIOBoundFunctions<typeof queries>;
  let app: SpectronApp;

  before(async () => {
    app = await initSpectron();
    screen = setupBrowser(app.client as BrowserBase);
  });

  describe('App', () => {
    it('should launch the application', async () => {
      console.log('start of first test');
      const response = await app.client.getWindowHandles();
      expect(response.length).toEqual(1);

      const bounds = await app.browserWindow.getBounds();
      expect(bounds.width).toEqual(200);
      expect(bounds.height).toEqual(300);
      await app.client.waitUntilTextExists('html', 'Hello');
      const title = await app.client.getTitle();
      expect(title).toEqual('Test');
      console.log('end of first test');
    });
  });
});
