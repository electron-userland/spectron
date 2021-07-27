import { join } from 'path';
import { setupBrowser, WebdriverIOBoundFunctions } from '@testing-library/webdriverio';
import { queries } from '@testing-library/dom';
import { Application } from '@goosewobbler/spectron';

function getAppPath(distPath: string, appName: string) {
  enum SupportedPlatform {
    darwin = 'darwin',
    linux = 'linux',
    win32 = 'win32',
  }

  if (!Object.values(SupportedPlatform).includes(process.platform as SupportedPlatform)) {
    throw new Error('unsupported platform');
  }
  const pathMap = {
    darwin: `mac/${appName}.app/Contents/MacOS/${appName}`,
    linux: `linux-unpacked/${appName}`,
    win32: `win-unpacked/${appName}.exe`,
  };

  return `${distPath}/${pathMap[process.platform as SupportedPlatform]}`;
}

describe('application loading', () => {
  const appPath = getAppPath(join(process.cwd(), 'dist'), 'test');
  const app = new Application({
    path: appPath,
    chromeDriverLogPath: join(process.cwd(), 'chromeDriver.log'),
    webdriverLogPath: process.cwd(),
    quitTimeout: 0,
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
      if (app) {
        await app.mainProcess.abort();
        // await app.stop();
      }
    });

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
