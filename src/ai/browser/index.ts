import { BrowserModule } from '@opensumi/ide-core-browser';
import { Injectable } from '@opensumi/di';

import { AINativeContribution } from './ai-native.contribution'
import { AIRunContribution } from './ai-run.contribution'
import { AICommandPromptManager } from './command/command-prompt-manager'
import { AICommandService } from './command/command.service'
import { InlineChatOperationModel } from './inline-chat-operation'
import { AIModelContribution } from './ai-model.contribution'
import { AIModelServicePath } from '../common'

export * from './constants'

@Injectable()
export class AIFeatureModule extends BrowserModule {
  providers = [
    AINativeContribution,
    AIRunContribution,
    AICommandPromptManager,
    AICommandService,
    InlineChatOperationModel,
    AIModelContribution,
  ];

  backServices = [
    {
      servicePath: AIModelServicePath,
    }
  ]
}
