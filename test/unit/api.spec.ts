import { anyFunction, mock, MockProxy } from 'jest-mock-extended';
import { createApi, SpectronClient } from '@goosewobbler/spectron/lib/api';

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
  mockWebDriverClient.addCommand.mockImplementation((commandName, func) => {
    mockWebDriverClient[commandName] = (...args: unknown[]) => func.bind(mockWebDriverClient)(...args);
  });
  mockWebDriverClient.executeAsync.mockImplementation(() => Promise.resolve(mockApiPlaceholders));
  // window.spectron = {
  //   mockApi1: {
  //     getApiKeys: jest.fn(),
  //     invoke: jest.fn(),
  //   },
  //   mockApi2: {
  //     getApiKeys: jest.fn(),
  //     invoke: jest.fn(),
  //   },
  //   mockApi3: {
  //     getApiKeys: jest.fn(),
  //     invoke: jest.fn(),
  //   },
  // };
});

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

describe('calling API functions', () => {
  beforeEach(() => {});

  it('should call executeAsync with the expected params', async () => {
    const api = await createApi(mockWebDriverClient, ['mockApi1', 'mockApi2', 'mockApi3']);
    api.mockApi1.mockFn1('test');
    api.mockApi3.mockFn2('moar test');
    api.mockApi2.mockFn3('yet moar test');
    expect(mockWebDriverClient.executeAsync.mock.calls.slice(1)).toEqual([
      [anyFunction(), 'mockFn1', 'mockApi1', ['test']],
      [anyFunction(), 'mockFn2', 'mockApi3', ['moar test']],
      [anyFunction(), 'mockFn3', 'mockApi2', ['yet moar test']],
    ]);
  });
});
