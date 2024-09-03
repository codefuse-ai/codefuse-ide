import { Injectable, Provider, Injector } from '@opensumi/di';
import { ElectronMainModule } from '@opensumi/ide-core-electron-main/lib/electron-main-module';
import { ILogServiceManager, SupportLogNamespace } from '@opensumi/ide-logs';
import { LogServiceManager } from './log-manager'
import { ILogService } from '../common'

@Injectable()
export class LoggerModule extends ElectronMainModule {
  providers: Provider[] = [
    {
      token: ILogServiceManager,
      useClass: LogServiceManager,
    },
    {
      token: ILogService,
      useFactory: (injector: Injector) => {
        return (<LogServiceManager>injector.get(ILogServiceManager)).getLogger(SupportLogNamespace.Main)
      }
    }
  ];
}
