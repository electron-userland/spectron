import { setupBrowser, WebdriverIOBoundFunctions } from '@testing-library/webdriverio';
import { queries } from '@testing-library/dom';
import { initSpectron, SpectronApp } from '@goosewobbler/spectron';

describe('application loading', () => {
  let screen: WebdriverIOBoundFunctions<typeof queries>;
  let app: SpectronApp;

  before(async () => {
    app = await initSpectron();
    screen = setupBrowser(app.client);
  });

  describe('App', () => {
    afterEach(() => {
      console.log('afterEach');
      // await app.mainProcess.exit(0);
    });

    it('should determine when an element is in the document', async () => {
      await app.client.keys(['y', 'o']);
      expect(await (await screen.getByTestId('keypress-count')).getText()).toEqual('YO');
    });

    it('should reset state for each test', async () => {
      expect(await (await screen.getByTestId('keypress-count')).getText()).toEqual('');
    });
  });

  describe('when the make larger button is clicked', () => {
    it('increases the window height and width by 10 pixels', async () => {
      await app.client.waitUntilWindowLoaded();
      let bounds = (await app.browserWindow.getBounds()) as { width: number; height: number };
      expect(bounds.width).toEqual(200);
      expect(bounds.height).toEqual(300);
      const elem = await app.client.$('.make-bigger');
      await elem.click();
      bounds = (await app.browserWindow.getBounds()) as { width: number; height: number };
      expect(bounds.width).toEqual(210);
      expect(bounds.height).toEqual(310);
    });
  });

  describe('when the make smaller button is clicked', () => {
    it('decreases the window height and width by 10 pixels', async () => {
      await app.client.waitUntilWindowLoaded();
      let bounds = (await app.browserWindow.getBounds()) as { width: number; height: number };
      expect(bounds.width).toEqual(210);
      expect(bounds.height).toEqual(310);
      const elem = await app.client.$('.make-smaller');
      await elem.click();
      bounds = (await app.browserWindow.getBounds()) as { width: number; height: number };
      expect(bounds.width).toEqual(200);
      expect(bounds.height).toEqual(300);
    });
  });
});
