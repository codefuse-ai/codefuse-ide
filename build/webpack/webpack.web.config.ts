import { join } from 'path';
import { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import baseConfig from './webpack.base.config';

// Web specific configuration
const webConfig: Configuration = {
  // Set the entry point for the web version
  entry: {
    web: join(__dirname, '../../src/bootstrap-web/browser/index.ts'),
  },
  // Output configuration
  output: {
    path: join(__dirname, '../../dist-web'),
    filename: '[name].bundle.js',
    publicPath: '/ide/', // 修改为子路径
  },
  // Development server configuration
  devServer: {
    port: 8080,
    hot: true,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    // 添加代理配置
    proxy: {
      '/ide': {
        target: 'http://localhost:8080',
        pathRewrite: { '^/ide': '' },
      },
    },
  },
  // Plugins
  plugins: [
    new HtmlWebpackPlugin({
      template: join(__dirname, '../../src/bootstrap-web/browser/index.html'),
      filename: 'index.html',
      chunks: ['web'],
    }),
  ],
};

// Merge with base configuration
export default merge(baseConfig, webConfig); 