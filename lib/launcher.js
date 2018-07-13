#!/usr/bin/env node

var ChildProcess = require('child_process')

var executablePath = null
var appArgs = []
var chromeArgs = []
var launchWithChromeArgs = true;
var launchScript = '';
process.argv.slice(2).forEach(function (arg) {
  var indexOfEqualSign = arg.indexOf('=')
  if (indexOfEqualSign === -1) {
    chromeArgs.push(arg)
    return
  }

  var name = arg.substring(0, indexOfEqualSign)
  var value = arg.substring(indexOfEqualSign + 1)
  if (name === '--on-before-launch-script') {
    launchScript = value;
  } else if (name === '--launch-with-chrome-opts' && value === 'false') {
    launchWithChromeArgs = false;
  } else if (name === '--spectron-path') {
    executablePath = value
  } else if (name.indexOf('--spectron-arg') === 0) {
    appArgs.push(value)
  } else if (name.indexOf('--spectron-env') === 0) {
    process.env[name.substring(15)] = value
  } else if (name.indexOf('--spectron-') !== 0) {
    chromeArgs.push(arg)
  }
})
var args = appArgs.concat(chromeArgs)
var chromeArgsToAppend = '';
var chromeArgs = ' ' +  args.join(' ');
if (launchWithChromeArgs) {
  chromeArgsToAppend = chromeArgs;
}
if (launchScript) {
  require(launchScript).init(chromeArgs).then(() => {
    var appProcess = ChildProcess.exec(executablePath)
    appProcess.on('exit', function (code) { process.exit(code) })
    appProcess.stderr.pipe(process.stdout)
    appProcess.stdout.pipe(process.stdout)
    appProcess.stdin.pipe(process.stdin)
  });
} else {
  var appProcess = ChildProcess.exec(executablePath + chromeArgsToAppend)
  appProcess.on('exit', function (code) { process.exit(code) })
  appProcess.stderr.pipe(process.stdout)
  appProcess.stdout.pipe(process.stdout)
  appProcess.stdin.pipe(process.stdin)
}
