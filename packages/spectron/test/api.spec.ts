import { anyFunction, mock, MockProxy } from 'jest-mock-extended';
import { SpectronClient } from '~/common/types';
import { createApi, SpectronWindowObj } from '../lib/api';

let mockWebDriverClient: MockProxy<SpectronClient>;
let mockApiPlaceholders: {};

beforeEach(() => {
  mockApiPlaceholders = {
    browserWindow: {
      mockFn1: `spectron.browserWindow.mockFn1`,
      mockFn2: `spectron.browserWindow.mockFn2`,
      mockFn3: `spectron.browserWindow.mockFn3`,
    },
    webContents: {
      mockFn1: `spectron.webContents.mockFn1`,
      mockFn2: `spectron.webContents.mockFn2`,
      mockFn3: `spectron.webContents.mockFn3`,
    },
    app: {
      mockFn1: `spectron.app.mockFn1`,
      mockFn2: `spectron.app.mockFn2`,
      mockFn3: `spectron.app.mockFn3`,
    },
  };
  mockWebDriverClient = mock<SpectronClient>();
  mockWebDriverClient.addCommand.mockImplementation((commandName: string, func: unknown): Promise<void> => {
    mockWebDriverClient[commandName] = (...args: unknown[]) => (func as Function).bind(mockWebDriverClient)(...args);
    return Promise.resolve();
  });
  mockWebDriverClient.executeAsync.mockImplementation(() => Promise.resolve(mockApiPlaceholders));
  window.spectron = {
    browserWindow: {
      getApiKeys: jest.fn().mockReturnValue(['mockFn1', 'mockFn2', 'mockFn3']),
      invoke: jest.fn().mockImplementation((...args) => Promise.resolve(['browserWindow invoke called with', args])),
    },
    webContents: {
      getApiKeys: jest.fn().mockReturnValue(['mockFn1', 'mockFn2', 'mockFn3']),
      invoke: jest.fn().mockImplementation((...args) => Promise.resolve(['webContents invoke called with', args])),
    },
    app: {
      getApiKeys: jest.fn().mockReturnValue(['mockFn1', 'mockFn2', 'mockFn3']),
      invoke: jest.fn().mockImplementation((...args) => Promise.resolve(['app invoke called with', args])),
    },
  };
});

async function mockWebDriverRunExecuteAsync(callIndex: number, ...args: unknown[]) {
  const funcsToExec = mockWebDriverClient.executeAsync.mock.calls.slice(callIndex).map((call: Function[]) => call[0]);
  const resultCallback = jest.fn();
  await (funcsToExec[0] as Function)(...args, resultCallback);
  return resultCallback;
}

it('should return the expected interface', async () => {
  const api = await createApi(mockWebDriverClient, ['browserWindow', 'webContents', 'app']);
  expect(api).toEqual({
    browserWindow: {
      mockFn1: anyFunction(),
      mockFn2: anyFunction(),
      mockFn3: anyFunction(),
    },
    webContents: {
      mockFn1: anyFunction(),
      mockFn2: anyFunction(),
      mockFn3: anyFunction(),
    },
    app: {
      mockFn1: anyFunction(),
      mockFn2: anyFunction(),
      mockFn3: anyFunction(),
    },
  });
});

it('should add the expected client commands', async () => {
  await createApi(mockWebDriverClient, ['browserWindow', 'webContents', 'app']);
  expect(mockWebDriverClient.addCommand.mock.calls).toEqual([
    ['spectron.browserWindow.mockFn1', anyFunction()],
    ['spectron.browserWindow.mockFn2', anyFunction()],
    ['spectron.browserWindow.mockFn3', anyFunction()],
    ['spectron.webContents.mockFn1', anyFunction()],
    ['spectron.webContents.mockFn2', anyFunction()],
    ['spectron.webContents.mockFn3', anyFunction()],
    ['spectron.app.mockFn1', anyFunction()],
    ['spectron.app.mockFn2', anyFunction()],
    ['spectron.app.mockFn3', anyFunction()],
  ]);
});

it('should make the expected getApiKeys calls', async () => {
  await createApi(mockWebDriverClient, ['browserWindow', 'webContents', 'app']);
  await mockWebDriverRunExecuteAsync(0, ['browserWindow', 'webContents', 'app']);
  expect((window.spectron as SpectronWindowObj).browserWindow.getApiKeys).toHaveBeenCalledTimes(1);
  expect((window.spectron as SpectronWindowObj).webContents.getApiKeys).toHaveBeenCalledTimes(1);
  expect((window.spectron as SpectronWindowObj).app.getApiKeys).toHaveBeenCalledTimes(1);
});

it('should construct the api object with placeholders', async () => {
  await createApi(mockWebDriverClient, ['browserWindow', 'webContents', 'app']);
  const resultsCallback = await mockWebDriverRunExecuteAsync(0, ['browserWindow', 'webContents', 'app']);
  expect(resultsCallback.mock.calls[0]).toEqual([mockApiPlaceholders]);
});

it('should throw an error when when the Context Bridge is not available', async () => {
  window.spectron = undefined;
  await createApi(mockWebDriverClient, ['browserWindow', 'webContents', 'app']);
  await expect(mockWebDriverRunExecuteAsync(0, ['browserWindow', 'webContents', 'app'])).rejects.toThrowError(
    'ContextBridge not available for retrieval of api keys',
  );
});

describe('calling API functions', () => {
  beforeEach(async () => {
    const api = await createApi(mockWebDriverClient, ['browserWindow', 'webContents', 'app']);
    api.browserWindow.mockFn1('test');
    api.app.mockFn2('moar test');
    api.webContents.mockFn3('yet moar test');
  });

  it('should call executeAsync with the expected params', () => {
    expect(mockWebDriverClient.executeAsync.mock.calls.slice(1)).toEqual([
      [anyFunction(), 'mockFn1', 'browserWindow', ['test']],
      [anyFunction(), 'mockFn2', 'app', ['moar test']],
      [anyFunction(), 'mockFn3', 'webContents', ['yet moar test']],
    ]);
  });

  it('should throw an error when when the Context Bridge is not available', async () => {
    window.spectron = undefined;
    await expect(mockWebDriverRunExecuteAsync(1, 'mockFn1', 'browserWindow', ['test'])).rejects.toThrowError(
      'ContextBridge not available for invocation of browserWindow.mockFn1',
    );
  });

  it('should resolve with the expected result when the Context Bridge is available', async () => {
    const resultCallback1 = await mockWebDriverRunExecuteAsync(1, 'mockFn1', 'browserWindow', ['test']);
    expect((window.spectron as SpectronWindowObj).browserWindow.invoke).toHaveBeenCalledWith('mockFn1', 'test');
    expect(resultCallback1.mock.calls[0]).toEqual([['browserWindow invoke called with', ['mockFn1', 'test']]]);

    const resultCallback2 = await mockWebDriverRunExecuteAsync(1, 'mockFn2', 'app', ['moar test']);
    expect((window.spectron as SpectronWindowObj).app.invoke).toHaveBeenCalledWith('mockFn2', 'moar test');
    expect(resultCallback2.mock.calls[0]).toEqual([['app invoke called with', ['mockFn2', 'moar test']]]);

    const resultCallback3 = await mockWebDriverRunExecuteAsync(1, 'mockFn3', 'webContents', ['yet moar test']);
    expect((window.spectron as SpectronWindowObj).webContents.invoke).toHaveBeenCalledWith('mockFn3', 'yet moar test');
    expect(resultCallback3.mock.calls[0]).toEqual([['webContents invoke called with', ['mockFn3', 'yet moar test']]]);
  });
});
