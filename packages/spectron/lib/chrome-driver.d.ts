export type ChromeDriverObj = {
  start: () => {};
  stop: () => {};
  getLogs: () => {};
  clearLogs: () => {};
};

export function initChromeDriver(
  host: string,
  port: number,
  nodePath: string,
  startTimeout: number,
  workingDirectory: string,
  chromeDriverLogPath: string,
): ChromeDriverObj;

declare module '@goosewobbler/spectron/chrome-driver' {}
