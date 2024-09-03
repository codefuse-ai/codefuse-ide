import path from 'node:path';
import { ProvidePlugin } from 'webpack';
import { createConfig, webpackDir } from './webpack.base.config';
import { asarDeps } from '../deps'

const srcDir = path.resolve('src/bootstrap/ext-host');
const outDir = path.join(webpackDir, 'ext-host');

export const extHostConfig = createConfig((_, argv) => ({
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

export const workerHostConfig = createConfig({
  entry: require.resolve('@opensumi/ide-extension/lib/hosted/worker.host-preload'),
  output: {
    filename: 'worker-host.js',
    path: outDir,
  },
  target: 'webworker',
  node: {
    global: true,
  },
  resolve: {
    fallback: {
      os: false,
      util: false,
      buffer: require.resolve('buffer/'),
    },
  },
  plugins: [
    new ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
  ],
})
