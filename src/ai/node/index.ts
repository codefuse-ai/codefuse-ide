import { Injectable } from '@opensumi/di';
import { AIBackSerivceToken } from '@opensumi/ide-core-common/lib/types/ai-native';
import { NodeModule } from '@opensumi/ide-core-node';
import { IShellIntegrationService } from '@opensumi/ide-terminal-next/lib/node/shell-integration.service';

import { AIBackService } from './ai-back.service'
import { AIModelServiceProxy, AIModelService } from './model.service'
import { ShellIntegrationService } from './shell-integration'
import { AIModelServicePath, IAIModelServiceProxy } from '../common'
import type { Provider } from '@opensumi/di';

@Injectable()
export class AIServiceModule extends NodeModule {
  providers: Provider[] = [
    {
      token: AIBackSerivceToken,
      useClass: AIBackService,
      override: true,
    },
    {
      token: IShellIntegrationService,
      useClass: ShellIntegrationService,
      override: true,
    },
    {
      token: AIModelService,
      useClass: AIModelService,
    },
    {
      token: IAIModelServiceProxy,
      useClass: AIModelServiceProxy,
    }
  ]

  backServices = [
    {
      servicePath: AIModelServicePath,
      token: IAIModelServiceProxy,
    }
  ]
}
