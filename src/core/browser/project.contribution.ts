import { Autowired } from "@opensumi/di";
import {
  ClientAppContribution,
  Domain,
  electronEnv,
  FILE_COMMANDS,
  IWindowService,
  StorageProvider,
  URI,
} from "@opensumi/ide-core-browser";
import {
  MenuContribution,
  MenuId,
} from "@opensumi/ide-core-browser/lib/menu/next";
import {
  BrowserEditorContribution,
  WorkbenchEditorService,
} from "@opensumi/ide-editor/lib/browser";
import { IMainLayoutService } from "@opensumi/ide-main-layout";
import { ITerminalController } from "@opensumi/ide-terminal-next";
import { IThemeService } from "@opensumi/ide-theme";
import { IWorkspaceService } from "@opensumi/ide-workspace/lib/common";

import type { IMenuRegistry } from "@opensumi/ide-core-browser/lib/menu/next";

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
  @Autowired(StorageProvider)
  getStorage: StorageProvider;
  @Autowired(IMainLayoutService)
  private mainLayoutService: IMainLayoutService;
  @Autowired(IThemeService)
  private themeService: IThemeService;

  async onStart() {}

  registerMenus(registry: IMenuRegistry) {
    registry.registerMenuItem(MenuId.MenubarFileMenu, {
      submenu: "recentProjects",
      label: "最近项目",
      group: "1_open",
    });

    this.workspaceService.getMostRecentlyUsedWorkspaces().then((workspaces) => {
      registry.registerMenuItems(
        "recentProjects",
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
    electronEnv.ipcRenderer.on("openFile", (event, file) => {
      this.editorService.open(URI.file(file));
    });
  }
}
