var getElectronVersion = require('electron-version')
var semver = require('semver')

module.exports = function (electronPath) {
  if (!electronPath || !electronPath.length) return

  getElectronVersion(electronPath, function (err, electronVersion) {
    if (err || !electronVersion || !electronVersion.length) return
    electronVersion = electronVersion.replace('v', '')
    var spectronVersion = require('../package.json').version
    var spectronMinor = semver.parse(spectronVersion).minor
    var electronMinor = semver.parse(electronVersion).minor
    if (spectronMinor !== electronMinor) {
      console.warn(`\nWarning: Installed minor versions are mismatched: ${spectronMinor} vs ${electronMinor}`)
      console.warn(`spectron: ${spectronVersion}`)
      console.warn(`electron: ${electronVersion}\n`)
    }
  })
}
