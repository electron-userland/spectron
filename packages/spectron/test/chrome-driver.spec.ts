import { anyFunction } from 'jest-mock-extended';
import { initChromeDriver } from '../lib/chrome-driver';

beforeEach(() => {});

it('should return the expected interface', async () => {
  const chromeDriver = await initChromeDriver(
    'mockHost',
    1337,
    'mockNodePath',
    5000,
    'mockWorkingDirectory',
    'mockChromeDriverLogPath',
  );
  expect(chromeDriver).toEqual({
    start: anyFunction(),
    stop: anyFunction(),
    getLogs: anyFunction(),
    clearLogs: anyFunction(),
  });
});
