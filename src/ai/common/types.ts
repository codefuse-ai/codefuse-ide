export const AILocalModelServicePath = 'AILocalModelServicePath';

export const IAILocalModelServiceProxy = Symbol('IAILocalModelServiceProxy')

export interface IAILocalModelServiceProxy {
  setConfig(values: Record<string, any>): Promise<void>
}

export const LocalModelSettingId = {
  completeUrl: 'ai.native.local_model.complete_url',
  apiKey: 'ai.native.local_model.api_key',
  chatModelName: 'ai.native.local_model.chat.model_name',
  chatSystemPrompt: 'ai.native.local_model.chat.system_prompt',
  chatTemperature: 'ai.native.local_model.chat.temperature',
  chatMaxTokens: 'ai.native.local_model.chat.max_tokens',
  chatPresencePenalty: 'ai.native.local_model.chat.presence_penalty',
  chatTopP: 'ai.native.local_model.chat.top_p',
  codeCompletionModelName: 'ai.native.local_model.code_completion.model_name',
  codeCompletionSystemPrompt: 'ai.native.local_model.code_completion.system_prompt',
  codeCompletionUserPrompt: 'ai.native.local_model.code_completion.user_prompt',
  codeCompletionTemperature: 'ai.native.local_model.code_completion.temperature',
  codeCompletionMaxTokens: 'ai.native.local_model.code_completion.max_tokens',
  codeCompletionPresencePenalty: 'ai.native.local_model.code_completion.presence_penalty',
  codeCompletionTopP: 'ai.native.local_model.code_completion.top_p',
}

export type ILocalModelConfig = Record<keyof typeof LocalModelSettingId, any>;
