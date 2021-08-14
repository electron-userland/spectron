import { initSpectron } from '@goosewobbler/spectron';
import { SpectronApp } from '~/common/types';

describe('application loading', () => {
  let app: SpectronApp;

  before(async () => {
    app = await initSpectron();
  });

  describe('App', () => {
    it('should launch the application', async () => {
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

// representative function / prop access tests for electron APIs
// browserWindow, webContents, app, mainProcess, rendererProcess
// some tests can be copied from here https://github.com/electron-userland/spectron/blob/master/test/commands-test.js

// describe('webContents.savePage', function () {
//   it('saves the page to the specified path', function () {
//     const filePath = path.join(tempPath, 'page.html');
//     return app.webContents
//       .savePage(filePath, 'HTMLComplete')
//       .then(function () {
//         const html = fs.readFileSync(filePath, 'utf8');
//         expect(html).to.contain('<title>Test</title>');
//         expect(html).to.contain('Hello');
//       });
//   });

//   it('throws an error when the specified path is invalid', async function () {
//     await expect(
//       app.webContents.savePage(tempPath, 'MHTMLfds')
//     ).to.be.rejectedWith(Error);
//   });
// });

// describe('webContents.executeJavaScript', function () {
//   it('executes the given script and returns the result of its last statement (sync)', async function () {
//     const result = await app.webContents.executeJavaScript('1 + 2');
//     expect(result).to.equal(3);
//   });

//   it('executes the given script and returns the result of its last statement (async)', async function () {
//     const result = await app.webContents.executeJavaScript(`
//       new Promise(function(resolve){
//         setTimeout(function(){
//           resolve("ok")
//         }, 1000)
//       })`);
//     expect(result).to.equal('ok');
//   });
// });

// describe('webContents.sendInputEvent', function () {
//   it('triggers a keypress DOM event', async function () {
//     await app.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'A' });
//     const elem = await app.client.$('.keypress-count');
//     let text = await elem.getText();
//     expect(text).to.equal('A');
//     await app.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'B' });
//     text = await elem.getText();
//     expect(text).to.equal('B');
//   });
// });
