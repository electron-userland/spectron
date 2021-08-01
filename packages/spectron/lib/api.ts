import { LooseObject, SpectronClient } from '../../../common/types';

type ApiPlaceholdersObj = {
  [Key: string]: {
    [Key: string]: string;
  };
};

type WebDriverClient = SpectronClient;

export type SpectronWindowObj = {
  [Key: string]: {
    getApiKeys: () => Promise<string[]>;
    invoke: (funcName: string, ...args: unknown[]) => Promise<unknown>;
  };
};

declare global {
  interface Window {
    spectron?: SpectronWindowObj;
  }
}

type ApiName = 'browserWindow' | 'webContents' | 'app' | 'mainProcess' | 'rendererProcess';

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
async function createApiPlaceholders(apiNames: ApiNames, done: (result: unknown) => void) {
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

  try {
    await Promise.all(
      apiNames.map(async (apiName: ApiName) => {
        api[apiName] = {};
        await addPlaceholders(apiName);
      }),
    );
  } catch (error) {
    throw new Error(`Error creating placeholders: ${(error as Error).message}`);
  }

  done(api);
}

type WebdriverClientFunc = (this: WebDriverClient, ...args: unknown[]) => Promise<unknown>;

async function loadApi(webDriverClient: WebDriverClient, apiNames: ApiNames): Promise<ApiPlaceholdersObj> {
  return (webDriverClient.executeAsync as WebdriverClientFunc)(
    createApiPlaceholders,
    apiNames,
  ) as Promise<ApiPlaceholdersObj>;
}

type ApiObj = {
  [Key: string]: (...args: unknown[]) => Promise<unknown>;
};

async function addApis(webdriverClient: WebDriverClient, nameSpace: string, placeholders: ApiPlaceholdersObj) {
  const apiObj: ApiObj = {};

  async function callApi(funcName: string, bridgePropName: string, args: unknown[], done: (result: unknown) => void) {
    if (window.spectron === undefined) {
      throw new Error(`ContextBridge not available for invocation of ${bridgePropName}.${funcName}`);
    }
    done(await window.spectron[bridgePropName].invoke(funcName, ...args));
  }

  try {
    await Promise.all(
      Object.keys(placeholders[nameSpace]).map(async (funcName) => {
        const commandName = placeholders[nameSpace][funcName];

        function executeApiCall(this: WebDriverClient, ...args: unknown[]) {
          return (this.executeAsync as WebdriverClientFunc)(callApi, funcName, nameSpace, args);
        }

        await webdriverClient.addCommand(commandName, executeApiCall);

        apiObj[funcName] = (...args: unknown[]) =>
          (webdriverClient[commandName] as WebdriverClientFunc).apply(webdriverClient, args);
      }),
    );
  } catch (error) {
    throw new Error(`Error adding API functions to ${nameSpace}: ${(error as Error).message}`);
  }

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

  try {
    await Promise.all(
      apiNames.map(async (apiName: ApiName) => {
        apiObj[apiName] = await addApis(webDriverClient, apiName, placeholders);
      }),
    );
  } catch (error) {
    throw new Error(`Error replacing placeholders with API functions: ${(error as Error).message}`);
  }

  // apis.forEach((apiName) => {
  //   addClientProperty(apiName, apiObj, webDriverClient);
  // });

  return apiObj as ApisObj;
};
