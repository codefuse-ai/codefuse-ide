const net = require('net');
const os = require('os');
const path = require('path')

const { ipcRenderer } = require('electron');

const electronEnv = {};

const urlParams = new URLSearchParams(decodeURIComponent(window.location.search));
window.id = Number(urlParams.get('windowId'));
const webContentsId = Number(urlParams.get('webContentsId'));

function createRPCNetConnection() {
  const rpcListenPath = ipcRenderer.sendSync('window-rpc-listen-path', electronEnv.currentWindowId);
  return net.createConnection(rpcListenPath);
}

function createNetConnection(connectPath) {
  return net.createConnection(connectPath);
}

electronEnv.ElectronIpcRenderer = ipcRenderer;
electronEnv.createNetConnection = createNetConnection;
electronEnv.createRPCNetConnection = createRPCNetConnection;

electronEnv.platform = os.platform();
electronEnv.osRelease = os.release();

electronEnv.isElectronRenderer = true;
electronEnv.BufferBridge = Buffer;
electronEnv.currentWindowId = window.id;
electronEnv.currentWebContentsId = webContentsId;
electronEnv.monacoWorkerPath = path.join(__dirname, 'editor.worker.bundle.js');

const metaData = JSON.parse(ipcRenderer.sendSync('window-metadata', electronEnv.currentWindowId));
electronEnv.metadata = metaData;
process.env = Object.assign({}, process.env, metaData.env, { WORKSPACE_DIR: metaData.workspace });

electronEnv.onigWasmPath = path.join(__dirname, '..', '..', '..', metaData.environment.isDev ? 'node_modules' : 'node_modules.asar.unpacked', 'vscode-oniguruma/release/onig.wasm' );
electronEnv.treeSitterWasmDirectoryPath = path.join(__dirname, '..', '..', '..', metaData.environment.isDev ? 'node_modules' : 'node_modules.asar.unpacked', '@opensumi/tree-sitter-wasm' );
electronEnv.appPath = metaData.appPath;
electronEnv.env = Object.assign({}, process.env);
electronEnv.webviewPreload = metaData.webview.webviewPreload;
electronEnv.plainWebviewPreload = metaData.webview.plainWebviewPreload;
electronEnv.env.EXTENSION_DIR = metaData.extensionDir[0];

global.electronEnv = electronEnv;
Object.assign(global, electronEnv);

if (metaData.preloads) {
  metaData.preloads.forEach((preload) => {
    require(preload);
  });
}
