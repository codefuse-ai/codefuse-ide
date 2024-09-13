import { Injectable, Autowired } from '@opensumi/di';
import { INodeLogger } from '@opensumi/ide-core-node'
import { IAIModelServiceProxy, IModelConfig } from '../common'
import { ILogServiceManager } from '@opensumi/ide-logs';

@Injectable()
export class AIModelService {
  private logger: INodeLogger

  @Autowired(ILogServiceManager)
  private readonly loggerManager: ILogServiceManager;

  #config: IModelConfig | undefined

  constructor() {
    this.logger = this.loggerManager.getLogger('ai' as any);
  }

  get config(): IModelConfig | undefined {
    const config = this.#config
    if (!config) return
    return {
      ...config,
      chatTemperature: this.coerceNumber(config.chatTemperature, 0, 1, 0.2),
      chatPresencePenalty: this.coerceNumber(config.chatPresencePenalty, -2, 2, 1),
      chatFrequencyPenalty: this.coerceNumber(config.chatFrequencyPenalty, -2, 2, 1),
      chatTopP: this.coerceNumber(config.chatTopP, 0, 1, 0.95),
      codeTemperature: this.coerceNumber(config.codeTemperature, 0, 1, 0.2),
      codePresencePenalty: this.coerceNumber(config.codePresencePenalty, -2, 2, 1),
      codeFrequencyPenalty: this.coerceNumber(config.codeFrequencyPenalty, -2, 2, 1),
      codeTopP: this.coerceNumber(config.codeTopP, 0, 1, 0.95),
    }
  }

  async setConfig(config: IModelConfig): Promise<void> {
    this.#config = config;
    this.logger.log('[model config]', JSON.stringify(config));
  }

  private coerceNumber(value: string | number, min: number, max: number, defaultValue: number) {
    const num = Number(value)
    if (isNaN(num)) return defaultValue
    if (num < min || num > max) return defaultValue
    return num
  }
}

@Injectable()
export class AIModelServiceProxy implements IAIModelServiceProxy {
  @Autowired(AIModelService)
  private readonly modelService: AIModelService;

  async setConfig(config: IModelConfig): Promise<void> {
    this.modelService.setConfig(config)
  }
}
