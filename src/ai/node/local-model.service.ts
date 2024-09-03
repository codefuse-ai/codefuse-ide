import { Injectable, Autowired } from '@opensumi/di';
import { INodeLogger } from '@opensumi/ide-core-node'
import { IAILocalModelServiceProxy, ILocalModelConfig } from '../common'
import { ILogServiceManager } from '@opensumi/ide-logs';

@Injectable()
export class AILocalModelService {
  private logger: INodeLogger

  @Autowired(ILogServiceManager)
  private readonly loggerManager: ILogServiceManager;

  #config: ILocalModelConfig | undefined

  constructor() {
    this.logger = this.loggerManager.getLogger('ai' as any);
  }

  get config(): ILocalModelConfig | undefined {
    const config = this.#config
    if (!config) return
    return {
      ...config,
      chatTemperature: this.coerceNumber(config.chatTemperature, 0, 1, 0.2),
      chatPresencePenalty: this.coerceNumber(config.chatPresencePenalty, -2, 2, 1),
      chatTopP: this.coerceNumber(config.chatTopP, 0, 1, 0.95),
      codeCompletionTemperature: this.coerceNumber(config.codeCompletionTemperature, 0, 1, 0.2),
      codeCompletionPresencePenalty: this.coerceNumber(config.codeCompletionPresencePenalty, -2, 2, 1),
      codeCompletionTopP: this.coerceNumber(config.codeCompletionTopP, 0, 1, 0.95),
    }
  }

  async setConfig(config: ILocalModelConfig): Promise<void> {
    this.#config = config;
    this.logger.log('[local model config]', JSON.stringify(config));
  }

  private coerceNumber(value: string | number, min: number, max: number, defaultValue: number) {
    const num = Number(value)
    if (isNaN(num)) return defaultValue
    if (num < min || num > max) return defaultValue
    return num
  }
}

@Injectable()
export class AILocalModelServiceProxy implements IAILocalModelServiceProxy {
  @Autowired(AILocalModelService)
  private readonly localModelService: AILocalModelService;

  async setConfig(config: ILocalModelConfig): Promise<void> {
    this.localModelService.setConfig(config)
  }
}
