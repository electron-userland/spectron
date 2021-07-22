/* global window */

const apis = ['browserWindow', 'webContents', 'app', 'mainProcess', 'rendererProcess'];

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
      const apiKeys = await window.spectron[nameSpace].getApiKeys();
      apiKeys.forEach((key) => {
        api[nameSpace][key] = `spectron.${nameSpace}.${key}`;
      });
    }

    if (window.spectron !== undefined) {
      apiNames.forEach(async (apiName) => {
        api[apiName] = {};
        await addPlaceholders(apiName);
      });
    }

    done(api);
  }, apis);
}

function addApis(webdriverClient, nameSpace, placeholders) {
  const apiObj = {};

  async function callApi(funcName, bridgePropName, args, done) {
    if (window.spectron === undefined) {
      done();
    }
    done(await window.spectron[bridgePropName].invoke(funcName, ...args));
  }

  Object.keys(placeholders[nameSpace]).forEach((funcName) => {
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
    const apiObj = {};

    apis.forEach((apiName) => {
      apiObj[apiName] = addApis(webDriverClient, apiName, placeholders);
    });

    apis.forEach((apiName) => {
      addClientProperty(apiName, apiObj, webDriverClient);
    });

    return apiObj;
  },
};
