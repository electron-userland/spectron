import { BrowserBase, setupBrowser, WebdriverIOBoundFunctions } from '@testing-library/webdriverio';
import { queries } from '@testing-library/dom';
import { initSpectron } from '@goosewobbler/spectron';
import { SpectronApp } from '~/common/types';

describe('application loading', () => {
  let screen: WebdriverIOBoundFunctions<typeof queries>;
  let app: SpectronApp;
  let restarting = false;
  let quitting = false;

  before(async () => {
    console.log('beforeAllwut');
    app = await initSpectron({
      quitTimeout: 3000,
    });
  });

  after(async () => {
    console.log('afterall');
    if (app && !quitting) {
      console.log('quitting');
      quitting = true;
      await app.quit();
    }
  }, 30000);

  describe('App', () => {
    beforeEach(async () => {
      console.log('beforewut');
      restarting = false;
      // await app.client.waitUntilWindowLoaded();
      console.log('window loaded');
      screen = setupBrowser(app.client as BrowserBase);
    }, 30000);

    afterEach(async () => {
      console.log('afterwut');
      if (app && !restarting) {
        console.log('restarting');
        restarting = true;
        await app.electronApp.relaunch();
        await app.electronApp.whenReady();
        await app.electronApp.exit(0);
        await app.client.waitUntilWindowLoaded();
      }
    }, 30000);

    it('launches the application', async () => {
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

    it('should determine when an element is in the document', async () => {
      console.log('start of second test');
      await expect(await app.dom.isInTheDocument(await screen.getByTestId('disabled-checkbox'))).toEqual(true);
    });

    // it('should determine when an element is not in the document', async () => {
    //   expect(await app.dom.isInTheDocument(await screen.getByTestId('not-there'))).toEqual(false);
    // });

    // it('should determine when an element is visible', async () => {
    //   expect(await app.dom.isVisible(await screen.getByTestId('disabled-checkbox'))).toEqual(true);
    // });

    // it('should determine when an element is not visible', async () => {
    //   expect(await app.dom.isVisible(await screen.getByTestId('hidden-textarea'))).toEqual(false);
    // });
  });
});
