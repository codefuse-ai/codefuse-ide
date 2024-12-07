import path from 'node:path';
import { createConfig, webpackDir } from './webpack.base.config';
import { asarDeps } from '../deps'
import CopyPlugin from "copy-webpack-plugin";

const srcDir = path.resolve('src/bootstrap-web/node');
const outDir = path.resolve(webpackDir, 'node');

const projectRoot = path.resolve(__dirname, '../../')

export default createConfig((_, argv) => ({
  entry: srcDir,
  output: {
    filename: 'index.js',
    path: outDir,
  },
  plugins:[
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(projectRoot, 'product.json'),
          to: path.join(outDir, 'product.json'),
        }
      ],
    }),
  ],
  target: 'node',
  // ws ÈõÒÀÀµ
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
