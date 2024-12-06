import { Injectable } from '@opensumi/di';
import { ElectronMainModule } from '@opensumi/ide-core-electron-main/lib/electron-main-module';

import { LifecycleContribution } from './lifecycle.contribution'
import { StorageContribution, StorageService } from './storage.service';
import { ThemeContribution, ThemeService } from './theme.service';
import { IProduct, IEnvironmentService } from '../common'
import { EnvironmentService } from './environment.service'
import { AppMenuContribution, AppMenuService } from './menu.contribution'
import { WindowContribution } from './window/window.contribution'
import { WindowsManager } from './window/windows-manager'
import { WorkspaceHistoryContribution } from './workspace/workspace-history.contribution'

export * from './storage.service'

@Injectable()
export class CoreElectronMainModule extends ElectronMainModule {
  providers = [
    LifecycleContribution,
    StorageContribution,
    StorageService,
    ThemeContribution,
    ThemeService,
    AppMenuContribution,
    AppMenuService,
    WindowContribution,
    WindowsManager,
    WorkspaceHistoryContribution,
    {
      token: IProduct,
      useValue: __PRODUCT__,
    },
    {
      token: IEnvironmentService,
      useClass: EnvironmentService,
    },
  ];
}
