import { BrowserWindow } from 'electron'
import { Autowired, Injectable } from '@opensumi/di'
import { Disposable } from '@opensumi/ide-core-common'
import path from 'node:path'
import { AutoUpdaterService } from './auto-updater.service'
import { IPC_CHANNEL } from '../common'

@Injectable()
export class UpdateWindow {
  #browserWindow: BrowserWindow | null = null
  private get browserWindow() {
    let win = this.#browserWindow
    if (!win || win.isDestroyed()) {
      win = this.createWindow()
      this.#browserWindow = win
    }
    return win;
  }

  @Autowired(AutoUpdaterService)
  autoUpdaterService: AutoUpdaterService

  openWindow() {
    const { browserWindow } = this
    browserWindow.show()
  }

  private createWindow() {
    const disposable = new Disposable()
    const win = new BrowserWindow({
      width: 620,
      height: 400,
      minWidth: 0,
      maxWidth: 0,
      resizable: false,
      fullscreenable: false,
      title: 'CodeFuse IDE Update',
      backgroundColor: '#ECECEC',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: true,
      },
    })
    if (__UPDATE_WINDOW_DEV_SERVER_URL__) {
      win.loadURL(__UPDATE_WINDOW_DEV_SERVER_URL__)
    } else {
      win.loadFile(path.join(__dirname, `../renderer/${__UPDATE_WINDOW_NAME__}/index.html`))
    }
    win.on('closed', () => {
      this.#browserWindow = null
      disposable.dispose()
    })
    const { webContents } = win
    const { ipc } = webContents
    ipc.handle(IPC_CHANNEL.initialState, () => {
      return {
        updateState: this.autoUpdaterService.updateState,
        updateInfo: this.autoUpdaterService.updateInfo,
        progressInfo: this.autoUpdaterService.progressInfo,
      }
    })
    ipc.handle(IPC_CHANNEL.downloadAndInstall, async () => {
      try {
        await this.autoUpdaterService.downloadUpdate()
      } catch {
        throw new Error('download error')
      }
    })
    ipc.on(IPC_CHANNEL.ignoreVersion, () => {
      this.autoUpdaterService.updateIgnoreVersion()
      this.#browserWindow?.close()
      this.#browserWindow = null
    })
    disposable.addDispose(
      this.autoUpdaterService.updateEvent((data) => {
        webContents.send(IPC_CHANNEL.eventData, data)
      })
    )

    return win;
  }
}
