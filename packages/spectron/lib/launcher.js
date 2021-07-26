#!/usr/bin/env node
/* eslint node/shebang: off */
const ChildProcess = require('child_process');

let executablePath = null;
const appArgs = [];
const chromeArgs = [];

process.argv.slice(2).forEach((arg) => {
  const indexOfEqualSign = arg.indexOf('=');
  if (indexOfEqualSign === -1) {
    chromeArgs.push(arg);
    return;
  }

  const name = arg.substring(0, indexOfEqualSign);
  const value = arg.substring(indexOfEqualSign + 1);
  if (name === '--spectron-path') {
    executablePath = value;
  } else if (name.indexOf('--spectron-arg') === 0) {
    appArgs[Number(name.substring(14))] = value;
  } else if (name.indexOf('--spectron-env') === 0) {
    process.env[name.substring(15)] = value;
  } else if (name.indexOf('--spectron-') !== 0) {
    chromeArgs.push(arg);
  }
});

if (process.env.CI) {
  chromeArgs.unshift('no-sandbox');
  chromeArgs.push('headless');
  chromeArgs.push('disable-dev-shm-usage');
  chromeArgs.push('blink-settings=imagesEnabled=false');
  chromeArgs.push('disable-gpu');
  // args.push('--remote-debugging-port=9222');
  chromeArgs.push('disable-infobars');
  chromeArgs.push('disable-extensions');
}

// chromeArgs.push('--headless');
// chromeArgs.push('--no-sandbox');
// chromeArgs.push('--disable-dev-shm-usage');
// chromeArgs.push('--remote-debugging-port=9222');

const args = appArgs.concat(chromeArgs);
const appProcess = ChildProcess.spawn(executablePath, args);
appProcess.on('exit', (code) => {
  throw new Error(`exit: ${code}`);
});
appProcess.stderr.pipe(process.stdout);
appProcess.stdout.pipe(process.stdout);
appProcess.stdin.pipe(process.stdin);
