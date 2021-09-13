/* eslint no-underscore-dangle: "off" */
import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';
import ChromeDriverLauncher, { Capabilities, Config, Options } from '../src/launcher';

type Stream = {
  pipe?: jest.Mock;
  on?: jest.Mock;
};

jest.mock('child_process', () => {
  const stream: Stream = {};
  stream.pipe = jest.fn().mockReturnValue(stream);
  stream.on = jest.fn().mockReturnValue(stream);
  return {
    spawn: jest.fn().mockReturnValue({
      stdout: stream,
      stderr: stream,
      kill: jest.fn(),
    }),
  };
});

let config: Config;
let options: Options;
let capabilities: Capabilities;

describe('ChromeDriverLauncher launcher', () => {
  beforeEach(() => {
    config = {};
    options = {};
    capabilities = [{ browserName: 'chrome' }];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onPrepare', () => {
    test('should set correct starting options', async () => {
      const Launcher = new ChromeDriverLauncher(options, capabilities, config);
      Launcher._redirectLogStream = jest.fn();

      await Launcher.onPrepare();

      expect(spawn.mock.calls[0][0]).toEqual('/some/local/chromedriver/path');
      expect(spawn.mock.calls[0][1]).toEqual(['--port=9515', '--url-base=/']);
    });

    it('should fallback to global chromedriver', async () => {
      fs.existsSync.mockReturnValueOnce(false);
      const Launcher = new ChromeDriverLauncher(options, capabilities, config);
      Launcher._redirectLogStream = jest.fn();

      await Launcher.onPrepare();

      expect(spawn.mock.calls[0][0]).toEqual('chromedriver');
    });

    test('should set (and overwrite config.outputDir) outputDir when passed in the options', async () => {
      options.outputDir = 'options-outputdir';
      config.outputDir = 'config-outputdir';
      const Launcher = new ChromeDriverLauncher(options, capabilities, config);
      Launcher._redirectLogStream = jest.fn();

      await Launcher.onPrepare();

      expect(Launcher.outputDir).toEqual('options-outputdir');
    });

    test('should set correct config properties', async () => {
      config.outputDir = 'dummy';
      const Launcher = new ChromeDriverLauncher(options, capabilities, config);
      Launcher._redirectLogStream = jest.fn();

      await Launcher.onPrepare();

      expect(Launcher.outputDir).toEqual('dummy');
    });

    test('should set correct port and path', async () => {
      const Launcher = new ChromeDriverLauncher(options, capabilities, config);
      Launcher._redirectLogStream = jest.fn();

      await Launcher.onPrepare();

      expect(Launcher.args).toEqual(['--port=9515', '--url-base=/']);
    });

    test('should set correct args', async () => {
      options.args = ['--silent'];
      const Launcher = new ChromeDriverLauncher(options, capabilities, config);
      Launcher._redirectLogStream = jest.fn();

      await Launcher.onPrepare();

      expect(Launcher.args).toEqual(['--silent', '--port=9515', '--url-base=/']);
    });

    test('should throw if the argument "--port" is passed', async () => {
      options.args = ['--port=9616'];
      const Launcher = new ChromeDriverLauncher(options, capabilities, config);
      Launcher._redirectLogStream = jest.fn();

      await expect(Launcher.onPrepare()).rejects.toThrow(new Error('Argument "--port" already exists'));
    });

    test('should throw if the argument "--url-base" is passed', async () => {
      options.args = ['--url-base=/dummy'];
      const Launcher = new ChromeDriverLauncher(options, capabilities, config);
      Launcher._redirectLogStream = jest.fn();

      await expect(Launcher.onPrepare()).rejects.toThrow(new Error('Argument "--url-base" already exists'));
    });

    test('should set correct config properties when empty', async () => {
      const Launcher = new ChromeDriverLauncher(options, capabilities, config);
      Launcher._redirectLogStream = jest.fn();

      await Launcher.onPrepare({});

      expect(Launcher.args).toBeUndefined();
    });

    test('should call ChromeDriver start', async () => {
      const Launcher = new ChromeDriverLauncher(options, capabilities, config);
      Launcher._redirectLogStream = jest.fn();

      await Launcher.onPrepare();

      expect(spawn.mock.calls[0][1]).toEqual(['--port=9515', '--url-base=/']);
    });

    test('should not output the log file', async () => {
      const Launcher = new ChromeDriverLauncher(options, capabilities, config);
      Launcher._redirectLogStream = jest.fn();

      await Launcher.onPrepare({});

      expect(Launcher._redirectLogStream).not.toHaveBeenCalled();
    });

    test('should output the log file', async () => {
      options.outputDir = 'dummy';
      const Launcher = new ChromeDriverLauncher(options, capabilities, config);
      Launcher._redirectLogStream = jest.fn();

      await Launcher.onPrepare();

      expect(Launcher._redirectLogStream).toHaveBeenCalled();
    });
  });

  describe('onComplete', () => {
    test('should call ChromeDriver.stop', async () => {
      const Launcher = new ChromeDriverLauncher(options, capabilities, config);
      Launcher._redirectLogStream = jest.fn();

      await Launcher.onPrepare({});

      Launcher.onComplete();

      expect(Launcher.process.kill).toHaveBeenCalled();
    });

    test('should not call process.kill', () => {
      const Launcher = new ChromeDriverLauncher(options, capabilities, config);
      Launcher.onComplete();

      expect(Launcher.process).toBeFalsy();
    });
  });

  describe('_redirectLogStream', () => {
    test('should write output to file', async () => {
      config.outputDir = 'dummy';
      const Launcher = new ChromeDriverLauncher(options, capabilities, config);

      await Launcher.onPrepare();

      expect(fs.createWriteStream.mock.calls[0][0]).toBe(path.join(process.cwd(), 'dummy', 'wdio-chromedriver.log'));
      expect(Launcher.process.stdout.pipe).toHaveBeenCalled();
      expect(Launcher.process.stderr.pipe).toHaveBeenCalled();
    });
  });

  describe('custom chromedriver Path', () => {
    test('should select custom chromedriver path "chromedriver.exe"', async () => {
      options.chromedriverCustomPath = 'chromedriver.exe';
      const Launcher = new ChromeDriverLauncher(options, capabilities, config);
      Launcher._redirectLogStream = jest.fn();
      await Launcher.onPrepare();
      expect(Launcher.chromedriverCustomPath).toEqual(path.resolve(options.chromedriverCustomPath));
    });

    test('should select custom chromedriver path "c:\\chromedriver.exe"', async () => {
      options.chromedriverCustomPath = 'c:\\chromedriver.exe';
      const Launcher = new ChromeDriverLauncher(options, capabilities, config);
      Launcher._redirectLogStream = jest.fn();
      await Launcher.onPrepare();
      expect(Launcher.chromedriverCustomPath).toEqual(path.resolve(options.chromedriverCustomPath));
    });

    test('should select custom chromedriver path "./chromedriver.exe"', async () => {
      options.chromedriverCustomPath = './chromedriver.exe';
      const Launcher = new ChromeDriverLauncher(options, capabilities, config);
      Launcher._redirectLogStream = jest.fn();
      await Launcher.onPrepare();
      expect(Launcher.chromedriverCustomPath).toEqual(path.resolve(options.chromedriverCustomPath));
    });

    test('should select default chromedriver path if no custom path provided"', async () => {
      options.chromedriverCustomPath = undefined;
      const Launcher = new ChromeDriverLauncher(options, capabilities, config);
      Launcher._redirectLogStream = jest.fn();
      await Launcher.onPrepare();
      expect(Launcher.chromedriverCustomPath).not.toBeUndefined();
    });
  });
});
