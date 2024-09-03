import { Injectable, Provider } from '@opensumi/di';
import { ElectronMainModule } from '@opensumi/ide-core-electron-main/lib/electron-main-module';
import { UpdateContribution } from './update.contribution'
import { UpdateMainService } from './update.service'
import { UpdateWindow } from './update-window';
import { AutoUpdaterService } from './auto-updater.service'


@Injectable()
export class AutoUpdaterModule extends ElectronMainModule {
  providers: Provider[] = [
    UpdateContribution,
    UpdateMainService,
    UpdateWindow,
    AutoUpdaterService,
  ];
}
