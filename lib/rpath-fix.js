if (process.platform !== 'darwin') {
  throw new Error('rpath-fix not darwin');
}

const cp = require('child_process');
const path = require('path');

const pathToChromedriver = require.resolve('electron-chromedriver/chromedriver');
const pathToChromedriverBin = path.resolve(pathToChromedriver, '..', 'bin', 'chromedriver');

const result = cp.spawnSync('install_name_tool', ['-add_rpath', '@executable_path/.', pathToChromedriverBin], {});
if (result.status !== 0) {
  if (result.stderr.includes('file already has LC_RPATH')) {
    throw new Error(result.stderr);
  }
  throw new Error(result.status);
}
