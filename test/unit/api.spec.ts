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
  mockWebDriverClient.executeAsync.mockImplementationOnce(() => Promise.resolve(mockApiPlaceholders));
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
