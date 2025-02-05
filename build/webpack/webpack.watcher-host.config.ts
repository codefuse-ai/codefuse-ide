import path from 'node:path';
import { createConfig, webpackDir } from './webpack.base.config';
import { asarDeps } from '../deps';

const srcDir = path.resolve('src/bootstrap/watcher-host');
const outDir = path.join(webpackDir, 'watcher-host');

export const watcherHostConfig = createConfig(() => ({
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
}));