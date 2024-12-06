import { Autowired, INJECTOR_TOKEN } from '@opensumi/di'
import { Domain } from '@opensumi/ide-core-common'
import { IElectronMainLifeCycleService } from '@opensumi/ide-core-common/lib/electron';
import {
  ElectronMainContribution,
  IElectronMainApp,
} from '@opensumi/ide-core-electron-main/lib/bootstrap/types';


import { WindowLifecycle } from './window-lifecycle'
import type { Injector} from '@opensumi/di';
import type { ElectronMainApp } from '@opensumi/ide-core-electron-main';
import type {
  ElectronMainApiRegistry} from '@opensumi/ide-core-electron-main/lib/bootstrap/types';

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
