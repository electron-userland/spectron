if (process.platform !== 'darwin') process.exit(0);

const cp = require('child_process');
const path = require('path');

const pathToChromedriver = require.resolve(
  'electron-chromedriver/chromedriver'
);
const pathToChromedriverBin = path.resolve(
  pathToChromedriver,
  '..',
  'bin',
  'chromedriver'
);

const result = cp.spawnSync(
  'install_name_tool',
  ['-add_rpath', '@executable_path/.', pathToChromedriverBin],
  {}
);
if (result.status !== 0) {
  if (result.stderr.includes('file already has LC_RPATH')) process.exit(0);
  process.exit(result.status);
}
