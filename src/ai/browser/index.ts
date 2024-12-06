import { Injectable } from "@opensumi/di";
import { BrowserModule } from "@opensumi/ide-core-browser";

import { AIModelContribution } from "./ai-model.contribution";
import { AINativeContribution } from "./ai-native.contribution";
import { AIRunContribution } from "./ai-run.contribution";
import { AICommandPromptManager } from "./command/command-prompt-manager";
import { AICommandService } from "./command/command.service";
import { InlineChatOperationModel } from "./inline-chat-operation";
import { AIModelServicePath } from "../common";

export * from "./constants";

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
    },
  ];
}
