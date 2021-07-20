function transformObject(input, output, callback) {
  Object.keys(input).forEach(function (name) {
    const value = input[name];
    if (typeof value === 'object') {
      output[name] = {};
      transformObject(value, output[name], callback);
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
  webdriverClient.addCommand('browserWindow.capturePage', function (rect) {
    return this.executeAsync(async function (rect, done) {
      const args = [];
      if (rect != null) args.push(rect);
      done(await window.spectron.browserWindow.invoke('capturePage', ...args));
    }, rect).then(function (image) {
      return Buffer.from(image, 'base64');
    });
  });

  webdriverClient.addCommand('webContents.executeJavaScript', function (code, useGesture) {
    return this.executeAsync(
      async function (code, useGesture, done) {
        const result = await window.spectron.webContents.invoke('executeJavaScript', code, useGesture);
        done(result);
      },
      code,
      useGesture,
    );
  });

  webdriverClient.addCommand('webContents.savePage', function (fullPath, saveType) {
    return this.executeAsync(
      async function (fullPath, saveType, done) {
        await window.spectron.webContents.invoke('savePage', fullPath, saveType);
        done();
      },
      fullPath,
      saveType,
    ).then(function (rawError) {
      if (rawError) {
        const error = new Error(rawError.message);
        if (rawError.name) error.name = rawError.name;
        throw error;
      }
    });
  });

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

      webdriverClient.addCommand(commandName, function (...args) {
        return this.executeAsync(callApi, funcName, nameSpace, args);
      });

      apiObj[funcName] = function () {
        return webdriverClient[commandName].apply(webdriverClient, arguments);
      };
    });

  return apiObj;
}

function addClientProperty(name, api, webDriverClient) {
  const clientPrototype = Object.getPrototypeOf(webDriverClient);
  Object.defineProperty(clientPrototype, name, {
    get: function () {
      transformObject(api[name], {}, function (value) {
        return value.bind(webDriverClient);
      });
    },
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
    const addProperties = function (source, target, moduleName) {
      const sourceModule = source[moduleName];
      if (!sourceModule) return;
      target[moduleName] = transformObject(sourceModule, {}, function (value, parent) {
        return value.bind(parent);
      });
    };

    addProperties(promise, target, 'webContents');
    addProperties(promise, target, 'browserWindow');
  },
};
