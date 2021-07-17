function Api(app) {
  this.app = app;
}

Api.prototype.initialize = async function () {
  const { browserWindow, webContents } = await this.load();
  this.browserWindow = browserWindow;
  this.webContents = webContents;
  this.app.browserWindow = browserWindow;
  this.app.webContents = webContents;
  this.addBrowserWindowApis();
  this.addWebContentsApis();

  this.api = {
    browserWindow: this.browserWindow,
    webContents: this.webContents,
  };

  this.addClientProperty('browserWindow');
  this.addClientProperty('webContents');
};

Api.prototype.load = function () {
  const self = this;
  return this.app.client.executeAsync(async (done) => {
    const api = {
      browserWindow: {},
      webContents: {},
    };

    async function addFunctionPlaceholders(nameSpace) {
      (await window.spectron[nameSpace].getFunctionNames()).forEach((funcName) => {
        api[nameSpace][funcName] = `${nameSpace}.${funcName}`;
      });
    }

    if (window.spectron !== undefined) {
      await addFunctionPlaceholders('browserWindow');
      await addFunctionPlaceholders('webContents');
    }

    done(api);
  });
};

Api.prototype.addClientProperty = function (name) {
  const self = this;

  const clientPrototype = Object.getPrototypeOf(self.app.client);
  Object.defineProperty(clientPrototype, name, {
    get: function () {
      const client = this;
      return transformObject(self.api[name], {}, function (value) {
        return client[value].bind(client);
      });
    },
  });
};

Api.prototype.addBrowserWindowApis = function () {
  const app = this.app;
  const browserWindow = this.browserWindow;

  app.browserWindow = {};

  const asyncApis = ['browserWindow.capturePage'];

  async function callBrowserWindowApi(name, args, done) {
    if (window.spectron === undefined) {
      done();
    }
    done(await window.spectron.browserWindow.invoke(name, ...args));
  }

  Object.keys(browserWindow)
    .filter((funcName) => !asyncApis.includes(`browserWindow.${funcName}`))
    .forEach((funcName) => {
      const commandName = browserWindow[funcName];

      // app.client.addCommand(commandName, function (...args) {
      //   return app.client.executeAsync(callBrowserWindowApi, funcName, Array.from(args));
      // });
      app.client.addCommand(commandName, function () {
        const args = Array.prototype.slice.call(arguments);

        return this.executeAsync(callBrowserWindowApi, funcName, args);
      });

      // app.browserWindow[funcName] = (...args) => app.client[commandName].apply(app.client, args);
      app.browserWindow[funcName] = function () {
        return app.client[commandName].apply(app.client, arguments);
      };
    });

  app.client.addCommand('browserWindow.capturePage', function (rect) {
    return this.executeAsync(async function (rect, done) {
      const args = [];
      if (rect != null) args.push(rect);
      done(await window.spectron.browserWindow.invoke('capturePage', ...args));
    }, rect).then(function (image) {
      return Buffer.from(image, 'base64');
    });
  });

  app.browserWindow.capturePage = function () {
    return app.client['browserWindow.capturePage'].apply(app.client, arguments);
  };
};

Api.prototype.addWebContentsApis = function () {
  const app = this.app;
  const webContents = this.webContents;
  app.webContents = {};

  const asyncApis = ['webContents.savePage', 'webContents.executeJavaScript'];

  async function callWebContentsApi(name, args, done) {
    if (window.spectron === undefined) {
      done();
    }
    done(await window.spectron.webContents.invoke(name, ...args));
  }

  Object.keys(webContents)
    .filter((funcName) => !asyncApis.includes(`browserWindow.${funcName}`))
    .forEach(function (name) {
      const commandName = webContents[name];

      app.client.addCommand(commandName, function () {
        const args = Array.prototype.slice.call(arguments);

        return this.executeAsync(callWebContentsApi, name, args);
      });

      app.webContents[name] = function () {
        return app.client[commandName].apply(app.client, arguments);
      };
    });

  this.addSavePageSupport();
  this.addExecuteJavaScriptSupport();
};

Api.prototype.addSavePageSupport = function () {
  const app = this.app;

  app.client.addCommand('webContents.savePage', function (fullPath, saveType) {
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

  app.webContents.savePage = function () {
    return app.client['webContents.savePage'].apply(app.client, arguments);
  };
};

Api.prototype.addExecuteJavaScriptSupport = function () {
  const app = this.app;

  app.client.addCommand('webContents.executeJavaScript', function (code, useGesture) {
    return this.executeAsync(
      async function (code, useGesture, done) {
        const result = await window.spectron.webContents.invoke('executeJavaScript', code, useGesture);
        done(result);
      },
      code,
      useGesture,
    );
  });

  app.webContents.executeJavaScript = function () {
    return app.client['webContents.executeJavaScript'].apply(app.client, arguments);
  };
};

Api.prototype.transferPromiseness = function (target, promise) {
  const addProperties = function (source, target, moduleName) {
    const sourceModule = source[moduleName];
    if (!sourceModule) return;
    target[moduleName] = transformObject(sourceModule, {}, function (value, parent) {
      return value.bind(parent);
    });
  };

  addProperties(promise, target, 'webContents');
  addProperties(promise, target, 'browserWindow');
};

Api.prototype.logApi = function () {
  const fs = require('fs');
  const path = require('path');
  const json = JSON.stringify(this.api, null, 2);
  fs.writeFileSync(path.join(__dirname, 'api.json'), json);
};

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

module.exports = Api;
