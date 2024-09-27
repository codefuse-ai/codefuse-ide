import { Autowired } from '@opensumi/di'
import { CommandContribution, CommandRegistry, Domain, MaybePromise } from '@opensumi/ide-core-common'
import { ClientAppContribution, electronEnv } from '@opensumi/ide-core-browser'
import { IMenuRegistry, MenuId, MenuContribution } from "@opensumi/ide-core-browser/lib/menu/next";
import { localize } from "@opensumi/ide-core-common/lib/localize";
import { IWorkspaceService } from '@opensumi/ide-workspace';
import { IAppMenuService } from '../common';
import { IElectronMainUIService } from '@opensumi/ide-core-common/lib/electron';

const OPEN_LOGO_DIR_COMMAND_ID = {
  id: 'codefuse-ide.openLogDir',
  label: localize('codefuse-ide.openLogDir'),
}

@Domain(ClientAppContribution, MenuContribution, CommandContribution)
export class LocalMenuContribution implements MenuContribution, ClientAppContribution {
  @Autowired(IWorkspaceService)
  workspaceService: IWorkspaceService;

  @Autowired(IAppMenuService)
  menuService: IAppMenuService;

  @Autowired(IElectronMainUIService)
  private electronMainUIService: IElectronMainUIService;

  initialize(): MaybePromise<void> {
    // this.renderAppMenu();
  }

  async renderAppMenu() {
    const workspaces = await this.workspaceService.getMostRecentlyUsedWorkspaces();
    await this.menuService.renderRecentWorkspaces(workspaces);
  }

  registerCommands(registry: CommandRegistry) {
    registry.registerCommand(OPEN_LOGO_DIR_COMMAND_ID, {
      execute: () => {
        this.electronMainUIService.revealInFinder(electronEnv.metadata.environment.logRoot);
      },
    });
  }

  registerMenus(menuRegistry: IMenuRegistry) {
    menuRegistry.registerMenuItem(MenuId.MenubarAppMenu, {
      submenu: MenuId.SettingsIconMenu,
      label: localize('common.preferences'),
      group: '2_preference',
    });

    menuRegistry.registerMenuItem(MenuId.MenubarHelpMenu, {
      command: OPEN_LOGO_DIR_COMMAND_ID,
    });
  }
}
