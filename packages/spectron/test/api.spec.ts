import { anyFunction, mock, MockProxy } from 'jest-mock-extended';
import { createApi, SpectronClient, SpectronWindowObj } from '../lib/api';

let mockWebDriverClient: MockProxy<SpectronClient>;
let mockApiPlaceholders: {};

beforeEach(() => {
  mockApiPlaceholders = {
    mockApi1: {
      mockFn1: `spectron.mockApi1.mockFn1`,
      mockFn2: `spectron.mockApi1.mockFn2`,
      mockFn3: `spectron.mockApi1.mockFn3`,
    },
    mockApi2: {
      mockFn1: `spectron.mockApi2.mockFn1`,
      mockFn2: `spectron.mockApi2.mockFn2`,
      mockFn3: `spectron.mockApi2.mockFn3`,
    },
    mockApi3: {
      mockFn1: `spectron.mockApi3.mockFn1`,
      mockFn2: `spectron.mockApi3.mockFn2`,
      mockFn3: `spectron.mockApi3.mockFn3`,
    },
  };
  mockWebDriverClient = mock<SpectronClient>();
  mockWebDriverClient.addCommand.mockImplementation((commandName: string, func: unknown) => {
    mockWebDriverClient[commandName] = (...args: unknown[]) => (func as Function).bind(mockWebDriverClient)(...args);
  });
  mockWebDriverClient.executeAsync.mockImplementation(() => Promise.resolve(mockApiPlaceholders));
  window.spectron = {
    mockApi1: {
      getApiKeys: jest.fn().mockReturnValue(['mockFn1', 'mockFn2', 'mockFn3']),
      invoke: jest.fn().mockImplementation((...args) => Promise.resolve(['mockApi1 invoke called with', args])),
    },
    mockApi2: {
      getApiKeys: jest.fn().mockReturnValue(['mockFn1', 'mockFn2', 'mockFn3']),
      invoke: jest.fn().mockImplementation((...args) => Promise.resolve(['mockApi2 invoke called with', args])),
    },
    mockApi3: {
      getApiKeys: jest.fn().mockReturnValue(['mockFn1', 'mockFn2', 'mockFn3']),
      invoke: jest.fn().mockImplementation((...args) => Promise.resolve(['mockApi3 invoke called with', args])),
    },
  };
});

async function mockWebDriverRunExecuteAsync(callIndex: number, ...args: unknown[]) {
  const funcsToExec = mockWebDriverClient.executeAsync.mock.calls.slice(callIndex).map((call: string[]) => call[0]);
  const resultCallback = jest.fn();
  await (funcsToExec[0] as Function)(...args, resultCallback);
  return resultCallback;
}

it('should return the expected interface', async () => {
  const api = await createApi(mockWebDriverClient, ['mockApi1', 'mockApi2', 'mockApi3']);
  expect(api).toEqual({
    mockApi1: {
      mockFn1: anyFunction(),
      mockFn2: anyFunction(),
      mockFn3: anyFunction(),
    },
    mockApi2: {
      mockFn1: anyFunction(),
      mockFn2: anyFunction(),
      mockFn3: anyFunction(),
    },
    mockApi3: {
      mockFn1: anyFunction(),
      mockFn2: anyFunction(),
      mockFn3: anyFunction(),
    },
  });
});

it('should add the expected client commands', async () => {
  await createApi(mockWebDriverClient, ['mockApi1', 'mockApi2', 'mockApi3']);
  expect(mockWebDriverClient.addCommand.mock.calls).toEqual([
    ['spectron.mockApi1.mockFn1', anyFunction()],
    ['spectron.mockApi1.mockFn2', anyFunction()],
    ['spectron.mockApi1.mockFn3', anyFunction()],
    ['spectron.mockApi2.mockFn1', anyFunction()],
    ['spectron.mockApi2.mockFn2', anyFunction()],
    ['spectron.mockApi2.mockFn3', anyFunction()],
    ['spectron.mockApi3.mockFn1', anyFunction()],
    ['spectron.mockApi3.mockFn2', anyFunction()],
    ['spectron.mockApi3.mockFn3', anyFunction()],
  ]);
});

it('should make the expected getApiKeys calls', async () => {
  await createApi(mockWebDriverClient, ['mockApi1', 'mockApi2', 'mockApi3']);
  await mockWebDriverRunExecuteAsync(0, ['mockApi1', 'mockApi2', 'mockApi3']);
  expect((window.spectron as SpectronWindowObj).mockApi1.getApiKeys).toHaveBeenCalledTimes(1);
  expect((window.spectron as SpectronWindowObj).mockApi2.getApiKeys).toHaveBeenCalledTimes(1);
  expect((window.spectron as SpectronWindowObj).mockApi3.getApiKeys).toHaveBeenCalledTimes(1);
});

it('should construct the api object with placeholders', async () => {
  await createApi(mockWebDriverClient, ['mockApi1', 'mockApi2', 'mockApi3']);
  const resultsCallback = await mockWebDriverRunExecuteAsync(0, ['mockApi1', 'mockApi2', 'mockApi3']);
  expect(resultsCallback.mock.calls[0]).toEqual([mockApiPlaceholders]);
});

it('should throw an error when when the Context Bridge is not available', async () => {
  window.spectron = undefined;
  await createApi(mockWebDriverClient, ['mockApi1', 'mockApi2', 'mockApi3']);
  await expect(mockWebDriverRunExecuteAsync(0, ['mockApi1', 'mockApi2', 'mockApi3'])).rejects.toThrowError(
    'ContextBridge not available for retrieval of api keys',
  );
});

describe('calling API functions', () => {
  beforeEach(async () => {
    const api = await createApi(mockWebDriverClient, ['mockApi1', 'mockApi2', 'mockApi3']);
    api.mockApi1.mockFn1('test');
    api.mockApi3.mockFn2('moar test');
    api.mockApi2.mockFn3('yet moar test');
  });

  it('should call executeAsync with the expected params', () => {
    expect(mockWebDriverClient.executeAsync.mock.calls.slice(1)).toEqual([
      [anyFunction(), 'mockFn1', 'mockApi1', ['test']],
      [anyFunction(), 'mockFn2', 'mockApi3', ['moar test']],
      [anyFunction(), 'mockFn3', 'mockApi2', ['yet moar test']],
    ]);
  });

  it('should throw an error when when the Context Bridge is not available', async () => {
    window.spectron = undefined;
    await expect(mockWebDriverRunExecuteAsync(1, 'mockFn1', 'mockApi1', ['test'])).rejects.toThrowError(
      'ContextBridge not available for invocation of mockApi1.mockFn1',
    );
  });

  it('should resolve with the expected result when the Context Bridge is available', async () => {
    const resultCallback1 = await mockWebDriverRunExecuteAsync(1, 'mockFn1', 'mockApi1', ['test']);
    expect((window.spectron as SpectronWindowObj).mockApi1.invoke).toHaveBeenCalledWith('mockFn1', 'test');
    expect(resultCallback1.mock.calls[0]).toEqual([['mockApi1 invoke called with', ['mockFn1', 'test']]]);

    const resultCallback2 = await mockWebDriverRunExecuteAsync(1, 'mockFn2', 'mockApi3', ['moar test']);
    expect((window.spectron as SpectronWindowObj).mockApi3.invoke).toHaveBeenCalledWith('mockFn2', 'moar test');
    expect(resultCallback2.mock.calls[0]).toEqual([['mockApi3 invoke called with', ['mockFn2', 'moar test']]]);

    const resultCallback3 = await mockWebDriverRunExecuteAsync(1, 'mockFn3', 'mockApi2', ['yet moar test']);
    expect((window.spectron as SpectronWindowObj).mockApi2.invoke).toHaveBeenCalledWith('mockFn3', 'yet moar test');
    expect(resultCallback3.mock.calls[0]).toEqual([['mockApi2 invoke called with', ['mockFn3', 'yet moar test']]]);
  });
});
