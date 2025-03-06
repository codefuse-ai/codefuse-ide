import { Autowired } from '@opensumi/di'
import { AI_NATIVE_SETTING_GROUP_ID, localize, MaybePromise, Delayer, CommandService, AINativeSettingSectionsId } from '@opensumi/ide-core-common';
import { Domain, PreferenceContribution, PreferenceSchema, ClientAppContribution, IClientApp, PreferenceService, COMMON_COMMANDS, IPreferenceSettingsService } from '@opensumi/ide-core-browser'
import { ISettingRegistry, SettingContribution } from '@opensumi/ide-preferences';
import { AIModelServicePath, IAIModelServiceProxy, ModelSettingId } from '../common'
import { OutputChannel } from '@opensumi/ide-output/lib/browser/output.channel';
import { OutputService } from '@opensumi/ide-output/lib/browser/output.service';
import { MessageService } from '@opensumi/ide-overlay/lib/browser/message.service';

const ModelSettingIdKeys = Object.keys(ModelSettingId);

const aiNativePreferenceSchema: PreferenceSchema = {
  properties: {
    [ModelSettingId.baseUrl]: {
      type: 'string',
      defaultValue: 'http://127.0.0.1:11434/v1',
    },
    [ModelSettingId.apiKey]: {
      type: 'string',
    },
    [ModelSettingId.codeModelName]: {
      type: 'string',
      description: localize('preference.ai.model.code.modelName.tooltip')
    },
    [ModelSettingId.codeSystemPrompt]: {
      type: 'string',
    },
    [ModelSettingId.codeMaxTokens]: {
      type: 'number',
      minimum: 0,
      defaultValue: 64,
      description: localize('preference.ai.model.maxTokens.description'),
    },
    [ModelSettingId.codeTemperature]: {
      type: 'string',
      defaultValue: '0.20',
      description: localize('preference.ai.model.temperature.description'),
    },
    [ModelSettingId.codePresencePenalty]: {
      type: 'string',
      // minimum: -2.0,
      // maximum: 2.0,
      defaultValue: '1',
      description: localize('preference.ai.model.presencePenalty.description'),
    },
    [ModelSettingId.codeFrequencyPenalty]: {
      type: 'string',
      // minimum: -2.0,
      // maximum: 2.0,
      defaultValue: '1',
      description: localize('preference.ai.model.frequencyPenalty.description'),
    },
    [ModelSettingId.codeTopP]: {
      type: 'string',
      // minimum: 0,
      // maximum: 1,
      defaultValue: '1',
      description: localize('preference.ai.model.topP.description'),
    },
    [ModelSettingId.codeFimTemplate]: {
      type: 'string',
      description: localize('preference.ai.model.code.fimTemplate.tooltip'),
    },
  },
};

@Domain(ClientAppContribution, PreferenceContribution, SettingContribution)
export class AIModelContribution implements PreferenceContribution, SettingContribution, ClientAppContribution {
  schema = aiNativePreferenceSchema;

  @Autowired(PreferenceService)
  private readonly preferenceService: PreferenceService;

  @Autowired(AIModelServicePath)
  modelService: IAIModelServiceProxy

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
    ModelSettingIdKeys.forEach((idKey) => {
      values[idKey] = this.preferenceService.getValid(ModelSettingId[idKey])
      this.preferenceService.onSpecificPreferenceChange(ModelSettingId[idKey], (change) => {
        values[idKey] = change.newValue
        delayer.trigger(() => this.setModeConfig(values))
      })
    })
    delayer.trigger(() => this.setModeConfig(values));
    this.checkModelConfig();
  }

  registerSetting(registry: ISettingRegistry): void {
    registry.registerSettingSection(AI_NATIVE_SETTING_GROUP_ID, {
      title: localize('preference.ai.model.title'),
      preferences: [
        {
          id: ModelSettingId.baseUrl,
          localized: 'preference.ai.model.baseUrl',
        },
        {
          id: ModelSettingId.apiKey,
          localized: 'preference.ai.model.apiKey',
        },
        {
          id: ModelSettingId.codeModelName,
          localized: 'preference.ai.model.code.modelName',
        },
        {
          id: ModelSettingId.codeSystemPrompt,
          localized: 'preference.ai.model.code.systemPrompt',
        },
        {
          id: ModelSettingId.codeMaxTokens,
          localized: 'preference.ai.model.code.maxTokens',
        },
        {
          id: ModelSettingId.codeTemperature,
          localized: 'preference.ai.model.code.temperature',
        },
        {
          id: ModelSettingId.codePresencePenalty,
          localized: 'preference.ai.model.code.presencePenalty',
        },
        {
          id: ModelSettingId.codeFrequencyPenalty,
          localized: 'preference.ai.model.code.frequencyPenalty',
        },
        {
          id: ModelSettingId.codeTopP,
          localized: 'preference.ai.model.code.topP',
        },
        {
          id: ModelSettingId.codeFimTemplate,
          localized: 'preference.ai.model.code.fimTemplate',
        },
      ],
    });
  }

  private async checkModelConfig() {
    const requirePreference = [
      AINativeSettingSectionsId.DeepseekApiKey,
      AINativeSettingSectionsId.OpenaiApiKey,
      AINativeSettingSectionsId.AnthropicApiKey,
    ];

    const hasRequirePreference = requirePreference.some(preference => !!this.preferenceService.getValid(preference));
    if (!hasRequirePreference) {
      this.preferenceService.has(AINativeSettingSectionsId.DeepseekApiKey);
      const res = await this.messageService.info(localize('ai.model.noConfig'), [
        localize('ai.model.go')
      ]);
      if (res === localize('ai.model.go')) {
        await this.commandService.executeCommand(COMMON_COMMANDS.OPEN_PREFERENCES.id)
        this.preferenceSettingsService.scrollToPreference(AINativeSettingSectionsId.LLMModelSelection);
      }
    }
  }

  private setModeConfig(values: Record<string, any>) {
    this.modelService.setConfig(values)
    this.output.appendLine(`model config: ${JSON.stringify(values, null, 2)}`)
  }
}
