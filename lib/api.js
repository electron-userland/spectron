const apiCache = {};

class Api {
  constructor(app, requireName) {
    this.app = app;
    this.requireName = requireName;
  }

  async initialize() {
    const api = await this.load();
    return this.addApiCommands(api);
  }

  addApiCommands({ electron, browserWindow, webContents, rendererProcess }) {
    if (!this.nodeIntegration) return;

    this.addRenderProcessApis(electron);
    this.addMainProcessApis(electron.remote);
    this.addBrowserWindowApis(browserWindow);
    this.addWebContentsApis(webContents);
    this.addProcessApis(rendererProcess);

    this.api = {
      browserWindow: browserWindow,
      electron: electron,
      rendererProcess: rendererProcess,
      webContents: webContents
    };

    this.addClientProperties();
  }

  async load() {
    const nodeIntegration = await this.isNodeIntegrationEnabled();
    this.nodeIntegration = nodeIntegration;
    if (!nodeIntegration) {
      return {
        electron: { remote: {} },
        browserWindow: {},
        webContents: {},
        rendererProcess: {}
      };
    }

    const version = await this.getVersion();
    let api = apiCache[version];
    if (api) return api;

    api = await this.loadApi();
    if (version) apiCache[version] = api;
    return api;
  }

  isNodeIntegrationEnabled() {
    return this.app.client.execute(
      (requireName) => typeof window[requireName] === 'function',
      this.requireName
    );
  }

  getVersion() {
    return this.app.client.execute((requireName) => {
      const process = window[requireName]('process');
      if (process != null && process.versions != null) {
        return process.versions.electron;
      }
    }, this.requireName);
  }

  loadApi() {
    return this.app.client.execute((requireName) => {
      if (typeof window[requireName] !== 'function') {
        throw new Error(
          `Could not find global require method with name: ${requireName}`
        );
      }
      const electron = window[requireName]('electron');
      const process = window[requireName]('process');

      const api = {
        browserWindow: {},
        electron: {},
        rendererProcess: {},
        webContents: {}
      };

      function ignoreModule(moduleName) {
        switch (moduleName) {
          case 'CallbacksRegistry':
          case 'deprecate':
          case 'deprecations':
          case 'hideInternalModules':
          case 'Tray':
            return true;
          case 'inAppPurchase':
            return process.platform !== 'darwin';
        }
        return false;
      }

      function isRemoteFunction(name) {
        switch (name) {
          case 'BrowserWindow':
          case 'Menu':
          case 'MenuItem':
            return false;
        }
        return typeof electron.remote[name] === 'function';
      }

      function ignoreApi(apiName) {
        switch (apiName) {
          case 'prototype':
            return true;
          default:
            return apiName[0] === '_';
        }
      }

      function addModule(parent, parentName, name, api) {
        api[name] = {};
        for (const key in parent[name]) {
          if (ignoreApi(key)) continue;
          api[name][key] = `${parentName}.${name}.${key}`;
        }
      }

      function addRenderProcessModules() {
        Object.getOwnPropertyNames(electron).forEach((key) => {
          if (ignoreModule(key)) return;
          if (key === 'remote') return;
          addModule(electron, 'electron', key, api.electron);
        });
      }

      function addMainProcessModules() {
        api.electron.remote = {};
        Object.getOwnPropertyNames(electron.remote).forEach((key) => {
          if (ignoreModule(key)) return;
          if (isRemoteFunction(key)) {
            api.electron.remote[key] = `electron.remote.${key}`;
          } else {
            addModule(
              electron.remote,
              'electron.remote',
              key,
              api.electron.remote
            );
          }
        });
        addModule(
          electron.remote,
          'electron.remote',
          'process',
          api.electron.remote
        );
      }

      function addBrowserWindow() {
        const currentWindow = electron.remote.getCurrentWindow();
        for (const name in currentWindow) {
          if (ignoreApi(name)) continue;
          const value = currentWindow[name];
          if (typeof value === 'function') {
            api.browserWindow[name] = `browserWindow.${name}`;
          }
        }
      }

      function addWebContents() {
        const webContents = electron.remote.getCurrentWebContents();
        for (const name in webContents) {
          if (ignoreApi(name)) continue;
          const value = webContents[name];
          if (typeof value === 'function') {
            api.webContents[name] = `webContents.${name}`;
          }
        }
      }

      function addProcess() {
        if (typeof process !== 'object') return;

        for (const name in process) {
          if (ignoreApi(name)) continue;
          api.rendererProcess[name] = `process.${name}`;
        }
      }

      addRenderProcessModules();
      addMainProcessModules();
      addBrowserWindow();
      addWebContents();
      addProcess();

      return api;
    }, this.requireName);
  }

  addClientProperty(name) {
    const self = this;

    const clientPrototype = Object.getPrototypeOf(self.app.client);
    Object.defineProperty(clientPrototype, name, {
      get() {
        const client = this;
        return transformObject(self.api[name], {}, (value) =>
          client[value].bind(client)
        );
      }
    });
  }

  addClientProperties() {
    this.addClientProperty('electron');
    this.addClientProperty('browserWindow');
    this.addClientProperty('webContents');
    this.addClientProperty('rendererProcess');

    Object.defineProperty(
      Object.getPrototypeOf(this.app.client),
      'mainProcess',
      {
        get() {
          return this.electron.remote.process;
        }
      }
    );
  }

  addRenderProcessApis(api) {
    const app = this.app;
    const self = this;
    const electron = {};
    app.electron = electron;

    Object.keys(api).forEach((moduleName) => {
      if (moduleName === 'remote') return;
      electron[moduleName] = {};
      const moduleApi = api[moduleName];

      Object.keys(moduleApi).forEach((key) => {
        const commandName = moduleApi[key];

        app.client.addCommand(commandName, function () {
          const args = Array.prototype.slice.call(arguments);
          return this.execute(
            callRenderApi,
            moduleName,
            key,
            args,
            self.requireName
          );
        });

        electron[moduleName][key] = function (...args) {
          return app.client[commandName].apply(app.client, args);
        };
      });
    });
  }

  addMainProcessApis(api) {
    const app = this.app;
    const self = this;
    const remote = {};
    app.electron.remote = remote;

    Object.keys(api)
      .filter((propertyName) => typeof api[propertyName] === 'string')
      .forEach((name) => {
        const commandName = api[name];

        app.client.addCommand(commandName, function () {
          const args = Array.prototype.slice.call(arguments);
          return this.execute(callMainApi, '', name, args, self.requireName);
        });

        remote[name] = function (...args) {
          return app.client[commandName].apply(app.client, args);
        };
      });

    Object.keys(api)
      .filter((moduleName) => typeof api[moduleName] === 'object')
      .forEach((moduleName) => {
        remote[moduleName] = {};
        const moduleApi = api[moduleName];

        Object.keys(moduleApi).forEach((key) => {
          const commandName = moduleApi[key];

          app.client.addCommand(commandName, function () {
            const args = Array.prototype.slice.call(arguments);
            return this.execute(
              callMainApi,
              moduleName,
              key,
              args,
              self.requireName
            );
          });

          remote[moduleName][key] = function (...args) {
            return app.client[commandName].apply(app.client, args);
          };
        });
      });
  }

  addBrowserWindowApis(api) {
    const app = this.app;
    const self = this;
    app.browserWindow = {};

    const asyncApis = {
      'browserWindow.capturePage': true
    };

    Object.keys(api)
      .filter(
        (name) => !Object.prototype.hasOwnProperty.call(asyncApis, api[name])
      )
      .forEach((name) => {
        const commandName = api[name];

        app.client.addCommand(commandName, function () {
          const args = Array.prototype.slice.call(arguments);
          return this.execute(
            callBrowserWindowApi,
            name,
            args,
            self.requireName
          );
        });

        app.browserWindow[name] = function (...args) {
          return app.client[commandName].apply(app.client, args);
        };
      });

    this.addCapturePageSupport();
  }

  addCapturePageSupport() {
    const app = this.app;
    const self = this;

    app.client.addCommand('browserWindow.capturePage', function (rect) {
      return this.executeAsync(
        async (rect, requireName, done) => {
          const args = [];
          if (rect != null) args.push(rect);
          const browserWindow = window[requireName](
            'electron'
          ).remote.getCurrentWindow();
          const image = await browserWindow.capturePage.apply(
            browserWindow,
            args
          );
          if (image != null) {
            done(image.toPNG().toString('base64'));
          } else {
            done(image);
          }
        },
        rect,
        self.requireName
      ).then((image) => Buffer.from(image, 'base64'));
    });

    app.browserWindow.capturePage = function (...args) {
      return app.client['browserWindow.capturePage'].apply(app.client, args);
    };
  }

  addWebContentsApis(api) {
    const app = this.app;
    const self = this;
    app.webContents = {};

    const asyncApis = {
      'webContents.savePage': true,
      'webContents.executeJavaScript': true
    };

    Object.keys(api)
      .filter(
        (name) => !Object.prototype.hasOwnProperty.call(asyncApis, api[name])
      )
      .forEach((name) => {
        const commandName = api[name];

        app.client.addCommand(commandName, function () {
          const args = Array.prototype.slice.call(arguments);
          return this.execute(callWebContentsApi, name, args, self.requireName);
        });

        app.webContents[name] = function (...args) {
          return app.client[commandName].apply(app.client, args);
        };
      });

    this.addSavePageSupport();
    this.addExecuteJavaScriptSupport();
  }

  addSavePageSupport() {
    const app = this.app;
    const self = this;

    app.client.addCommand(
      'webContents.savePage',
      function (fullPath, saveType) {
        return this.executeAsync(
          async (fullPath, saveType, requireName, done) => {
            const webContents = window[requireName](
              'electron'
            ).remote.getCurrentWebContents();
            await webContents.savePage(fullPath, saveType);
            done();
          },
          fullPath,
          saveType,
          self.requireName
        ).then((rawError) => {
          if (rawError) {
            const error = new Error(rawError.message);
            if (rawError.name) error.name = rawError.name;
            throw error;
          }
        });
      }
    );

    app.webContents.savePage = function (...args) {
      return app.client['webContents.savePage'].apply(app.client, args);
    };
  }

  addExecuteJavaScriptSupport() {
    const app = this.app;
    const self = this;

    app.client.addCommand(
      'webContents.executeJavaScript',
      function (code, useGesture) {
        return this.executeAsync(
          async (code, useGesture, requireName, done) => {
            const webContents = window[requireName](
              'electron'
            ).remote.getCurrentWebContents();
            const result = await webContents.executeJavaScript(
              code,
              useGesture
            );
            done(result);
          },
          code,
          useGesture,
          self.requireName
        );
      }
    );

    app.webContents.executeJavaScript = function (...args) {
      return app.client['webContents.executeJavaScript'].apply(
        app.client,
        args
      );
    };
  }

  addProcessApis(api) {
    const app = this.app;
    app.rendererProcess = {};

    Object.keys(api).forEach((name) => {
      const commandName = api[name];

      app.client.addCommand(commandName, function () {
        const args = Array.prototype.slice.call(arguments);
        return this.execute(callProcessApi, name, args);
      });

      app.rendererProcess[name] = function (...args) {
        return app.client[commandName].apply(app.client, args);
      };
    });

    app.mainProcess = app.electron.remote.process;
  }

  transferPromiseness(target, promise) {
    if (!this.nodeIntegration) return;

    const addProperties = (source, target, moduleName) => {
      const sourceModule = source[moduleName];
      if (!sourceModule) return;
      target[moduleName] = transformObject(sourceModule, {}, (value, parent) =>
        value.bind(parent)
      );
    };

    addProperties(promise, target, 'webContents');
    addProperties(promise, target, 'browserWindow');
    addProperties(promise, target, 'electron');
    addProperties(promise, target, 'mainProcess');
    addProperties(promise, target, 'rendererProcess');
  }

  logApi() {
    const fs = require('fs');
    const path = require('path');
    const json = JSON.stringify(this.api, null, 2);
    fs.writeFileSync(path.join(__dirname, 'api.json'), json);
  }
}

function transformObject(input, output, callback) {
  Object.keys(input).forEach((name) => {
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

function callRenderApi(moduleName, api, args, requireName) {
  const module = window[requireName]('electron')[moduleName];
  if (typeof module[api] === 'function') {
    return module[api].apply(module, args);
  } else {
    return module[api];
  }
}

function callMainApi(moduleName, api, args, requireName) {
  let module = window[requireName]('electron').remote;
  if (moduleName) {
    module = module[moduleName];
  }
  if (typeof module[api] === 'function') {
    return module[api].apply(module, args);
  } else {
    return module[api];
  }
}

function callWebContentsApi(name, args, requireName) {
  const webContents = window[requireName](
    'electron'
  ).remote.getCurrentWebContents();
  return webContents[name].apply(webContents, args);
}

function callBrowserWindowApi(name, args, requireName) {
  const browserWindow = window[requireName](
    'electron'
  ).remote.getCurrentWindow();
  return browserWindow[name].apply(browserWindow, args);
}

function callProcessApi(name, args) {
  if (typeof process[name] === 'function') {
    return process[name].apply(process, args);
  } else {
    return process[name];
  }
}

module.exports = Api;
