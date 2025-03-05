import { Autowired } from '@opensumi/di';
import {
  AIBackSerivcePath,
  ChatServiceToken,
  getDebugLogger,
  IChatContent,
  IChatProgress,
  IAIBackService,
  CancellationToken,
  ChatResponse,
  ECodeEditsSourceTyping,
} from '@opensumi/ide-core-common';
import { ClientAppContribution, Domain, getIcon } from '@opensumi/ide-core-browser';
import { ComponentContribution, ComponentRegistry } from '@opensumi/ide-core-browser/lib/layout';
import { AINativeCoreContribution, ERunStrategy, IChatFeatureRegistry, IInlineChatFeatureRegistry, IIntelligentCompletionsRegistry, IProblemFixContext, IProblemFixProviderRegistry, IRenameCandidatesProviderRegistry, ITerminalProviderRegistry, TChatSlashCommandSend, TerminalSuggestionReadableStream } from '@opensumi/ide-ai-native/lib/browser/types';
import { ICodeEditor, MarkdownString, NewSymbolNameTag, Range } from '@opensumi/ide-monaco';
import { MessageService } from '@opensumi/ide-overlay/lib/browser/message.service';
import { BaseTerminalDetectionLineMatcher, JavaMatcher, MatcherType, NodeMatcher, NPMMatcher, ShellMatcher, TSCMatcher } from '@opensumi/ide-ai-native/lib/browser/contrib/terminal/matcher';
import { ChatService } from '@opensumi/ide-ai-native/lib/browser/chat/chat.api.service';
import { InlineChatController } from '@opensumi/ide-ai-native/lib/browser/widget/inline-chat/inline-chat-controller';
import { ITerminalCommandSuggestionDesc } from '@opensumi/ide-ai-native/lib/common';
import { listenReadable } from '@opensumi/ide-utils/lib/stream';

import { AI_MENU_BAR_LEFT_ACTION, EInlineOperation } from './constants'
import { LeftToolbar } from './components/left-toolbar'
import { explainPrompt, testPrompt, optimizePrompt, detectIntentPrompt, RenamePromptManager, terminalCommandSuggestionPrompt, codeEditsLintErrorPrompt } from './prompt'
import { CommandRender } from './command/command-render'
import { AITerminalDebugService } from './ai-terminal-debug.service'
import { InlineChatOperationModel } from './inline-chat-operation'
import { AICommandService } from './command/command.service'
import hiPng from './assets/hi.png'
import { ILinterErrorData } from '@opensumi/ide-ai-native/lib/browser/contrib/intelligent-completions/source/lint-error.source';

@Domain(ComponentContribution, AINativeCoreContribution)
export class AINativeContribution implements ComponentContribution, AINativeCoreContribution {
  @Autowired(MessageService)
  protected readonly messageService: MessageService;

  @Autowired(AITerminalDebugService)
  protected readonly terminalDebugService: AITerminalDebugService;

  @Autowired(ChatServiceToken)
  private readonly chatService: ChatService;

  @Autowired(InlineChatOperationModel)
  inlineChatOperationModel: InlineChatOperationModel;

  @Autowired(AIBackSerivcePath)
  private aiBackService: IAIBackService;

  @Autowired(AICommandService)
  aiCommandService: AICommandService;

  logger = getDebugLogger();

  registerComponent(registry: ComponentRegistry): void {
    registry.register(AI_MENU_BAR_LEFT_ACTION, {
      id: AI_MENU_BAR_LEFT_ACTION,
      component: LeftToolbar,
    });
  }

  registerChatFeature(registry: IChatFeatureRegistry): void {
    registry.registerWelcome(
      new MarkdownString(`<img src="${hiPng}" />
      嗨，我是您的专属 AI 小助手，我在这里回答有关代码的问题，并帮助您思考</br>您可以提问我一些关于代码的问题`),
      [
        {
          icon: getIcon('send-hollow'),
          title: '介绍一下当前仓库',
          message: '介绍一下当前仓库',
        },
      ],
    );
  }

  registerInlineChatFeature(registry: IInlineChatFeatureRegistry) {
    registry.registerTerminalInlineChat(
      {
        id: 'terminal-explain',
        name: 'Explain',
        title: '解释选中的内容'
      },
      {
        triggerRules: 'selection',
        execute: async (stdout: string) => {
          const { message, prompt } = await this.terminalDebugService.generatePrompt({
            type: MatcherType.base,
            errorText: stdout,
            operate: 'explain'
          });

          this.chatService.sendMessage({
            message,
            prompt,
            reportType: 'terminal-selection-explain' as any
          });
        },
      },
    );

    registry.registerTerminalInlineChat(
      {
        id: 'terminal-debug',
        name: 'debug',
        title: '分析选中内容'
      },
      {
        triggerRules: [
          NodeMatcher,
          TSCMatcher,
          NPMMatcher,
          ShellMatcher,
          JavaMatcher,
        ],
        execute: async (stdout: string, _stdin: string, rule?: BaseTerminalDetectionLineMatcher) => {
          const { message, prompt } = await this.terminalDebugService.generatePrompt({
            type: rule!.type,
            errorText: stdout,
            operate: 'debug'
          });

          this.chatService.sendMessage({
            message,
            prompt,
            reportType: 'terminal-explain' as any
          });
        },
      },
    );

    registry.registerEditorInlineChat(
      {
        id: `ai-${EInlineOperation.Explain}`,
        name: EInlineOperation.Explain,
        title: '解释代码',
        renderType: 'button',
        codeAction: {
          isPreferred: true,
        },
      },
      {
        execute: (editor: ICodeEditor) => this.inlineChatOperationModel.Explain(editor)
      },
    );

    registry.registerEditorInlineChat(
      {
        id: `ai-${EInlineOperation.Comments}`,
        name: EInlineOperation.Comments,
        title: '添加注释',
        renderType: 'button',
        codeAction: {
          isPreferred: true,
          kind: 'refactor.rewrite',
        },
      },
      {
        providerDiffPreviewStrategy: (...args) => this.inlineChatOperationModel.Comments(...args),
      },
    );

    registry.registerEditorInlineChat(
      {
        id: `ai-${EInlineOperation.Test}`,
        name: EInlineOperation.Test,
        title: '生成单测',
        renderType: 'button',
        codeAction: {
          isPreferred: true,
        },
      },
      {
        execute: (editor: ICodeEditor) => this.inlineChatOperationModel.Test(editor),
      },
    );

    registry.registerEditorInlineChat(
      {
        id: `ai-${EInlineOperation.Optimize}`,
        name: EInlineOperation.Optimize,
        renderType: 'dropdown',
        codeAction: {
          isPreferred: true,
          kind: 'refactor.rewrite',
        },
      },
      {
        providerDiffPreviewStrategy: (...args) => this.inlineChatOperationModel.Optimize(...args),
      },
    );

    /**
     * 注册 inlinchat 输入框
     */
    registry.registerInteractiveInput(
      {
        handleStrategy: async (_editor, value) => {
          const result = await this.aiBackService.request(detectIntentPrompt(value), {});

          let operation: string = result.data as EInlineOperation;

          // 如果模型因为报错没返回字段，则默认选择 preview 模式
          if (!operation) {
            return ERunStrategy.PREVIEW;
          }

          if (operation[0] === '[' && operation[operation.length - 1] === ']') {
            operation = operation.slice(1, -1)
          }

          if (
            operation.startsWith(EInlineOperation.Explain) ||
            operation.startsWith(EInlineOperation.Test)
          ) {
            return ERunStrategy.EXECUTE;
          }

          return ERunStrategy.PREVIEW;
        },
      },
      {
        execute: (editor, value) => {
          const model = editor.getModel();
          if (!model) {
            return;
          }

          const crossCode = this.getCrossCode(editor);
          const prompt = `${value}：\n\`\`\`${model.getLanguageId()}\n${crossCode}\n\`\`\``;

          this.chatService.sendMessage({
            message: prompt,
            prompt,
          });
        },
        providePreviewStrategy: async (editor, value, token) => {
          const model = editor.getModel();
          const crossCode = this.getCrossCode(editor);

          let prompt = `${value}`;
          if (crossCode) {
            prompt += `：\n\`\`\`${model!.getLanguageId()}\n${crossCode}\n\`\`\``;
          }

          const controller = new InlineChatController({ enableCodeblockRender: true });
          const stream = await this.aiBackService.requestStream(prompt, { noTool: true }, token);
          controller.mountReadable(stream);

          return controller;
        },
      }
    );
  }

  registerRenameProvider(registry: IRenameCandidatesProviderRegistry) {
    registry.registerRenameSuggestionsProvider(async (model, range, token) => {
      const above = model.getValueInRange({
        startColumn: 0,
        startLineNumber: 0,
        endLineNumber: range.startLineNumber,
        endColumn: range.startColumn,
      });
      const varName = model.getValueInRange(range);
      const below = model.getValueInRange({
        startColumn: range.endColumn,
        startLineNumber: range.endLineNumber,
        endLineNumber: model.getLineCount(),
        endColumn: Number.MAX_SAFE_INTEGER,
      });

      const prompt = RenamePromptManager.requestPrompt(model.getLanguageId(), varName, above, below);

      this.logger.info('rename prompt', prompt);

      const result = await this.aiBackService.request(
        prompt,
        {
          type: 'rename',
        },
        token,
      );

      this.logger.info('rename result', result);

      if (result.data) {
        const names = RenamePromptManager.extractResponse(result.data);

        return names.map((name) => ({
          newSymbolName: name,
          tags: [NewSymbolNameTag.AIGenerated],
        }));
      }
    });
  }

  private getCrossCode(monacoEditor: ICodeEditor): string {
    const model = monacoEditor.getModel();
    if (!model) {
      return '';
    }

    const selection = monacoEditor.getSelection();

    if (!selection) {
      return '';
    }

    const crossSelection = selection
      .setStartPosition(selection.startLineNumber, 1)
      .setEndPosition(selection.endLineNumber, Number.MAX_SAFE_INTEGER);
    const crossCode = model.getValueInRange(crossSelection);
    return crossCode;
  }

  registerTerminalProvider(register: ITerminalProviderRegistry): void {
    let aiCommandSuggestions: ITerminalCommandSuggestionDesc[] = [];
    let currentObj = {} as ITerminalCommandSuggestionDesc;

    const processLine = (lineBuffer: string, stream: TerminalSuggestionReadableStream) => {
      const firstCommandIndex = lineBuffer.indexOf('#Command#:');
      let line = lineBuffer;

      if (firstCommandIndex !== -1) {
        // 找到了第一个#Command#:，截取它及之后的内容
        line = lineBuffer.substring(firstCommandIndex);
      }

      // 解析命令和描述
      if (line.startsWith('#Command#:')) {
        if (currentObj.command) {
          // 如果currentObj中已有命令，则将其添加到结果数组中，并开始新的对象
          currentObj = {} as ITerminalCommandSuggestionDesc;
        }
        currentObj.command = line.substring('#Command#:'.length).trim();
      } else if (line.startsWith('#Description#:')) {
        currentObj.description = line.substring('#Description#:'.length).trim();
        aiCommandSuggestions.push(currentObj);
        if (aiCommandSuggestions.length > 4) {
          // 如果 AI 返回的命令超过 5 个，就停止 AI 生成 (这种情况下往往是模型不稳定或者出现了幻觉)
          stream.end();
        }
        stream.emitData(currentObj);// 每拿到一个结果就回调一次，优化用户体感
      }
    };

    register.registerCommandSuggestionsProvider(async (message, token) => {
      const prompt = terminalCommandSuggestionPrompt(message);

      aiCommandSuggestions = [];
      const backStream = await this.aiBackService.requestStream(prompt, { noTool: true }, token);
      const stream = TerminalSuggestionReadableStream.create();

      let buffer = '';

      listenReadable<IChatProgress>(backStream, {
        onData: (data) => {
          const { content } = data as IChatContent;

          buffer += content;
          let newlineIndex = buffer.indexOf('\n');
          while (newlineIndex !== -1) {
            const line = buffer.substring(0, newlineIndex).trim();
            buffer = buffer.substring(newlineIndex + 1);
            processLine(line, stream);
            newlineIndex = buffer.indexOf('\n');
          }
        },
        onEnd: () => {
          buffer += '\n';
          let newlineIndex = buffer.indexOf('\n');
          while (newlineIndex !== -1) {
            const line = buffer.substring(0, newlineIndex).trim();
            buffer = buffer.substring(newlineIndex + 1);
            processLine(line, stream);
            newlineIndex = buffer.indexOf('\n');
          }
          stream.end();
        },
      });

      return stream;
    });
  }


  registerProblemFixFeature(registry: IProblemFixProviderRegistry): void {
    registry.registerHoverFixProvider({
      provideFix: async (
        editor: ICodeEditor,
        context: IProblemFixContext,
        token: CancellationToken,
      ): Promise<ChatResponse | InlineChatController> => {
        const { marker, editRange } = context;

        const prompt = `原始代码内容:
\`\`\`
${editor.getModel()!.getValueInRange(editRange)}
\`\`\`

        lint error 信息:
        
        ${marker.message}.

        请根据 lint error 信息修复代码！
        不需要任何解释，只要返回修复后的代码块内容`;

        const controller = new InlineChatController({ enableCodeblockRender: true });
        const stream = await this.aiBackService.requestStream(prompt, { noTool: true }, token);
        controller.mountReadable(stream);

        return controller;
      },
    });
  }

  registerIntelligentCompletionFeature(registry: IIntelligentCompletionsRegistry): void {
    registry.registerCodeEditsProvider(async (editor, _position, bean, token) => {
      const model = editor.getModel();
      if (!model) {
        return;
      }

      if (bean.typing === ECodeEditsSourceTyping.LinterErrors) {
        const errors = (bean.data as ILinterErrorData).errors;

        if (errors.length === 0) {
          return;
        }

        const lastItem = errors[errors.length - 1];
        const lastRange = lastItem.range;

        const waringRange = Range.fromPositions(
          { lineNumber: errors[0].range.startPosition.lineNumber, column: 1 },
          { lineNumber: lastRange.endPosition.lineNumber, column: model!.getLineMaxColumn(lastRange.endPosition.lineNumber) }
        );

        const prompt = codeEditsLintErrorPrompt(model.getValueInRange(waringRange), errors);
        const response = await this.aiBackService.request(prompt, {}, token);

        if (response.data) {
          const controller = new InlineChatController({ enableCodeblockRender: true });
          const codeData = controller['calculateCodeBlocks'](response.data);

          return {
            items: [
              {
                insertText: codeData,
                range: waringRange
              }
            ]
          };
        }
      }
      return undefined;
    });
  }
}
