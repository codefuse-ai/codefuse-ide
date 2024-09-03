import { pipeline } from 'node:stream';
import { Autowired, Injectable } from '@opensumi/di';
import { ChatCompletionRequestMessage, ChatCompletionRequestMessageRoleEnum } from '@opensumi/ide-ai-native/lib/common';
import { IAIBackService, IAICompletionOption, IAIReportCompletionOption, IAIBackServiceOption } from '@opensumi/ide-core-common';
import { IAIBackServiceResponse, IChatContent } from '@opensumi/ide-core-common/lib/types/ai-native';
import { CancellationToken, INodeLogger } from '@opensumi/ide-core-node';
import { BaseAIBackService } from '@opensumi/ide-core-node/lib/ai-native/base-back.service';
import { SumiReadableStream } from '@opensumi/ide-utils/lib/stream';
import type { Response, fetch as FetchType } from 'undici-types';
import { ILogServiceManager } from '@opensumi/ide-logs';

import { ChatCompletionChunk, ChatCompletion } from './types';
import { AILocalModelService } from './local-model.service'

@Injectable()
export class AIBackService extends BaseAIBackService implements IAIBackService {
  private logger: INodeLogger

  @Autowired(ILogServiceManager)
  private readonly loggerManager: ILogServiceManager;

  @Autowired(AILocalModelService)
  localModelService: AILocalModelService

  private historyMessages: {
    role: ChatCompletionRequestMessageRoleEnum;
    content: string;
  }[] = [];

  constructor() {
    super();
    this.logger = this.loggerManager.getLogger('ai' as any);
  }

  override async request(input: string, options: IAIBackServiceOption, cancelToken?: CancellationToken): Promise<IAIBackServiceResponse> {
    // this.historyMessages.push({ role: ChatCompletionRequestMessageRoleEnum.User, content: input })
    // if (this.historyMessages.length > 50) {
    //   this.historyMessages = this.historyMessages.slice(-50)
    // }
    const message = [{ role: ChatCompletionRequestMessageRoleEnum.User, content: input }]

    const response = await this.fetchModel(message, {
      isCodeCompletion: false,
      stream: false,
    }, cancelToken);

    if (!response) {
      this.logger.log('ai request failed, ai local model config error');
      return {
        errorCode: 1,
        errorMsg: 'ai local model config error',
        data: ''
      }
    }

    const data = await response.json() as ChatCompletion
    const content = data?.choices?.[0]?.message?.content;

    if (content) {
      this.historyMessages.push({ role: ChatCompletionRequestMessageRoleEnum.Assistant, content });
    }

    return {
      errorCode: 0,
      data: content,
    }
  }

  override async requestStream(input: string, options: IAIBackServiceOption, cancelToken?: CancellationToken) {
    // this.historyMessages.push({ role: ChatCompletionRequestMessageRoleEnum.User, content: input })
    // if (this.historyMessages.length > 50) {
    //   this.historyMessages = this.historyMessages.slice(-50)
    // }
    const { chatSystemPrompt } = this.localModelService.config || {}
    const message = [
      ...(chatSystemPrompt ? [
        {
          role: ChatCompletionRequestMessageRoleEnum.System,
          content: chatSystemPrompt,
        },
      ] : []),
      { role: ChatCompletionRequestMessageRoleEnum.User, content: input }
    ]

    const response = await this.fetchModel(message, {
      isCodeCompletion: false,
      stream: true,
    }, cancelToken);

    const readableSteam = new SumiReadableStream<IChatContent>()

    if (!response) {
      readableSteam.emitError(new Error('ai local model config error'));
      readableSteam.end();
      return readableSteam
    }

    if (!response.body) {
      this.logger.log('ai request stream failed: no body');
      readableSteam.emitError(new Error('Readable Stream Abort'));
      readableSteam.end();
      return readableSteam
    }

    if (!response.ok) {
      this.logger.error(`ai request stream failed: status: ${response.status}, body: ${await response.text()}`);
      readableSteam.emitError(new Error('Readable Stream Abort'));
      readableSteam.end();
      return readableSteam
    }

    const { logger } = this;

    pipeline(response.body, async function* (readable) {
      const decoder = new TextDecoder();
      let remain = ''
      for await (const chunk of readable) {
        const line = remain + decoder.decode(chunk, { stream: true });
        const lines: string[] = line.split('\n');
        remain = lines.pop()!;
        for (const line of lines) {
          if (!line) continue;
          const data = line.slice(5).trim(); // data:
          if (data === '[DONE]') {
            return
          }
          let obj: ChatCompletionChunk | undefined;
          try {
            obj = JSON.parse(data);
          } catch (error) {
            logger.log('parse data failed', error);
          }
          if (!obj) continue;
          const choices = obj.choices || [];
          for (const choice of choices) {
            const content = choice?.delta?.content
            if (content) {
              readableSteam.emitData({
                kind: 'content',
                content,
              });
            }
          }
        }
      }
    }, (error: any) => {
      this.logger.error('ai request stream failed', error);
      if (error?.name === 'AbortError') {
        readableSteam.emitError(new Error('Readable Stream Abort'));
      } else {
        readableSteam.emitError(error);
      }
      readableSteam.end();
    })

    return readableSteam;
  }
  
  async requestCompletion(input: IAICompletionOption, cancelToken?: CancellationToken) {
    const { codeCompletionSystemPrompt, codeCompletionUserPrompt } = this.localModelService.config || {}
    if (!codeCompletionUserPrompt) {
      this.logger.warn('miss config.codeCompletionUserPrompt')
      return {
        sessionId: input.sessionId,
        codeModelList: [],
      }
    }
    const userContent = codeCompletionUserPrompt.replace('{prefix}', input.prompt).replace('{suffix}', input.suffix || '')
    const messages = [
      ...(codeCompletionSystemPrompt ? [
        {
          role: ChatCompletionRequestMessageRoleEnum.System,
          content: codeCompletionSystemPrompt,
        },
      ] : []),
      {
        role: ChatCompletionRequestMessageRoleEnum.User,
        content: userContent,
      }
    ]
    const response = await this.fetchModel(messages, {
      isCodeCompletion: true,
      stream: false,
    }, cancelToken);

    if (!response) {
      return {
        sessionId: input.sessionId,
        codeModelList: [],
      }
    }
    const data = await response.json() as ChatCompletion

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return {
        sessionId: input.sessionId,
        codeModelList: [],
      }
    }
    return {
      sessionId: input.sessionId,
      codeModelList: [{ content }],
    }
  }

  private async fetchModel(messages: ChatCompletionRequestMessage[], { isCodeCompletion = false, stream = false }, cancelToken?: CancellationToken): Promise<Response | null> {
    const controller = new AbortController();
    const signal = controller.signal;
    const { config } = this.localModelService
    if (!config || !config.completeUrl || !config.chatModelName) {
      if (!config) {
        this.logger.warn('miss config')
        return null
      }
      if (!config.completeUrl) {
        this.logger.warn('miss config.completeUrl')
        return null
      }
      if (!config.chatModelName) {
        this.logger.warn('miss config.modelName')
        return null
      }
    }

    cancelToken?.onCancellationRequested(() => {
      controller.abort();
    });

    return (fetch as typeof FetchType)(
      config.completeUrl,
      {
        signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          ...(config.apiKey ? {
            Authorization: `Bearer ${config.apiKey}`
          } : null),
        },
        body: JSON.stringify({
          model: isCodeCompletion ? (config.codeCompletionModelName || config.chatModelName) : config.chatModelName,
          messages: messages,
          stream,
          ...(isCodeCompletion ? {
            max_tokens: config.codeCompletionMaxTokens,
            temperature: config.codeCompletionTemperature,
            presence_penalty: config.codeCompletionPresencePenalty,
            top_p: config.codeCompletionTopP,
          } : {
            max_tokens: config.chatMaxTokens,
            temperature: config.chatTemperature,
            presence_penalty: config.chatPresencePenalty,
            top_p: config.chatTopP,
          })
        }),
      },
    );
  }
}
