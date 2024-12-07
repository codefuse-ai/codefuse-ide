import path from 'node:path';
import {DefinePlugin} from 'webpack';
import {createConfig, webpackDir} from '../webpack/webpack.base.config';
import {asarDeps} from '../deps'

const srcDir = path.resolve('src/bootstrap/ext-host');
const outDir = path.join(webpackDir, 'ext-host');

module.exports = createConfig((_, argv) => ({
    entry: srcDir,
    output: {
        filename: 'index.js',
        path: outDir,
    },
    externals: [
        ({request}, callback) => {
            if (asarDeps.includes(request!)) {
                return callback(null, 'commonjs ' + request);
            }
            callback();
        },
    ],
    plugins: [
        new DefinePlugin({
            'process.env.IDE_DATA_FOLDER_NAME': JSON.stringify('.codefuse-ide'),
            'process.env.CODE_WINDOW_CLIENT_ID': JSON.stringify('CODE_WINDOW_CLIENT_ID'),
            'process.env.IDE_LOG_HOME': JSON.stringify('logs')
        })
    ],
    target: 'node',
}))
