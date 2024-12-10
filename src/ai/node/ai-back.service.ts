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

import { ChatCompletionChunk, ChatCompletion, Completion } from './types';
import { AIModelService } from './model.service'

@Injectable()
export class AIBackService extends BaseAIBackService implements IAIBackService {
  private logger: INodeLogger

  @Autowired(ILogServiceManager)
  private readonly loggerManager: ILogServiceManager;

  @Autowired(AIModelService)
  modelService: AIModelService

  private historyMessages: {
    role: ChatCompletionRequestMessageRoleEnum;
    content: string;
  }[] = [];

  constructor() {
    super();
    this.logger = this.loggerManager.getLogger('ai' as any);
  }

  override async request(input: string, options: IAIBackServiceOption, cancelToken?: CancellationToken): Promise<IAIBackServiceResponse> {
    const config = this.checkConfig()
    if (!config) {
      return {
        errorCode: 1,
        errorMsg: 'miss config',
        data: ''
      }
    }

    const messages = [
      ...(config.chatSystemPrompt ? [
        {
          role: ChatCompletionRequestMessageRoleEnum.System,
          content: config.chatSystemPrompt,
        },
      ] : []),
      { role: ChatCompletionRequestMessageRoleEnum.User, content: input }
    ]

    const response = await this.fetchModel(
      this.getCompletionUrl(config.baseUrl),
      {
        model: config.chatModelName,
        messages,
        stream: false,
        max_tokens: config.chatMaxTokens,
        temperature: config.chatTemperature,
        presence_penalty: config.chatPresencePenalty,
        frequency_penalty: config.codeFrequencyPenalty,
        top_p: config.chatTopP,
      },
      cancelToken
    );

    if (!response.ok) {
      this.logger.error(`ai request failed: status: ${response.status}, body: ${await response.text()}`);
      return {
        errorCode: 1,
        errorMsg: `request failed: ${response.status}`,
      }
    }

    try {
      const data = await response.json() as ChatCompletion
      const content = data?.choices?.[0]?.message?.content;

      return {
        errorCode: 0,
        data: content,
      }
    } catch (err: any) {
      this.logger.error(`ai request body parse error: ${err?.message}`);
      throw err
    }
  }

  override async requestStream(input: string, options: IAIBackServiceOption, cancelToken?: CancellationToken) {
    const readableSteam = new SumiReadableStream<IChatContent>()

    const config = this.checkConfig()
    if (!config) {
      readableSteam.emitError(new Error('miss config'));
      readableSteam.end();
      return readableSteam
    }
    const messages = [
      ...(config.chatSystemPrompt ? [
        {
          role: ChatCompletionRequestMessageRoleEnum.System,
          content: config.chatSystemPrompt,
        },
      ] : []),
      { role: ChatCompletionRequestMessageRoleEnum.User, content: input }
    ]

    const response = await this.fetchModel(
      this.getCompletionUrl(config.baseUrl),
      {
        model: config.chatModelName,
        messages,
        stream: true,
        max_tokens: config.chatMaxTokens,
        temperature: config.chatTemperature,
        presence_penalty: config.chatPresencePenalty,
        frequency_penalty: config.codeFrequencyPenalty,
        top_p: config.chatTopP,
      },
      cancelToken,
    )

    if (!response.ok) {
      this.logger.error(`ai request stream failed: status: ${response.status}, body: ${await response.text()}`);
      readableSteam.emitError(new Error('Readable Stream Abort'));
      readableSteam.end();
      return readableSteam
    }

    if (!response.body) {
      this.logger.log('ai request stream failed: no body');
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
    const config = this.checkConfig(true)
    if (!config) {
      return {
        sessionId: input.sessionId,
        codeModelList: [],
      }
    }

    const response = await this.fetchModel(
      this.getCompletionUrl(config.baseUrl, !config.codeFimTemplate),
      {
        stream: false,
        model: config.codeModelName || config.chatModelName,
        max_tokens: config.codeMaxTokens,
        temperature: config.codeTemperature,
        presence_penalty: config.codePresencePenalty,
        frequency_penalty: config.codeFrequencyPenalty,
        top_p: config.codeTopP,
        ...(config.codeFimTemplate ? {
          messages: [
            ...(config.codeSystemPrompt ? [
              {
                role: ChatCompletionRequestMessageRoleEnum.System,
                content: config.codeSystemPrompt,
              },
            ] : []),
            {
              role: ChatCompletionRequestMessageRoleEnum.User,
              content: config.codeFimTemplate.replace('{prefix}', input.prompt).replace('{suffix}', input.suffix || ''),
            }
          ]
        } : {
          prompt: input.prompt,
          suffix: input.suffix,
        })
      },
      cancelToken
    );

    if (!response.ok) {
      this.logger.error(`ai request completion failed: status: ${response.status}, body: ${await response.text()}`);
      return {
        sessionId: input.sessionId,
        codeModelList: [],
      }
    }

    try {
      const data = await response.json() as ChatCompletion | Completion
      const content = config.codeFimTemplate ? (data as ChatCompletion)?.choices?.[0]?.message?.content : (data as Completion)?.choices?.[0]?.text;
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
    } catch (err: any) {
      this.logger.error(`ai request completion body parse error: ${err?.message}`);
      throw err
    }
  }

  private checkConfig(isCodeCompletion = false) {
    const { config } = this.modelService
    if (!config) {
      this.logger.warn('miss config')
      return null
    }
    if (!config.baseUrl) {
      this.logger.warn('miss config baseUrl')
      return null
    }
    const modelName = isCodeCompletion ? (config.codeModelName || config.chatModelName) : config.chatModelName
    if (!modelName) {
      this.logger.warn('miss config modelName')
      return null
    }
    return config
  }

  private async fetchModel(url: string | URL, body: Record<string, any>, cancelToken?: CancellationToken): Promise<Response> {
    const controller = new AbortController();
    const signal = controller.signal;

    const { config } = this.modelService

    cancelToken?.onCancellationRequested(() => {
      controller.abort();
    });

    return fetch(
      url,
      {
        signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          ...(config?.apiKey ? {
            Authorization: `Bearer ${config.apiKey}`
          } : null),
        },
        body: JSON.stringify(body),
      },
    ) as unknown as Promise<Response>;
  }

  private getCompletionUrl(baseUrl: string, supportFim = false) {
    if (!baseUrl.endsWith('/')) {
      baseUrl += '/'
    }
    return new URL(supportFim ? 'completions' : 'chat/completions', baseUrl);
  }
}
