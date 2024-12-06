import { Autowired } from '@opensumi/di'
import { Domain } from '@opensumi/ide-core-common'


import { UpdateWindow } from './update-window'
import { UpdateMainService } from './update.service'
import { IUpdateMainService } from '../common'
import { ElectronMainContribution} from '@/core/electron-main'
import type { MaybePromise } from '@opensumi/ide-core-common';
import type { ElectronMainApiRegistry } from '@opensumi/ide-core-electron-main'

@Domain(ElectronMainContribution)
export class UpdateContribution implements ElectronMainContribution {
  @Autowired(UpdateMainService)
  updateMainService: UpdateMainService

  @Autowired(UpdateWindow)
  updateWindow: UpdateWindow

  onStart(): MaybePromise<void> {
    this.updateMainService.checkForUpdatesAuto()
  }

  registerMainApi(registry: ElectronMainApiRegistry): void {
    registry.registerMainApi(IUpdateMainService, this.updateMainService);
  }
}
