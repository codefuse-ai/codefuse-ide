const path = require('path');
const webpack = require('webpack');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const tsConfigPath = path.join(__dirname, '../..', '/tsconfig.json');
const srcDir = path.join(__dirname, '../..', 'src', 'web', 'node');
const distDir = path.join(__dirname, '../..', 'dist-node', 'server');

module.exports = {
    entry: path.join(srcDir, './index.ts'),
    target: 'node',
    output: {
        filename: 'index.js',
        path: distDir,
        clean: true,
    },
    node: false,
    // mode: process.env.NODE_ENV || 'development',
    mode: "production",
    devtool: 'source-map',
    optimization: {
        minimize: true,
    },
    cache: {
        type: 'filesystem',
    },
    watch: false,
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json'],
        plugins: [
            new TsconfigPathsPlugin({
                configFile: tsConfigPath,
            }),
        ],
    },
    module: {
        exprContextCritical: false,
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
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
                ],
            },
            {test: /\.css$/, loader: 'null-loader'},
            {test: /\.less$/, loader: 'null-loader'},
        ],
    },
    externals: [
        function ({request}, callback) {
            if (
                [
                    'node-pty',
                    'oniguruma',
                    '@parcel/watcher',
                    '@vscode/spdlog',
                    'nsfw',
                    'spdlog',
                    'vm2',
                    'canvas',
                    '@opensumi/vscode-ripgrep',
                    'vertx',
                    'keytar',
                    'tsconfig-paths',
                ].indexOf(request) !== -1
            ) {
                return callback(null, `commonjs ${request}`);
            }
            callback();
        },
    ],
    resolveLoader: {
        extensions: ['.ts', '.tsx', '.js', '.json'],
        mainFields: ['loader', 'main'],
        modules: [
            path.join(__dirname, '../../../node_modules'),
            path.join(__dirname, '../node_modules'),
            path.resolve('node_modules'),
        ],
    },

    plugins: [
        !process.env.CI && new webpack.ProgressPlugin(),
        new webpack.DefinePlugin({
            'process.env.IDE_DATA_FOLDER_NAME': JSON.stringify('.codefuse-ide'),
            'process.env.CODE_WINDOW_CLIENT_ID': JSON.stringify('CODE_WINDOW_CLIENT_ID'),
            'process.env.IDE_LOG_HOME': JSON.stringify('logs')

        })
    ],
}
