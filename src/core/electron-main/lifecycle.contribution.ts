import { app } from 'electron'
import * as fs from 'node:fs/promises'
import { Autowired } from '@opensumi/di'
import { Domain } from '@opensumi/ide-core-common'
import { ILogService } from '@/logger/common'
import { ElectronMainContribution } from './types'
import { IEnvironmentService } from '../common'
import { StorageService } from './storage.service'
import { WindowsManager } from './window/windows-manager'

@Domain(ElectronMainContribution)
export class LifecycleContribution implements ElectronMainContribution {
  @Autowired(IEnvironmentService)
  environmentService: IEnvironmentService

  @Autowired(StorageService)
  storageService: StorageService;

  @Autowired(WindowsManager)
  windowsManager: WindowsManager

  @Autowired(ILogService)
  logger: ILogService

  async onWillStart() {
    this.setProcessEnv();
    await Promise.all([
      Promise.all([
        this.environmentService.logHome,
        this.environmentService.extensionsPath,
      ].map(filepath => filepath ? fs.mkdir(filepath, { recursive: true }) : null)),
      this.storageService.init(),
    ])
  }

  onStart() {
    this.windowsManager.createCodeWindow()

    app.on('activate', (_e, hasVisibleWindows) => {
      this.logger.debug('lifecycle#activate')
      if (!hasVisibleWindows) {
        this.windowsManager.createCodeWindow()
      }
    })
  }

  private setProcessEnv() {
    const { dataFolderName, logRoot, logHome, extensionsPath } = this.environmentService;
    process.env.IDE_VERSION = app.getVersion();
    process.env.IDE_DATA_FOLDER_NAME = dataFolderName;
    process.env.IDE_LOG_ROOT = logRoot
    process.env.IDE_LOG_HOME = logHome
    process.env.IDE_EXTENSIONS_PATH = extensionsPath
  }
}
