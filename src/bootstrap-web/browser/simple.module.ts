import { Injectable, Autowired } from '@opensumi/di';
import { 
  BrowserModule, 
  ClientAppContribution, 
  Domain,
  KeybindingContribution,
  KeybindingRegistry,
  CommandContribution,
  CommandRegistry,
  IContextKeyService,
  MonacoService
} from '@opensumi/ide-core-browser';
import { IMessageService } from '@opensumi/ide-overlay';

// 使用自定义的命令ID
const COPY_COMMAND = 'custom.copy';
const PASTE_COMMAND = 'custom.paste';

@Injectable()
@Domain(ClientAppContribution, CommandContribution, KeybindingContribution)
class SimpleService implements ClientAppContribution, CommandContribution, KeybindingContribution {
  @Autowired(MonacoService)
  private readonly monacoService: MonacoService;

  @Autowired(IMessageService)
  private readonly messageService: IMessageService;

  onStart() {
    console.log('SimpleService started');
    // 添加全局键盘事件监听器
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        console.log('Global keyboard event triggered');
        // 获取选中的文本
        const selection = window.getSelection();
        if (selection) {
          const selectedText = selection.toString();
          console.log('Selected text:', selectedText);
          // 复制到剪贴板
          navigator.clipboard.writeText(selectedText)
            .then(() => console.log('Text copied to clipboard'))
            .catch(err => console.error('Failed to copy text:', err));
        }
      }
    });
  }

  registerCommands(commands: CommandRegistry) {
    console.log('Registering commands...');
    commands.registerCommand(
      {
        id: COPY_COMMAND,
        label: 'Copy Selected Text',
      },
      {
        execute: async () => {
          try {
            // 获取选中的文本
            const selection = window.getSelection();
            if (selection && selection.toString().length > 0) {
              const selectedText = selection.toString();
              // 复制到剪贴板
              await navigator.clipboard.writeText(selectedText);
              // 显示成功消息
              this.messageService.info('Text copied to clipboard successfully!');
              return true;
            } else {
              this.messageService.warning('No text selected to copy');
              return false;
            }
          } catch (error) {
            console.error('Failed to copy text:', error);
            this.messageService.error('Failed to copy text to clipboard');
            return false;
          }
        },
      }
    );

    // 注册粘贴命令
    commands.registerCommand(
      {
        id: PASTE_COMMAND,
        label: 'Paste Content',
      },
      {
        execute: async () => {
          try {
            // 从剪贴板获取文本
            const clipboardText = await navigator.clipboard.readText();
            if (clipboardText) {
              // 获取当前选中的元素
              const activeElement = document.activeElement as HTMLElement;
              if (activeElement) {
                // 如果当前元素是输入框或文本区域
                if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
                  // 在光标位置插入文本
                  const start = (activeElement as HTMLInputElement).selectionStart || 0;
                  const end = (activeElement as HTMLInputElement).selectionEnd || 0;
                  const value = (activeElement as HTMLInputElement).value;
                  (activeElement as HTMLInputElement).value = value.substring(0, start) + clipboardText + value.substring(end);
                  // 更新光标位置
                  (activeElement as HTMLInputElement).selectionStart = (activeElement as HTMLInputElement).selectionEnd = start + clipboardText.length;
                } else {
                  // 如果不是输入框，则显示消息
                  this.messageService.info('Clipboard content: ' + clipboardText);
                }
              }
              return true;
            } else {
              this.messageService.warning('No content in clipboard');
              return false;
            }
          } catch (error) {
            console.error('Failed to paste text:', error);
            this.messageService.error('Failed to paste text from clipboard');
            return false;
          }
        },
      }
    );
  }

  registerKeybindings(keybindings: KeybindingRegistry) {
    console.log('Registering keybindings...');
    keybindings.registerKeybinding({
      command: COPY_COMMAND,
      keybinding: 'ctrlcmd+c',
    });

    keybindings.registerKeybinding({
      command: PASTE_COMMAND,
      keybinding: 'ctrlcmd+v',
    });
  }
}

// 创建服务模块
@Injectable()
export class SimpleModule extends BrowserModule {
  providers = [
    SimpleService,
  ];
} 