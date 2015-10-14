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
  } else if (name === '--spectron-arg') {
    appArgs.push(value)
  } else if (name.indexOf('--spectron-') !== 0) {
    chromeArgs.push(arg)
  }
})

var args = appArgs.concat(chromeArgs)
ChildProcess.spawn(executablePath, args).on('exit', function (code) {
  process.exit(code)
})
