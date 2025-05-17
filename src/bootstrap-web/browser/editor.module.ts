import { Injectable, Autowired } from '@opensumi/di';
import { BrowserModule } from '@opensumi/ide-core-browser';
import { IEditorDocumentModelService } from '@opensumi/ide-editor/lib/browser';

// 定义服务标识符
export const IEditorService = Symbol('IEditorService');

// 定义服务接口
export interface IEditorService {
  updateContent(content: string): Promise<void>;
  getContent(): string | undefined;
}

// 创建服务类
@Injectable()
class EditorService implements IEditorService {
  @Autowired(IEditorDocumentModelService)
  private readonly editorService: IEditorDocumentModelService;

  async updateContent(content: string) {
    // 获取当前活动的编辑器模型
    const models = this.editorService.getAllModels();
    const currentModel = models[0]; // 获取第一个模型
    
    if (currentModel) {
      // 使用 Monaco Editor 的 API 更新内容
      const monaco = (window as any).monaco;
      if (monaco) {
        const editor = monaco.editor.getEditors()[0];
        if (editor) {
          editor.setValue(content);
          console.log('Content updated successfully:', content);
        } else {
          console.warn('No editor instance found');
        }
      } else {
        console.warn('Monaco editor not found');
      }
    } else {
      console.warn('No editor model found');
    }
  }

  getContent(): string | undefined {
    const models = this.editorService.getAllModels();
    const currentModel = models[0]; // 获取第一个模型
    if (currentModel) {
      // 使用 Monaco Editor 的 API 获取内容
      const monaco = (window as any).monaco;
      if (monaco) {
        const editor = monaco.editor.getEditors()[0];
        if (editor) {
          const content = editor.getValue();
          console.log('Content retrieved successfully:', content);
          return content;
        } else {
          console.warn('No editor instance found');
        }
      } else {
        console.warn('Monaco editor not found');
      }
    } else {
      console.warn('No editor model found');
    }
    return undefined;
  }
}

// 创建服务模块
@Injectable()
export class EditorModule extends BrowserModule {
  providers = [
    {
      token: IEditorService,
      useClass: EditorService,
    },
  ];
} 