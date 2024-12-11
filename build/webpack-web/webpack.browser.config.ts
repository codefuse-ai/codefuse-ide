import path from 'node:path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import NodePolyfillPlugin from "node-polyfill-webpack-plugin"
import {DefinePlugin} from 'webpack'
import fs from 'fs'
import { createConfig, webpackDir, devServerPort } from './webpack.base.config';
import {config} from 'dotenv'
config({
  path: path.join(__dirname, '../../.env.sample')
})

const srcDir = path.resolve('src/bootstrap-web/browser');
const outDir = path.resolve(webpackDir);
const publicDir = path.join(__dirname, '../../public');


const isDevelopment = process.env.NODE_ENV === 'development';
const idePkg = JSON.parse(fs.readFileSync(path.resolve(path.join(__dirname,'../../package.json'))).toString())

export default createConfig((_env, argv) => {
  const styleLoader = argv.mode === 'production' ? MiniCssExtractPlugin.loader : 'style-loader'

  return {
    entry: path.resolve(srcDir, 'index.ts'),
    output: {
      filename: '[name]/index.js',
      path: outDir,
      assetModuleFilename: 'assets/[name].[hash][ext]',
    },
    devtool: argv.mode === 'production' ? false as const : 'eval-source-map',
    target: 'web',
    externalsPresets: {
      node: false,
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
    experiments: {
      syncWebAssembly: true,
      asyncWebAssembly: true
    },
    plugins: [
      new DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        'process.platform': JSON.stringify('browser'),
        'process.env.WORKSPACE_DIR': JSON.stringify(
          isDevelopment ? path.join(__dirname, '../..', 'workspace') : process.env['WORKSPACE_DIR'],
        ),
        'process.env.EXTENSION_DIR': JSON.stringify(
          isDevelopment ? path.join(__dirname, '../..', 'extensions') : process.env['EXTENSION_DIR'],
        ),
        'process.env.REVERSION': JSON.stringify(idePkg.version || 'alpha'),
        'process.env.DEVELOPMENT': JSON.stringify(!!isDevelopment),
        'process.env.TEMPLATE_TYPE': JSON.stringify(
          isDevelopment ? process.env.TEMPLATE_TYPE : 'standard',
        ),
        'process.env.IDE_SERVER_PORT': JSON.stringify(process.env.IDE_SERVER_PORT),
        'process.env.WS_PATH': JSON.stringify(process.env.WS_PATH),
        'process.env.STATIC_SERVER_PATH': JSON.stringify(process.env.STATIC_SERVER_PATH),
        'process.env.EXTENSION_WORKER_HOST': JSON.stringify(process.env.EXTENSION_WORKER_HOST),
        'process.env.WEBVIEW_HOST': JSON.stringify(process.env.WEBVIEW_HOST),
      }),
      new HtmlWebpackPlugin({
        template: path.join(publicDir, 'index.html'),
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
            from: require.resolve('@opensumi/ide-monaco/worker/editor.worker.bundle.js'),
            to: path.join(outDir, 'editor.worker.bundle.js'),
          },
        ],
      }),
      new NodePolyfillPlugin({
        // excludeAliases: ['path', 'Buffer', 'process'],
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
      proxy: [
        {
          context: ['/service'],
          target: 'ws://localhost:8000',
          ws: true
        },
      ],
      setupExitSignals: true,
      static: outDir,
      headers: {
        'Content-Security-Policy': "default-src 'self' 'unsafe-inline' data: file:; script-src 'self' 'unsafe-eval' 'unsafe-inline' data: file:; connect-src 'self' file:; worker-src 'self' data: blob:; img-src 'self' data: file:",
      },
    }
  }
});
