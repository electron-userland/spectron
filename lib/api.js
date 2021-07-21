/* global window */

const apis = ['browserWindow', 'webContents', 'app', 'process'];

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
  return webDriverClient.executeAsync(async (apiNames, done) => {
    const api = {};

    async function addPlaceholders(nameSpace) {
      const funcNames = await window.spectron[nameSpace].getFunctionNames();
      funcNames.forEach((funcName) => {
        api[nameSpace][funcName] = `spectron.${nameSpace}.${funcName}`;
      });
    }

    async function addProperties(nameSpace) {
      const properties = await window.spectron[nameSpace].getProperties();
      Object.keys(properties).forEach((propName) => {
        api[nameSpace][propName] = properties[propName];
      });
    }

    if (window.spectron !== undefined) {
      apiNames.forEach(async (apiName) => {
        api[apiName] = {};
        if (window.spectron[apiName].getFunctionNames) {
          await addPlaceholders(apiName);
        }
        if (window.spectron[apiName].getProperties) {
          await addProperties(apiName);
        }
      });
    }

    done(api);
  }, apis);
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
  const asyncApis = [
    'spectron.browserWindow.capturePage',
    'spectron.webContents.savePage',
    'spectron.webContents.executeJavaScript',
  ];
  const apiObj = {};

  async function callApi(funcName, bridgePropName, args, done) {
    if (window.spectron === undefined) {
      done();
    }
    done(await window.spectron[bridgePropName].invoke(funcName, ...args));
  }

  // functions
  Object.keys(placeholders[nameSpace])
    .filter((propName) => placeholders[nameSpace][propName].includes('spectron.'))
    .filter((funcName) => !asyncApis.includes(`${nameSpace}.${funcName}`))
    .forEach((funcName) => {
      const commandName = placeholders[nameSpace][funcName];

      function executeApiCall(...args) {
        return this.executeAsync(callApi, funcName, nameSpace, args);
      }

      webdriverClient.addCommand(commandName, executeApiCall);

      apiObj[funcName] = (...args) => webdriverClient[commandName](...args);
    });

  // properties
  Object.keys(placeholders[nameSpace])
    .filter((propName) => !placeholders[nameSpace][propName].includes('spectron.'))
    .forEach((propName) => {
      apiObj[propName] = placeholders[nameSpace][propName];
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
    const apiObj = {};

    apis.forEach((apiName) => {
      apiObj[apiName] = addApis(webDriverClient, apiName, placeholders);
    });

    const { capturePage, savePage, executeJavaScript } = createAsyncApis(webDriverClient);
    apiObj.browserWindow.capturePage = capturePage;
    apiObj.webContents.savePage = savePage;
    apiObj.webContents.executeJavaScript = executeJavaScript;

    apis.forEach((apiName) => {
      addClientProperty(apiName, apiObj, webDriverClient);
    });

    return apiObj;
  },
  transferPromiseness: (target, promise) => {
    function addProperties(source, moduleName) {
      const sourceModule = source[moduleName];
      if (!sourceModule) {
        return;
      }
      target[moduleName] = transformObject(sourceModule, {}, (value, parent) => value.bind(parent));
    }

    apis.forEach((apiName) => {
      addProperties(promise, apiName);
    });
  },
};
