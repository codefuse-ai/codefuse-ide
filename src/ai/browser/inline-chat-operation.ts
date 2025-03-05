import { Autowired, Injectable } from "@opensumi/di";
import { ChatService } from "@opensumi/ide-ai-native/lib/browser/chat/chat.api.service";
import { InlineChatController } from "@opensumi/ide-ai-native/lib/browser/widget/inline-chat/inline-chat-controller";
import { AIBackSerivcePath, CancellationToken, ChatServiceToken, IAIBackService } from "@opensumi/ide-core-common";
import { ICodeEditor } from "@opensumi/ide-monaco";
import { commentsPrompt, explainPrompt, optimizePrompt, testPrompt } from "./prompt";
import { EInlineOperation } from './constants';

@Injectable()
export class InlineChatOperationModel {
  @Autowired(AIBackSerivcePath)
  private readonly aiBackService: IAIBackService;

  @Autowired(ChatServiceToken)
  private readonly aiChatService: ChatService;

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

  public [EInlineOperation.Explain](monacoEditor: ICodeEditor): void {
    const model = monacoEditor.getModel();
    if (!model) {
      return;
    }

    const crossCode = this.getCrossCode(monacoEditor);

    this.aiChatService.sendMessage({
      message: `解释以下代码: \n\`\`\`${model.getLanguageId()}\n${crossCode}\n\`\`\``,
      prompt: explainPrompt(model.getLanguageId(), crossCode),
    });
  }

  public async [EInlineOperation.Comments](editor: ICodeEditor, token: CancellationToken): Promise<InlineChatController> {
    const crossCode = this.getCrossCode(editor);
    const prompt = commentsPrompt(crossCode);

    const controller = new InlineChatController({ enableCodeblockRender: true });
    const stream = await this.aiBackService.requestStream(prompt, { noTool: true }, token);
    controller.mountReadable(stream);

    return controller;
  }

  public [EInlineOperation.Test](editor: ICodeEditor): void {
    const model = editor.getModel();
    if (!model) {
      return;
    }

    const crossCode = this.getCrossCode(editor);
    const prompt = testPrompt(crossCode);

    this.aiChatService.sendMessage({
      message: `为以下代码写单测：\n\`\`\`${model.getLanguageId()}\n${crossCode}\n\`\`\``,
      prompt,
    });
  }

  public async [EInlineOperation.Optimize](editor: ICodeEditor, token: CancellationToken): Promise<InlineChatController> {
    const crossCode = this.getCrossCode(editor);
    const prompt = optimizePrompt(crossCode);

    const controller = new InlineChatController({ enableCodeblockRender: true });
    const stream = await this.aiBackService.requestStream(prompt, { noTool: true }, token);
    controller.mountReadable(stream);

    return controller;
  }

}