import { createApi } from '@goosewobbler/spectron/lib/api';

const mockWebDriverClient: {
  executeAsync?: jest.Mock;
  addCommand?: jest.Mock;
} = {};
let loadApiFunc;
let apiNamesArr;
let mockApiPlaceholders: {};

beforeEach(() => {
  mockApiPlaceholders = {
    mockNS1: {
      mockFn1: `spectron.mockNS1.mockFn1`,
      mockFn2: `spectron.mockNS1.mockFn2`,
      mockFn3: `spectron.mockNS1.mockFn3`,
    },
  };
  mockWebDriverClient.executeAsync = jest.fn().mockImplementationOnce((loadApi, apiNames) => {
    loadApiFunc = loadApi;
    apiNamesArr = apiNames;
    return Promise.resolve(mockApiPlaceholders);
  });
  mockWebDriverClient.addCommand = jest.fn();
});

it('should pass', async () => {
  const api = await createApi(mockWebDriverClient, ['mockApi1', 'mockApi2', 'mockApi3']);
  expect(typeof createApi === 'function');
});
