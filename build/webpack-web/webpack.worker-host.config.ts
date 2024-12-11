import path from 'node:path';
import { ProvidePlugin } from 'webpack';
import {webpackDir} from "./webpack.base.config";
import {createConfig} from "../webpack/webpack.base.config";
const outDir = path.join(webpackDir, 'ext-host');

export default createConfig({
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