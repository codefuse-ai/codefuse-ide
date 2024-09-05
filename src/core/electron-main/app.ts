import { app, dialog } from 'electron';
import { Injector } from '@opensumi/di'
import { ElectronMainApp as BaseElectronMainApp, ElectronAppConfig } from '@opensumi/ide-core-electron-main';
import { ILogService } from '@/logger/common'
import { ElectronMainContribution } from './types'
import { isMacintosh } from '@opensumi/ide-core-common';
import { WindowsManager } from './window/windows-manager';

export class ElectronMainApp {
  private injector = new Injector;
  private baseApp: BaseElectronMainApp;
  private logger: ILogService
  private pendingQuit = false;

  constructor(config: ElectronAppConfig) {
    this.baseApp = new BaseElectronMainApp({
      ...config,
      injector: this.injector,
    })
    this.logger = this.injector.get(ILogService);
    for (const contribution of this.contributions) {
      if (contribution.onBeforeReady) {
        contribution.onBeforeReady();
      }
    }
  }

  get contributions() {
    return this.baseApp.contributions as ElectronMainContribution[];
  }

  async start() {
    this.logger.log('start')
    await app.whenReady();
    this.registerListenerAfterReady()

    this.logger.log('trigger onWillStart')
    await Promise.all(this.contributions.map(contribution => contribution.onWillStart?.()))
    this.claimInstance();
    this.moveToApplication()

    this.logger.log('trigger onStart')
    await Promise.all(this.contributions.map(contribution => contribution.onStart?.()))
  }

  private registerListenerAfterReady() {
    const handleBeforeQuit = () => {
      if (this.pendingQuit) return
      this.logger.debug('lifecycle#before-quit')
      this.pendingQuit = true;
    }
    app.on('before-quit', handleBeforeQuit)

    const handleWindowAllClose = () => {
      this.logger.debug('lifecycle#window-all-closed')
      if (this.pendingQuit || !isMacintosh) {
        app.quit();
      }
    }
    app.on('window-all-closed', handleWindowAllClose);

    app.once('will-quit', (e) => {
      e.preventDefault()
      Promise.allSettled(this.contributions.map(contribution => contribution.onWillQuit?.()))
        .finally(() => {
          app.removeListener('before-quit', handleBeforeQuit)
          app.removeListener('window-all-closed', handleWindowAllClose)
          this.logger.debug('lifecycle#will-quit')
          setTimeout(() => {
            app.quit()
          })
        })
    })
  }

  private claimInstance() {
    const gotTheLock = app.requestSingleInstanceLock({ pid: process.pid })
    this.logger.log('gotTheLock:', gotTheLock, process.pid)
    if (!gotTheLock) {
      app.exit()
    } else {
      app.on('second-instance', (_event, argv, workingDirectory, additionalData) => {
        this.logger.log('second-instance', argv, workingDirectory, additionalData)
        if (isMacintosh) {
          app.focus({ steal: true });
        }
        this.injector.get(WindowsManager).createCodeWindow()
      })
    }
  }

  private moveToApplication() {
    if (process.platform !== 'darwin' || !app.isPackaged || app.isInApplicationsFolder()) return
    const chosen = dialog.showMessageBoxSync({
      type: 'question',
      buttons: ['移动', '不移动'],
      message: '是否移动到 Applications 目录',
      defaultId: 0,
      cancelId: 1,
    })

    if (chosen !== 0) return

    try {
      app.moveToApplicationsFolder({
        conflictHandler: (conflictType) => {
          if (conflictType === 'existsAndRunning') {
            dialog.showMessageBoxSync({
              type: 'info',
              message: '无法移动到 Applications 目录',
              detail:
                'Applications 目录已运行另一个版本的 CodeFuse IDE，请先关闭后重试。',
            })
          }
          return true
        },
      })
    } catch (err: any) {
      this.logger.error(`Failed to move to applications folder: ${err?.message}}`)
    }
  }
}
