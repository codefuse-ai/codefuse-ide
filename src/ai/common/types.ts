export const AIModelServicePath = 'AIModelServicePath';

export const IAIModelServiceProxy = Symbol('IAIModelServiceProxy')

export interface IAIModelServiceProxy {
  setConfig(values: Record<string, any>): Promise<void>
}

export const ModelSettingId = {
  baseUrl: 'ai.model.baseUrl',
  apiKey: 'ai.model.apiKey',
  codeModelName: 'ai.model.code.modelName',
  codeSystemPrompt: 'ai.model.code.systemPrompt',
  codeFimTemplate: 'ai.model.code.fimTemplate',
  codeTemperature: 'ai.model.code.temperature',
  codeMaxTokens: 'ai.model.code.maxTokens',
  codePresencePenalty: 'ai.model.code.presencePenalty',
  codeFrequencyPenalty: 'ai.model.code.frequencyPenalty',
  codeTopP: 'ai.model.code.topP',
}

export type IModelConfig = Record<keyof typeof ModelSettingId, any>;
