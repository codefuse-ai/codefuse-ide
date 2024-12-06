import { Injectable } from '@opensumi/di';
import { ElectronMainModule } from '@opensumi/ide-core-electron-main/lib/electron-main-module';

import { AutoUpdaterService } from './auto-updater.service'
import { UpdateWindow } from './update-window';
import { UpdateContribution } from './update.contribution'
import { UpdateMainService } from './update.service'
import type { Provider } from '@opensumi/di';


@Injectable()
export class AutoUpdaterModule extends ElectronMainModule {
  providers: Provider[] = [
    UpdateContribution,
    UpdateMainService,
    UpdateWindow,
    AutoUpdaterService,
  ];
}
