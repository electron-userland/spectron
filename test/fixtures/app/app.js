#!/usr/bin/env node

var ChildProcess = require('child_process')
var path = require('path')

var electronPath = path.join(__dirname, '..', '..', '..', 'node_modules', '.bin', 'electron')
var args = [__dirname].concat(process.argv)
ChildProcess.spawn(electronPath, args).on('exit', function (code) {
  process.exit(code)
})
