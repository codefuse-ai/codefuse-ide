import { Autowired } from "@opensumi/di";
import {
  ClientAppContribution,
  Domain,
  ProgressLocation,
} from "@opensumi/ide-core-browser";
import { IProgressService } from "@opensumi/ide-core-browser/lib/progress";
import { DebugConfigurationManager } from "@opensumi/ide-debug/lib/browser/debug-configuration-manager";
import { MessageService } from "@opensumi/ide-overlay/lib/browser/message.service";

import { AiRunService } from "./ai-run.service";
import type { MaybePromise } from "@opensumi/ide-core-browser";

@Domain(ClientAppContribution)
export class AIRunContribution implements ClientAppContribution {
  @Autowired(MessageService)
  protected readonly messageService: MessageService;
  @Autowired(DebugConfigurationManager)
  private readonly debugConfigurationManager: DebugConfigurationManager;
  @Autowired(AiRunService)
  private readonly aiRunService: AiRunService;
  @Autowired(IProgressService)
  private readonly progressService: IProgressService;

  onDidStart(): MaybePromise<void> {
    this.registerDebugConfiguration();
  }

  async registerDebugConfiguration() {
    this.debugConfigurationManager.registerInternalDebugConfigurationProvider(
      "ai-native",
      {
        type: "ai-native",
        label: "AI 生成配置",
        provideDebugConfigurations: async () => {
          const aiConfig = await this.progressService.withProgress(
            {
              location: ProgressLocation.Notification,
              title: "AI 配置生成中",
            },
            async () => {
              return this.aiRunService.getNodejsDebugConfigurations();
            },
          );

          if (!aiConfig || aiConfig.length === 0) {
            this.messageService.info("AI 配置生成失败");
          } else {
            this.messageService.info("AI 配置生成成功");
          }

          return aiConfig || [];
        },
      },
    );
    this.debugConfigurationManager.registerInternalDebugConfigurationOverride(
      "pwa-node",
      {
        type: "pwa-node",
        label: "Node.js 项目自动生成",
        popupHint: "通过 Node.js Debug 提供的服务自动分析项目，生成运行配置",
      },
    );
  }
}
