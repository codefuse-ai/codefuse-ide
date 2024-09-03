import { Autowired } from '@opensumi/di'
import { Domain, MaybePromise } from '@opensumi/ide-core-common'
import { ElectronMainApiRegistry } from '@opensumi/ide-core-electron-main'
import { ElectronMainContribution} from '@/core/electron-main'
import { UpdateMainService } from './update.service'
import { UpdateWindow } from './update-window'
import { IUpdateMainService } from '../common'

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
