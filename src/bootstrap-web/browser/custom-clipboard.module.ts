import { Injectable, Autowired } from '@opensumi/di';
import { 
  BrowserModule, 
  ClientAppContribution, 
  Domain,
  KeybindingContribution,
  KeybindingRegistry,
  CommandContribution,
  CommandRegistry,
  IClipboardService,
  URI
} from '@opensumi/ide-core-browser';

// 自定义剪贴板服务
@Injectable()
class CustomClipboardService implements IClipboardService {
  async writeText(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Text copied to clipboard:', text);
    } catch (err) {
      console.error('Failed to copy text:', err);
      throw err;
    }
  }

  async readText(): Promise<string> {
    try {
      const text = await navigator.clipboard.readText();
      console.log('Text read from clipboard:', text);
      return text;
    } catch (err) {
      console.error('Failed to read text:', err);
      throw err;
    }
  }

  // 实现其他必需的方法
  async writeResources(resources: URI[]): Promise<void> {
    console.log('Writing resources to clipboard:', resources);
  }

  async readResources(): Promise<URI[]> {
    console.log('Reading resources from clipboard');
    return [];
  }

  async hasResources(field?: string): Promise<boolean> {
    console.log('Checking if clipboard has resources:', field);
    return false;
  }
}

// 贡献类
@Injectable()
@Domain(ClientAppContribution, CommandContribution, KeybindingContribution)
class CustomClipboardContribution implements ClientAppContribution, CommandContribution, KeybindingContribution {
  @Autowired(IClipboardService)
  private readonly clipboardService: IClipboardService;

  onStart() {
    console.log('CustomClipboardContribution started');
  }

  registerCommands(commands: CommandRegistry) {
    commands.registerCommand(
      {
        id: 'custom.copy',
        label: 'Copy',
      },
      {
        execute: async () => {
          const selection = window.getSelection();
          if (selection) {
            const text = selection.toString();
            await this.clipboardService.writeText(text);
          }
        },
      }
    );
  }

  registerKeybindings(keybindings: KeybindingRegistry) {
    keybindings.registerKeybinding({
      command: 'custom.copy',
      keybinding: 'ctrlcmd+shift+c',
      when: 'editorTextFocus',
    });
  }
}

// 模块
@Injectable()
export class CustomClipboardModule extends BrowserModule {
  providers = [
    {
      token: IClipboardService,
      useClass: CustomClipboardService,
    },
    CustomClipboardContribution,
  ];
} 