import path from 'node:path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { createConfig, webpackDir, devServerPort, codeWindowName, updateWindowName } from './webpack.base.config';

const srcDir = path.resolve('src/bootstrap/browser');
const outDir = path.resolve(webpackDir, 'renderer');
const updateSrcDir = path.resolve('src/auto-updater/update-window');

export default createConfig((_env, argv) => {
  const styleLoader = argv.mode === 'production' ? MiniCssExtractPlugin.loader : 'style-loader'

  return {
    entry: {
      [codeWindowName]: path.resolve(srcDir, 'index.ts'),
      [updateWindowName]: path.resolve(updateSrcDir, 'index.tsx'),
    },
    output: {
      filename: '[name]/index.js',
      path: outDir,
      assetModuleFilename: 'assets/[name].[hash][ext]',
    },
    devtool: argv.mode === 'production' ? false as const : 'eval-source-map',
    target: 'electron-renderer',
    externalsPresets: {
      node: true,
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [styleLoader, 'css-loader'],
        },
        {
          test: /\.module.less$/,
          use: [
            {
              loader: styleLoader,
              options: {
                esModule: false,
              }
            },
            {
              loader: 'css-loader',
              options: {
                importLoaders: 0,
                sourceMap: true,
                esModule: false,
                modules: {
                  localIdentName: '[local]___[hash:base64:5]',
                },
              },
            },
            {
              loader: 'less-loader',
              options: {
                lessOptions: {
                  javascriptEnabled: true,
                },
              },
            },
          ],
        },
        {
          test: /^((?!\.module).)*less$/,
          use: [
            {
              loader: styleLoader,
              options: {
                esModule: false,
              }
            },
            {
              loader: 'css-loader',
              options: {
                importLoaders: 0,
                esModule: false,
              },
            },
            {
              loader: 'less-loader',
              options: {
                lessOptions: {
                  javascriptEnabled: true,
                },
              },
            },
          ],
        },
        {
          test: /\.(woff(2)?|ttf|eot|svg|png)(\?v=\d+\.\d+\.\d+)?$/,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024,
            }
          }
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.join(srcDir, 'index.html'),
        filename: `${codeWindowName}/index.html`,
        chunks: [codeWindowName]
      }),
      new HtmlWebpackPlugin({
        template: path.join(updateSrcDir, 'index.html'),
        filename: `${updateWindowName}/index.html`,
        chunks: [updateWindowName]
      }),
      ...(argv.mode === 'production' ? [
        new MiniCssExtractPlugin({
          filename: '[name]/index.css',
          chunkFilename: '[id].css',
        })
      ] : []),
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(srcDir, 'preload.js'),
            to: path.join(outDir, codeWindowName, 'preload.js'),
          },
          {
            from: require.resolve('@opensumi/ide-monaco/worker/editor.worker.bundle.js'),
            to: path.join(outDir, codeWindowName, 'editor.worker.bundle.js'),
          },
          {
            from: require.resolve('tiktoken/tiktoken_bg.wasm'),
            to: path.join(outDir, codeWindowName, 'tiktoken_bg.wasm'),
          },
        ],
      }),
    ],
    optimization: {
      splitChunks: {
        cacheGroups: {
          vendor: {
            name: 'vendor',
            chunks: 'all',
            minChunks: 2,
          },
        },
      }
    },
    infrastructureLogging: {
      level: 'none'
    },
    stats: 'none',
    devServer: {
      hot: true,
      devMiddleware: {
        writeToDisk: true,
      },
      client: {
        overlay: {
          runtimeErrors: false,
          warnings: false,
        }
      },
      historyApiFallback: true,
      port: devServerPort,
      setupExitSignals: true,
      static: outDir,
      headers: {
        'Content-Security-Policy': "default-src 'self' 'unsafe-inline' data: file:; script-src 'self' 'unsafe-eval' 'unsafe-inline' data: file:; connect-src 'self' file:; worker-src 'self' data: blob:; img-src 'self' data: file:",
      },
    }
  }
});
