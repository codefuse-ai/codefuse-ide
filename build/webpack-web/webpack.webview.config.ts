import {webpackDir} from "./webpack.base.config";

const path = require('path');
const entry = require.resolve('@opensumi/ide-webview/lib/webview-host/web-preload.js');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const tsConfigPath = path.join(__dirname, '../../tsconfig.json');
const distDir = path.join(webpackDir, 'webview');
const port = 8899;

export default {
  entry,
  output: {
    filename: 'webview.js',
    path: distDir,
    clean: true,
  },
  cache: {
    type: 'filesystem',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json', '.less'],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: tsConfigPath,
      }),
    ],
  },
  bail: true,
  mode: process.env.NODE_ENV || 'development',
  devtool: 'source-map',
  module: {
    // https://github.com/webpack/webpack/issues/196#issuecomment-397606728
    exprContextCritical: false,
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          happyPackMode: true,
          transpileOnly: true,
          configFile: tsConfigPath,
        },
      },
    ],
  },
  resolveLoader: {
    modules: [
      path.join(__dirname, '../../../node_modules'),
      path.join(__dirname, '../../node_modules'),
      path.resolve('node_modules'),
    ],
    extensions: ['.ts', '.tsx', '.js', '.json', '.less'],
    mainFields: ['loader', 'main'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.dirname(entry) + '/webview.html',
    }),
    new NodePolyfillPlugin({
      includeAliases: ['process', 'Buffer'],
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname , webpackDir)
    },
    allowedHosts: 'all',
    port,
    host: "0.0.0.0",
    open: false,
    hot: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
        runtimeErrors: false,
      },
    },
  },
};