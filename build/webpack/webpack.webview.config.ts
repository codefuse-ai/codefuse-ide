import path from 'node:path';
import CopyPlugin from 'copy-webpack-plugin';
import { createConfig, webpackDir } from './webpack.base.config';

const outDir = path.join(webpackDir, 'webview');

export default createConfig(
  {
    entry: require.resolve('@opensumi/ide-webview/lib/electron-webview/host-preload.js'),
    output: {
      filename: 'host-preload.js',
      path: outDir,
    },
    target: 'electron-preload',
    plugins: [
      new CopyPlugin({
        patterns: [
          {
            from: require.resolve('@opensumi/ide-webview/lib/electron-webview/plain-preload.js'),
            to: path.join(outDir, 'plain-preload.js'),
          },
        ],
      }),
    ],
  }
);
