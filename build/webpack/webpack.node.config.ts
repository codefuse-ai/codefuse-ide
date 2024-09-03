import path from 'node:path';
import { createConfig, webpackDir } from './webpack.base.config';
import { asarDeps } from '../deps'

const srcDir = path.resolve('src/bootstrap/node');
const outDir = path.resolve(webpackDir, 'node');

export default createConfig((_, argv) => ({
  entry: srcDir,
  output: {
    filename: 'index.js',
    path: outDir,
  },
  target: 'node',
  // ws 弱依赖
  externals: [
    {
      bufferutil: 'commonjs bufferutil',
      'utf-8-validate': 'commonjs utf-8-validate',
    },
    ({ request }, callback) => {
      if (asarDeps.includes(request!)) {
        return callback(null, 'commonjs ' + request);
      }
      callback();
    },
  ],
}));
