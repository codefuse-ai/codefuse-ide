import { Injector, Autowired, INJECTOR_TOKEN } from '@opensumi/di'
import { Domain } from '@opensumi/ide-core-common'
import {
  ElectronMainApiRegistry,
  ElectronMainContribution,
  IElectronMainApp,
} from '@opensumi/ide-core-electron-main/lib/bootstrap/types';
import { ElectronMainApp } from '@opensumi/ide-core-electron-main';
import { IElectronMainLifeCycleService } from '@opensumi/ide-core-common/lib/electron';
import { WindowLifecycle } from './window-lifecycle'

@Domain(ElectronMainContribution)
export class WindowContribution implements ElectronMainContribution {
  @Autowired(INJECTOR_TOKEN)
  injector: Injector

  @Autowired(IElectronMainApp)
  electronApp: ElectronMainApp;

  registerMainApi(registry: ElectronMainApiRegistry): void {
    registry.registerMainApi(IElectronMainLifeCycleService, new WindowLifecycle(this.electronApp, this.injector));
  }
}
