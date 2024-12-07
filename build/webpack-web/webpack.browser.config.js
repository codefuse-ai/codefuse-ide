const path = require('path');
const fs = require('fs');

const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const webpack = require('webpack');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');
const product = require("../../product.json");
const tsConfigPath = path.join(__dirname, '../../tsconfig.json');
const srcDir = path.join(__dirname, '../../src/web/browser');
const distDir = path.join(__dirname, '../../out');
const publicDir = path.join(__dirname, '../../public');

const styleLoader =
  process.env.NODE_ENV === 'production' ? MiniCssExtractPlugin.loader : require.resolve('style-loader');
const isDevelopment =
  process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev';

const port = 8080;

const idePkg = JSON.parse(
  fs
    .readFileSync(
      path.join(__dirname, '../..', './node_modules/@opensumi/ide-core-browser/package.json'),
    )
    .toString(),
);

/** @type { import('webpack').Configuration } */
module.exports = {
  entry: path.join(srcDir, './index.ts'),
  output: {
    filename: 'bundle.js',
    path: distDir,
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
    fallback: {
      net: false,
      path: false,
      os: false,
      crypto: false,
      child_process: false,
      url: false,
      fs: false,
    },
  },
  mode: process.env['NODE_ENV'],
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
          compilerOptions: {
            target: 'es2016',
          },
        },
      },
      {
        test: /\.png$/,
        type: 'asset/resource',
      },

      {
        test: /\.css$/,
        use: [styleLoader, 'css-loader'],
      },
      {
        test: /\.module.less$/,
        use: [
          styleLoader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
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
          styleLoader,
          {
            loader: 'css-loader',
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
        test: /\.svg$/,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name].[hash][ext][query]',
        },
      },
      {
        test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name]-[hash:8][ext][query]',
        },
      },
    ],
  },
  resolveLoader: {
    modules: [path.join(__dirname, '../../node_modules')],
    extensions: ['.ts', '.tsx', '.js', '.json', '.less'],
    mainFields: ['loader', 'main'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(publicDir, 'index.html'),
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[chunkhash:8].css',
      chunkFilename: '[id].css',
    }),
    !process.env.CI && new webpack.ProgressPlugin(),
    new NodePolyfillPlugin({
      includeAliases: ['path', 'Buffer', 'process'],
    }),
    new webpack.DefinePlugin({
      __PRODUCT__: JSON.stringify(product),
      'process.env.WORKSPACE_DIR': JSON.stringify(
        isDevelopment ? path.join(__dirname, '../..', 'workspace') : process.env['WORKSPACE_DIR'],
      ),
      'process.env.EXTENSION_DIR': JSON.stringify(
        isDevelopment ? path.join(__dirname, '../..', 'extensions') : process.env['EXTENSION_DIR'],
      ),
      'process.env.REVERSION': JSON.stringify(idePkg.version || 'alpha'),
      'process.env.DEVELOPMENT': JSON.stringify(!!isDevelopment),
      'process.env.TEMPLATE_TYPE': JSON.stringify(
        isDevelopment ? process.env['TEMPLATE_TYPE'] : 'standard',
      ),
    }),
    new CopyPlugin({
      patterns: [{
        from: publicDir,
        to: distDir,
        filter: (filepath) => {
          console.log("filepath", filepath);
          return !filepath.endsWith('index.html')
        }
      }]
    }),

  ],
  optimization: {
    nodeEnv: process.env.NODE_ENV,
    minimizer: [
      new TerserJSPlugin({
        minify: TerserJSPlugin.esbuildMinify,

      }),
      new OptimizeCSSAssetsPlugin({}),
    ],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, '../../out'), // 静态文件目录
    },
    port,
    host: '0.0.0.0',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
    open: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
        runtimeErrors: false,
      },
    },
  }

};