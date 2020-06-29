#!/usr/bin/env node

var ChildProcess = require('child_process')

var executablePath = null
var appArgs = []
var chromeArgs = []

process.argv.slice(2).forEach(function (arg) {
  var indexOfEqualSign = arg.indexOf('=')
  if (indexOfEqualSign === -1) {
    chromeArgs.push(arg)
    return
  }

  var name = arg.substring(0, indexOfEqualSign)
  var value = arg.substring(indexOfEqualSign + 1)
  if (name === '--spectron-path') {
    executablePath = value
  } else if (name.indexOf('--spectron-arg') === 0) {
    appArgs[Number(name.substring(14))] = value
  } else if (name.indexOf('--spectron-env') === 0) {
    process.env[name.substring(15)] = value
  } else if (name.indexOf('--spectron-') !== 0) {
    chromeArgs.push(arg)
  }
})

var args = appArgs.concat(chromeArgs)

// Disables the --enable-logging flag on Windows, which causes extranneous console host windows to appear
if (process.platform === 'win32') {
  args.splice(args.indexOf('--enable-logging'), 1)
}

var appProcess = ChildProcess.spawn(executablePath, args)
appProcess.on('exit', function (code) { process.exit(code) })
appProcess.stderr.pipe(process.stdout)
appProcess.stdout.pipe(process.stdout)
appProcess.stdin.pipe(process.stdin)
