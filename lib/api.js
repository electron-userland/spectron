/* global window */

function transformObject(input, output, callback) {
  Object.keys(input).forEach((name) => {
    const value = input[name];
    if (typeof value === 'object') {
      output[name] = transformObject(value, {}, callback);
    } else {
      output[name] = callback(value, input);
    }
  });
  return output;
}

async function loadApi(webDriverClient) {
  return webDriverClient.executeAsync(async (done) => {
    const api = {
      browserWindow: {},
      webContents: {},
      app: {},
    };

    async function addFunctionPlaceholders(nameSpace) {
      (await window.spectron[nameSpace].getFunctionNames()).forEach((funcName) => {
        api[nameSpace][funcName] = `${nameSpace}.${funcName}`;
      });
    }

    if (window.spectron !== undefined) {
      await addFunctionPlaceholders('browserWindow');
      await addFunctionPlaceholders('webContents');
      await addFunctionPlaceholders('app');
    }

    done(api);
  });
}

function createAsyncApis(webdriverClient) {
  function capturePage(rect) {
    return this.executeAsync(
      async (args, done) => {
        done(await window.spectron.browserWindow.invoke('capturePage', ...args));
      },
      [rect],
    ).then((image) => Buffer.from(image, 'base64'));
  }

  function executeJavaScript(code, useGesture) {
    return this.executeAsync(
      async (args, done) => {
        const result = await window.spectron.webContents.invoke('executeJavaScript', ...args);
        done(result);
      },
      [code, useGesture],
    );
  }

  function savePage(fullPath, saveType) {
    return this.executeAsync(
      async (args, done) => {
        await window.spectron.webContents.invoke('savePage', ...args);
        done();
      },
      [fullPath, saveType],
    ).then((rawError) => {
      if (rawError) {
        const error = new Error(rawError.message);
        if (rawError.name) {
          error.name = rawError.name;
        }
        throw error;
      }
    });
  }

  webdriverClient.addCommand('browserWindow.capturePage', capturePage);
  webdriverClient.addCommand('webContents.executeJavaScript', executeJavaScript);
  webdriverClient.addCommand('webContents.savePage', savePage);

  return {
    capturePage: (...args) => webdriverClient['browserWindow.capturePage'](...args),
    savePage: (...args) => webdriverClient['webContents.savePage'](...args),
    executeJavaScript: (...args) => webdriverClient['webContents.executeJavaScript'](...args),
  };
}

function addApis(webdriverClient, nameSpace, placeholders) {
  const asyncApis = ['browserWindow.capturePage', 'webContents.savePage', 'webContents.executeJavaScript'];
  const apiObj = {};

  async function callApi(funcName, bridgePropName, args, done) {
    if (window.spectron === undefined) {
      done();
    }
    done(await window.spectron[bridgePropName].invoke(funcName, ...args));
  }

  Object.keys(placeholders[nameSpace])
    .filter((funcName) => !asyncApis.includes(`${nameSpace}.${funcName}`))
    .forEach((funcName) => {
      const commandName = placeholders[nameSpace][funcName];

      function executeApiCall(...args) {
        return this.executeAsync(callApi, funcName, nameSpace, args);
      }

      webdriverClient.addCommand(commandName, executeApiCall);

      apiObj[funcName] = (...args) => webdriverClient[commandName](...args);
    });

  return apiObj;
}

function addClientProperty(name, api, webDriverClient) {
  const clientPrototype = Object.getPrototypeOf(webDriverClient);
  Object.defineProperty(clientPrototype, name, {
    get: () => transformObject(api[name], {}, (value) => value.bind(webDriverClient)),
  });
}

module.exports = {
  createApi: async (webDriverClient) => {
    const placeholders = await loadApi(webDriverClient);
    const browserWindow = addApis(webDriverClient, 'browserWindow', placeholders);
    const webContents = addApis(webDriverClient, 'webContents', placeholders);
    const app = addApis(webDriverClient, 'app', placeholders);
    const { capturePage, savePage, executeJavaScript } = createAsyncApis(webDriverClient);

    browserWindow.capturePage = capturePage;
    webContents.savePage = savePage;
    webContents.executeJavaScript = executeJavaScript;

    const api = {
      browserWindow,
      webContents,
      app,
    };

    addClientProperty('browserWindow', api, webDriverClient);
    addClientProperty('webContents', api, webDriverClient);
    addClientProperty('app', api, webDriverClient);

    return api;
  },
  transferPromiseness: (target, promise) => {
    function addProperties(source, moduleName) {
      const sourceModule = source[moduleName];
      if (!sourceModule) {
        return;
      }
      target[moduleName] = transformObject(sourceModule, {}, (value, parent) => value.bind(parent));
    }

    addProperties(promise, 'webContents');
    addProperties(promise, 'browserWindow');
  },
};
