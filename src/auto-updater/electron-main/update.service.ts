import { dialog, BrowserWindow, MessageBoxOptions } from 'electron'
import { Autowired, Injectable } from '@opensumi/di'
import { ElectronMainApiProvider } from '@opensumi/ide-core-electron-main'
import { ILogService } from '@/logger/common'
import { UpdateWindow } from './update-window'
import { IUpdateMainService, UpdateState } from '../common'
import { AutoUpdaterService } from './auto-updater.service'

@Injectable()
export class UpdateMainService extends ElectronMainApiProvider implements IUpdateMainService {
  @Autowired(AutoUpdaterService)
  private updaterService: AutoUpdaterService

  @Autowired(ILogService)
  logger: ILogService

  @Autowired(UpdateWindow)
  updateWindow: UpdateWindow

  #checkTimer: NodeJS.Timeout | null = null

  async checkForUpdatesManual(): Promise<void> {
    this.checkForUpdates({ manual: true })
  }

  async checkForUpdatesAuto(): Promise<void> {
    if (this.#checkTimer) {
      clearTimeout(this.#checkTimer)
    }
    const loopCheck = (first = true) => {
      this.#checkTimer = setTimeout(() => {
        this.checkForUpdates({ manual: false })
          .then(() => {
            loopCheck(false)
          })
      }, (first ? 10 : 3600) * 1000)
    }
    loopCheck()
  }

  async checkForUpdates({ manual = false }) {
    let { updateState } = this.updaterService
    this.logger.debug(`[auto-updater] checkForUpdates: ${manual ? '手动更新' : '自动更新'}, current updateState: ${updateState}`)

    if (
      updateState === UpdateState.NoAvailable ||
      updateState === UpdateState.CheckingError
    ) {
      await this.updaterService.checkForUpdates();
      ({ updateState } = this.updaterService)
    }

    switch (updateState) {
      case UpdateState.Available:
        if (this.#checkTimer) {
          clearTimeout(this.#checkTimer)
          this.#checkTimer = null;
        }
        if (manual || !this.updaterService.ignoreVersion.has(this.updaterService.updateInfo?.version!)) {
          this.updateWindow.openWindow()
        }
        break;
      case UpdateState.NoAvailable:
        if (manual) {
          await this.showCheckDialog({
            type: 'info',
            message: '当前没有可用的更新',
            buttons: ['确认']
          })
        }
        break;
      case UpdateState.CheckingError:
        if (manual) {
          await this.showCheckDialog({
            type: 'info',
            message: '检查更新出错，请稍后重试',
            buttons: ['确认']
          })
        }
        break;
      default:
        if (manual) {
          this.updateWindow.openWindow()
        }
        break;
    }
  }

  private async showCheckDialog(options: MessageBoxOptions) {
    const browserWindow = BrowserWindow.getFocusedWindow()
    if (browserWindow) {
      await dialog.showMessageBox(browserWindow, options)
    } else {
      await dialog.showMessageBox(options)
    }
  }
}
