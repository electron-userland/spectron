import { setupBrowser, WebdriverIOBoundFunctions } from '@testing-library/webdriverio';
import { queries } from '@testing-library/dom';
import { initSpectron } from '@goosewobbler/spectron';

describe('application loading', () => {
  let screen: WebdriverIOBoundFunctions<typeof queries>;

  before(async () => {
    const app = await initSpectron();
    screen = setupBrowser(app.client);
  });

  // Cover a few WebdriverIO expect matchers -  https://webdriver.io/docs/api/expect-webdriverio

  describe('DOM', () => {
    it('should determine when an element is in the document', async () => {
      expect(await screen.getByTestId('disabled-checkbox')).toExist();
    });

    it('should determine when an element is not in the document', async () => {
      expect(await screen.queryByTestId('not-there')).not.toExist();
    });

    it('should determine when an element is visible', async () => {
      expect(await screen.getByTestId('disabled-checkbox')).toBeDisplayed();
    });

    it('should determine when an element is not visible', async () => {
      expect(await screen.getByTestId('hidden-textarea')).not.toBeDisplayed();
    });
  });

  // describe('waitUntilTextExists', function () {
  //   it('resolves if the element (single occurrence) contains the given text - full text', async function () {
  //     await app.client.waitUntilTextExists('.occurrences-1', 'word1 word2');
  //   });

  //   it('resolves if the element (single occurrence) contains the given text - partial text', async function () {
  //     await app.client.waitUntilTextExists('.occurrences-1', 'word1');
  //   });

  //   it('resolves if the element (multiple occurrences) contains the given text - full text', async function () {
  //     await app.client.waitUntilTextExists('.occurrences-2', 'word3 word4');
  //   });

  //   it('resolves if the element (multiple occurrences) contains the given text - partial text', async function () {
  //     await app.client.waitUntilTextExists('.occurrences-2', 'word3');
  //   });

  //   it('rejects if the element is missing', async function () {
  //     await expect(
  //       app.client.waitUntilTextExists('#not-in-page', 'Hello', 50)
  //     ).to.be.rejectedWith(Error);
  //   });

  //   it('rejects if the element never contains the text', async function () {
  //     await expect(
  //       app.client.waitUntilTextExists('html', 'not on page', 50)
  //     ).to.be.rejectedWith(Error);
  //   });
  // });
});
