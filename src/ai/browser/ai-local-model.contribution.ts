import { Autowired } from '@opensumi/di'
import { AI_NATIVE_SETTING_GROUP_ID, localize, MaybePromise, Delayer, CommandService } from '@opensumi/ide-core-common';
import { Domain, PreferenceContribution, PreferenceSchema, ClientAppContribution, IClientApp, PreferenceService, COMMON_COMMANDS, IPreferenceSettingsService } from '@opensumi/ide-core-browser'
import { ISettingRegistry, SettingContribution } from '@opensumi/ide-preferences';
import { AILocalModelServicePath, IAILocalModelServiceProxy, LocalModelSettingId } from '../common'
import { OutputChannel } from '@opensumi/ide-output/lib/browser/output.channel';
import { OutputService } from '@opensumi/ide-output/lib/browser/output.service';
import { MessageService } from '@opensumi/ide-overlay/lib/browser/message.service';

const LocalModelSettingIdKeys = Object.keys(LocalModelSettingId);

const aiNativePreferenceSchema: PreferenceSchema = {
  properties: {
    [LocalModelSettingId.completeUrl]: {
      type: 'string',
      defaultValue: 'http://127.0.0.1:11434/v1/chat/completions',
    },
    [LocalModelSettingId.apiKey]: {
      type: 'string',
    },
    [LocalModelSettingId.chatModelName]: {
      type: 'string',
    },
    [LocalModelSettingId.chatSystemPrompt]: {
      type: 'string',
    },
    [LocalModelSettingId.chatTemperature]: {
      type: 'string',
      // minimum: 0,
      // maximum: 1,
      defaultValue: '0.20',
      description: localize('preference.ai.native.local_model.temperature.description'),
    },
    [LocalModelSettingId.chatMaxTokens]: {
      type: 'number',
      minimum: 0,
      defaultValue: 1024,
      description: localize('preference.ai.native.local_model.max_tokens.description'),
    },
    [LocalModelSettingId.chatPresencePenalty]: {
      type: 'string',
      // minimum: -2.0,
      // maximum: 2.0,
      defaultValue: '1.0',
      description: localize('preference.ai.native.local_model.presence_penalty.description'),
    },
    [LocalModelSettingId.chatTopP]: {
      type: 'string',
      // minimum: 0,
      // maximum: 1,
      defaultValue: '1',
      description: localize('preference.ai.native.local_model.top_p.description'),
    },
    [LocalModelSettingId.codeCompletionModelName]: {
      type: 'string',
      description: localize('preference.ai.native.local_model.code_completion.model_name.tooltip')
    },
    [LocalModelSettingId.codeCompletionSystemPrompt]: {
      type: 'string',
    },
    [LocalModelSettingId.codeCompletionUserPrompt]: {
      type: 'string',
      defaultValue: '<｜fim▁begin｜>{prefix}<｜fim▁hole｜>{suffix}<｜fim▁end｜>',
      description: localize('preference.ai.native.local_model.code_completion.user_prompt.tooltip'),
    },
    [LocalModelSettingId.codeCompletionTemperature]: {
      type: 'string',
      defaultValue: '0.20',
      description: localize('preference.ai.native.local_model.max_tokens.description'),
    },
    [LocalModelSettingId.codeCompletionMaxTokens]: {
      type: 'number',
      minimum: 0,
      defaultValue: 64,
      description: localize('preference.ai.native.local_model.max_tokens.description'),
    },
    [LocalModelSettingId.codeCompletionPresencePenalty]: {
      type: 'string',
      // minimum: -2.0,
      // maximum: 2.0,
      defaultValue: '1.0',
      description: localize('preference.ai.native.local_model.presence_penalty.description'),
    },
    [LocalModelSettingId.codeCompletionTopP]: {
      type: 'string',
      // minimum: 0,
      // maximum: 1,
      defaultValue: '1',
      description: localize('preference.ai.native.local_model.top_p.description'),
    },
  },
};

@Domain(ClientAppContribution, PreferenceContribution, SettingContribution)
export class AILocalModelContribution implements PreferenceContribution, SettingContribution, ClientAppContribution {
  schema = aiNativePreferenceSchema;

  @Autowired(PreferenceService)
  private readonly preferenceService: PreferenceService;

  @Autowired(AILocalModelServicePath)
  localModelService: IAILocalModelServiceProxy

  @Autowired(MessageService)
  messageService: MessageService;

  @Autowired(OutputService)
  outputService: OutputService;

  @Autowired(CommandService)
  commandService: CommandService

  @Autowired(IPreferenceSettingsService)
  preferenceSettingsService: IPreferenceSettingsService

  #output: OutputChannel

  get output() {
    if (!this.#output) {
      this.#output = this.outputService.getChannel('AI Native')
    }
    return this.#output
  }

  onDidStart(app: IClientApp): MaybePromise<void> {
    const delayer = new Delayer(100);
    const values: Record<string, any> = {}
    LocalModelSettingIdKeys.forEach((idKey) => {
      values[idKey] = this.preferenceService.getValid(LocalModelSettingId[idKey])
      this.preferenceService.onSpecificPreferenceChange(LocalModelSettingId[idKey], (change) => {
        values[idKey] = change.newValue
        delayer.trigger(() => this.setLocalModeConfig(values))
      })
    })
    this.checkModelConfig(values).then((valid) => {
      if (valid) {
        delayer.trigger(() => this.setLocalModeConfig(values))
      }
    })
  }

  registerSetting(registry: ISettingRegistry): void {
    registry.registerSettingSection(AI_NATIVE_SETTING_GROUP_ID, {
      title: localize('preference.ai.native.local_model.title'),
      preferences: [
        {
          id: LocalModelSettingId.completeUrl,
          localized: 'preference.ai.native.local_model.complete_url',
        },
        {
          id: LocalModelSettingId.apiKey,
          localized: 'preference.ai.native.local_model.api_key',
        },
        {
          id: LocalModelSettingId.chatModelName,
          localized: 'preference.ai.native.local_model.chat.model_name',
        },
        {
          id: LocalModelSettingId.chatSystemPrompt,
          localized: 'preference.ai.native.local_model.chat.system_prompt',
        },
        {
          id: LocalModelSettingId.chatTemperature,
          localized: 'preference.ai.native.local_model.chat.temperature',
        },
        {
          id: LocalModelSettingId.chatMaxTokens,
          localized: 'preference.ai.native.local_model.chat.max_tokens',
        },
        {
          id: LocalModelSettingId.chatPresencePenalty,
          localized: 'preference.ai.native.local_model.chat.presence_penalty',
        },
        {
          id: LocalModelSettingId.chatTopP,
          localized: 'preference.ai.native.local_model.chat.top_p',
        },
        {
          id: LocalModelSettingId.codeCompletionModelName,
          localized: 'preference.ai.native.local_model.code_completion.model_name',
        },
        {
          id: LocalModelSettingId.codeCompletionSystemPrompt,
          localized: 'preference.ai.native.local_model.code_completion.system_prompt',
        },
        {
          id: LocalModelSettingId.codeCompletionUserPrompt,
          localized: 'preference.ai.native.local_model.code_completion.user_prompt',
        },
        {
          id: LocalModelSettingId.codeCompletionTemperature,
          localized: 'preference.ai.native.local_model.code_completion.temperature',
        },
        {
          id: LocalModelSettingId.codeCompletionMaxTokens,
          localized: 'preference.ai.native.local_model.code_completion.max_tokens',
        },
        {
          id: LocalModelSettingId.codeCompletionPresencePenalty,
          localized: 'preference.ai.native.local_model.code_completion.presence_penalty',
        },
        {
          id: LocalModelSettingId.codeCompletionTopP,
          localized: 'preference.ai.native.local_model.code_completion.top_p',
        },
      ],
    });
  }

  private async checkModelConfig(values: Record<string, any>) {
    if (values.completeUrl && values.chatModelName) {
      return true
    }
    const res = await this.messageService.info(localize('ai.local_model.noConfig'), [
      localize('ai.local_model.go')
    ])
    if (res === localize('ai.local_model.go')) {
      await this.commandService.executeCommand(COMMON_COMMANDS.OPEN_PREFERENCES.id)
      this.preferenceSettingsService.scrollToPreference(LocalModelSettingId.completeUrl)
    }
    return false
  }

  private setLocalModeConfig(values: Record<string, any>) {
    this.localModelService.setConfig(values)
    this.output.appendLine(`local model config: ${JSON.stringify(values, null, 2)}`)
  }
}
