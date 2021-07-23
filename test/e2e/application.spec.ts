import path from 'path';
import { setupBrowser, WebdriverIOBoundFunctions } from '@testing-library/webdriverio';
import { queries } from '@testing-library/dom';
import { Application } from '@goosewobbler/spectron';

function getAppPath(distPath: string, appName: string) {
  enum supportedPlatform {
    darwin = 'darwin',
    linux = 'linux',
    win32 = 'win32',
  }
  const supportedPlatforms = ['darwin', 'linux', 'win32'];
  if (!supportedPlatforms.includes(process.platform)) {
    throw new Error('unsupported platform');
  }
  const pathMap = {
    darwin: `mac/${appName}.app/Contents/MacOS/${appName}`,
    linux: `linux-unpacked/${appName}`,
    win32: `mac/${appName}.app/Contents/MacOS/${appName}`,
  };

  return `${distPath}/${pathMap[process.platform as supportedPlatform]}`;
}

describe('application loading', () => {
  const appPath = getAppPath(path.join(process.cwd(), 'dist'), 'test');
  const app = new Application({
    path: appPath,
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
