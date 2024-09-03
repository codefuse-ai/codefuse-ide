import { Configuration, DefinePlugin } from 'webpack'
import path from 'node:path'
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'
import { merge } from 'webpack-merge'

export const webpackDir = path.resolve('out')

export const devServerPort = 3000

export const codeWindowName = 'code'

export const updateWindowName = 'update'

export const createConfig = (config: Configuration | ((_env: unknown, argv: Record<string, any>) => Configuration)) => (_env: unknown, argv: Record<string, any>) => {
  return merge({
    mode: argv.mode,
    devtool: argv.mode === 'development' ? 'source-map': false,
    node: {
      __dirname: false,
      __filename: false,
    },
    output: {
      asyncChunks: false,
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.mjs', '.js', '.json', '.less'],
      plugins: [
        new TsconfigPathsPlugin({
          configFile: path.join(__dirname, '../../tsconfig.json'),
        }),
      ],
    },
    module: {
      // https://github.com/webpack/webpack/issues/196#issuecomment-397606728
      exprContextCritical: false,
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          exclude: /(node_modules|\.webpack)/,
          options: {
            configFile: path.join(__dirname, '../../tsconfig.json'),
            transpileOnly: true,
          },
        },
        {
          test: /\.mjs$/,
          include: /node_modules/,
          type: 'javascript/auto',
        },
      ],
    },
    plugins: [
      new DefinePlugin({
        'process.env.KTLOG_SHOW_DEBUG': argv.mode === 'development',
      }),
    ],
  }, typeof config === 'function' ? config(_env, argv) : config);
};
