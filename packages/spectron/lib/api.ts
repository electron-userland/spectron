import { SpectronClient } from './application';
import { LooseObject } from '../../../common/types';

type ApiPlaceholdersObj = {
  [Key: string]: {
    [Key: string]: string;
  };
};

type WebDriverClient = SpectronClient;

export type SpectronWindowObj = {
  [Key: string]: {
    getApiKeys: () => Promise<string[]>;
    invoke: (funcName: string, ...args: any) => Promise<unknown>;
  };
};

declare global {
  interface Window {
    spectron?: SpectronWindowObj;
  }
}

export type ApiName = 'browserWindow' | 'webContents' | 'app' | 'mainProcess' | 'rendererProcess';

export type ApiNames = ApiName[];

// function transformObject(input, output, callback) {
//   Object.keys(input).forEach((name) => {
//     const value = input[name];
//     if (typeof value === 'object') {
//       output[name] = transformObject(value, {}, callback);
//     } else {
//       output[name] = callback(value, input);
//     }
//   });
//   return output;
// }
async function createApiPlaceholders(apiNames: ApiNames, done: Function) {
  const api: ApiPlaceholdersObj = {};

  async function addPlaceholders(nameSpace: string) {
    const apiKeys = await (window.spectron as SpectronWindowObj)[nameSpace].getApiKeys();
    apiKeys.forEach((key) => {
      api[nameSpace][key] = `spectron.${nameSpace}.${key}`;
    });
  }

  if (window.spectron === undefined) {
    throw new Error('ContextBridge not available for retrieval of api keys');
  }

  apiNames.forEach(async (apiName) => {
    api[apiName] = {};
    await addPlaceholders(apiName);
  });

  done(api);
}

async function loadApi(webDriverClient: WebDriverClient, apiNames: ApiNames): Promise<ApiPlaceholdersObj> {
  return webDriverClient.executeAsync(createApiPlaceholders, apiNames);
}

type ApiObj = {
  [Key: string]: (...args: unknown[]) => Promise<unknown>;
};

function addApis(webdriverClient: WebDriverClient, nameSpace: string, placeholders: ApiPlaceholdersObj) {
  const apiObj: ApiObj = {};

  async function callApi(funcName: string, bridgePropName: string, args: unknown[], done: Function) {
    if (window.spectron === undefined) {
      throw new Error(`ContextBridge not available for invocation of ${bridgePropName}.${funcName}`);
    }
    done(await window.spectron[bridgePropName].invoke(funcName, ...args));
  }

  Object.keys(placeholders[nameSpace]).forEach((funcName) => {
    const commandName = placeholders[nameSpace][funcName];

    function executeApiCall(this: WebDriverClient, ...args: unknown[]) {
      return this.executeAsync(callApi, funcName, nameSpace, args);
    }

    webdriverClient.addCommand(commandName, executeApiCall);

    apiObj[funcName] = (...args: unknown[]) => webdriverClient[commandName](...args);
  });

  return apiObj;
}

// function addClientProperty(name, api, webDriverClient) {
//   const clientPrototype = Object.getPrototypeOf(webDriverClient);
//   Object.defineProperty(clientPrototype, name, {
//     get: () => transformObject(api[name], {}, (value) => value.bind(webDriverClient)),
//   });
// }

type ApisObj = {
  [Key in ApiName]: {
    [Key: string]: (...args: unknown[]) => Promise<unknown>;
  };
};

export const createApi = async (webDriverClient: WebDriverClient, apiNames: ApiNames): Promise<ApisObj> => {
  const placeholders = await loadApi(webDriverClient, apiNames);
  const apiObj: LooseObject = {};

  apiNames.forEach((apiName) => {
    apiObj[apiName] = addApis(webDriverClient, apiName, placeholders);
  });

  // apis.forEach((apiName) => {
  //   addClientProperty(apiName, apiObj, webDriverClient);
  // });

  return apiObj as ApisObj;
};
