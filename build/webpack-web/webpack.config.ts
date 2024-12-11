import browser from './webpack.browser.config';
import webview from './webpack.webview.config';
import extHost from './webpack.ext-host.config';
import workerHost from './webpack.worker-host.config'
import node from './webpack.node.config';

export default [browser, webview, extHost, workerHost, node];