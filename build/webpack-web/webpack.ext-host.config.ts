import path from 'node:path';
import { createConfig, webpackDir } from './webpack.base.config';
import { asarDeps } from '../deps'

const srcDir = path.resolve('src/bootstrap-web/ext-host');
const outDir = path.join(webpackDir, 'ext-host');

export default createConfig((_, argv) => ({
  entry: srcDir,
  output: {
    filename: 'index.js',
    path: outDir,
  },
  externals: [
    ({ request }, callback) => {
      if (asarDeps.includes(request!)) {
        return callback(null, 'commonjs ' + request);
      }
      callback();
    },
  ],
  target: 'node',
}))
