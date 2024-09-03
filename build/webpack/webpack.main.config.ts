import path from 'node:path';
import { DefinePlugin } from 'webpack';
import product from '../../product.json';
import { createConfig, webpackDir, devServerPort, codeWindowName, updateWindowName } from './webpack.base.config';
import { asarDeps } from '../deps'

const srcDir = path.resolve('src/bootstrap/electron-main');
const outDir = path.resolve(webpackDir, 'main');

export default createConfig((_, argv) => ({
  entry: srcDir,
  output: {
    filename: 'index.js',
    path: outDir,
  },
  target: 'electron-main',
  externals: [
    ({ request }, callback) => {
      if (asarDeps.includes(request!)) {
        return callback(null, 'commonjs ' + request);
      }
      callback();
    },
  ],
  plugins: [
    new DefinePlugin({
      __PRODUCT__: JSON.stringify(product),
      __CODE_WINDOW_NAME__: `'${codeWindowName}'`,
      __UPDATE_WINDOW_NAME__: `'${updateWindowName}'`,
      __CODE_WINDOW_DEV_SERVER_URL__: argv.mode === 'development' ? `'http://localhost:${devServerPort}/${codeWindowName}'` : "''",
      __UPDATE_WINDOW_DEV_SERVER_URL__: argv.mode === 'development' ? `'http://localhost:${devServerPort}/${updateWindowName}'` : "''",
    }),
  ]
}));
