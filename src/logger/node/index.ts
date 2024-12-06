import { Injectable } from '@opensumi/di';
import { NodeModule } from '@opensumi/ide-core-node';
import { ILogServiceManager } from '@opensumi/ide-logs';

import { LogServiceManager } from './log-manager'
import type { Provider } from '@opensumi/di';

@Injectable()
export class LoggerModule extends NodeModule {
  providers: Provider[] = [
    {
      token: ILogServiceManager,
      useClass: LogServiceManager,
      override: true,
    },
  ];
}
