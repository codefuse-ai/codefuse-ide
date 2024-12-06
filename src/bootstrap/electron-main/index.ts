import '@/core/common/asar'
import '@/i18n'
import * as path from 'node:path';

import { URI } from '@opensumi/ide-core-common'
import { WebviewElectronMainModule } from '@opensumi/ide-webview/lib/electron-main';
import { app } from 'electron';

import { AutoUpdaterModule } from '@/auto-updater/electron-main'
import { ElectronMainApp , CoreElectronMainModule } from '@/core/electron-main'
import { LoggerModule } from '@/logger/electron-main'

const modules = [
  CoreElectronMainModule,
  WebviewElectronMainModule,
  LoggerModule,
  AutoUpdaterModule,
]

startMain();

function startMain() {
  const mainApp = new ElectronMainApp({
    modules,
    browserUrl: __CODE_WINDOW_DEV_SERVER_URL__ || URI.file(path.join(__dirname, `../renderer/${__CODE_WINDOW_NAME__}/index.html`)).toString(),
    browserPreload: path.resolve(__dirname, `../renderer/${__CODE_WINDOW_NAME__}/preload.js`),
    nodeEntry: path.join(__dirname, '../node/index.js'),
    extensionEntry: path.join(__dirname, '../ext-host/index.js'),
    extensionWorkerEntry: path.join(__dirname, '../ext-host/worker-host.js'),
    webviewPreload: path.join(__dirname, '../webview/host-preload.js'),
    plainWebviewPreload: path.join(__dirname, '../webview/plain-preload.js'),
    extensionDir: path.join(app.getAppPath(), 'extensions'),
    extensionCandidate: [],
    browserNodeIntegrated: true,
  })

  mainApp.start();
}
