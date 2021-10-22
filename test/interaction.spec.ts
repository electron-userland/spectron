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
    it('should determine when an element is in the document', async () => {
      expect(await screen.getByTestId('disabled-checkbox')).toExist();
    });
  });

  describe('when the make larger button is clicked', function () {
    it('increases the window height and width by 10 pixels', async function () {
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

  //   describe('when the make smaller button is clicked', function () {
  //     it('decreases the window height and width by 10 pixels', async function () {
  //       await app.client.waitUntilWindowLoaded();
  //       await app.browserWindow.getBounds().should.eventually.have.property('width', 800);
  //       await app.browserWindow.getBounds().should.eventually.have.property('height', 400);
  //       const elem = await app.client.$('.btn-make-smaller');
  //       await elem.click();
  //       const bounds = await app.browserWindow.getBounds();
  //       bounds.should.have.property('width', 790);
  //       bounds.should.have.property('height', 390);
  //     });
  //   });

  //   describe('getWindowCount', function () {
  //     it('retrieves the window count', function () {
  //       return app.client.getWindowCount().should.eventually.equal(1);
  //     });
  //   });

  //   describe('waitUntilWindowLoaded()', function () {
  //     it('waits until the current window is loaded', async function () {
  //       await app.client.waitUntilWindowLoaded();
  //       return app.webContents.isLoading().should.eventually.be.false;
  //     });
  //   });
});
