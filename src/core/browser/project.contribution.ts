import {
  Domain,
  CommandContribution,
  CommandRegistry,
  URI,
  electronEnv,
  ClientAppContribution,
  StorageProvider,
  FILE_COMMANDS,
} from '@opensumi/ide-core-browser';
import { IMenuRegistry, MenuId, MenuContribution } from '@opensumi/ide-core-browser/lib/menu/next';
import { Autowired } from '@opensumi/di';
import { IWorkspaceService } from '@opensumi/ide-workspace/lib/common';
import { IWindowService, WORKSPACE_COMMANDS } from '@opensumi/ide-core-browser';
import { ITerminalController } from '@opensumi/ide-terminal-next';
import { IMainLayoutService } from '@opensumi/ide-main-layout';
import { BrowserEditorContribution, WorkbenchEditorService } from '@opensumi/ide-editor/lib/browser';
import { IThemeService } from '@opensumi/ide-theme';

@Domain(MenuContribution, BrowserEditorContribution, ClientAppContribution)
export class ProjectSwitcherContribution
  implements MenuContribution, BrowserEditorContribution, ClientAppContribution
{
  @Autowired(IWorkspaceService)
  workspaceService: IWorkspaceService;

  @Autowired(IWindowService)
  windowService: IWindowService;

  @Autowired(ITerminalController)
  terminalService: ITerminalController;

  @Autowired(WorkbenchEditorService)
  editorService: WorkbenchEditorService;

  @Autowired(IMainLayoutService)
  private mainLayoutService: IMainLayoutService;

  @Autowired(IThemeService)
  private themeService: IThemeService;

  @Autowired(StorageProvider)
  getStorage: StorageProvider;

  async onStart() {}

  registerMenus(registry: IMenuRegistry) {
    registry.registerMenuItem(MenuId.MenubarFileMenu, {
      submenu: 'recentProjects',
      label: '最近项目',
      group: '1_open',
    });

    this.workspaceService.getMostRecentlyUsedWorkspaces().then((workspaces) => {
      registry.registerMenuItems(
        'recentProjects',
        workspaces.map((workspace) => ({
          command: {
            id: FILE_COMMANDS.VSCODE_OPEN_FOLDER.id,
            label: new URI(workspace).codeUri.fsPath,
          },
          extraTailArgs: [workspace, false],
        })),
      );
    });
  }

  onDidRestoreState() {
    if (electronEnv.metadata.launchToOpenFile) {
      this.editorService.open(URI.file(electronEnv.metadata.launchToOpenFile));
    }
    electronEnv.ipcRenderer.on('openFile', (event, file) => {
      this.editorService.open(URI.file(file));
    });
  }
}
