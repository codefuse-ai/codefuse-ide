import { app, Menu, MenuItem } from 'electron'
import { Autowired, Injectable } from '@opensumi/di'
import { Domain, isMacintosh, localize, FileUri } from '@opensumi/ide-core-common'
import {
  ElectronMainApiRegistry,
  ElectronMainApiProvider,
} from '@opensumi/ide-core-electron-main/lib/bootstrap/types';
import { IAppMenuService } from '../common'
import { ElectronMainContribution } from './types'
import { WindowsManager } from './window/windows-manager'

@Injectable()
export class AppMenuService extends ElectronMainApiProvider implements IAppMenuService {
  async renderRecentWorkspaces(recentWorkspaces: string[]): Promise<void> {
    const workspaces = recentWorkspaces.slice(0, 7)
    if (isMacintosh) {
      this.updateMacOSRecentDocuments(workspaces)
    }
  }

  private async updateMacOSRecentDocuments(workspaces: string[]): Promise<void> {
		app.clearRecentDocuments();
		workspaces.forEach(workspace => {
      let workspacePath = workspace;
      if (workspace.startsWith('file://')) {
        workspacePath = FileUri.fsPath(workspace);
      }
      app.addRecentDocument(workspacePath)
    });
	}
}

@Domain(ElectronMainContribution)
export class AppMenuContribution implements ElectronMainContribution {
  @Autowired(AppMenuService)
  menuService: AppMenuService;

  @Autowired(WindowsManager)
  windowsManager: WindowsManager

  #appMenuInstalled = false;

  registerMainApi(registry: ElectronMainApiRegistry) {
    registry.registerMainApi(IAppMenuService, this.menuService);
  }

  onStart(): void {
    this.installMenu()
  }
  
  installMenu() {
    if (isMacintosh && !this.#appMenuInstalled) {
      this.#appMenuInstalled = true;
  
      const dockMenu = new Menu();
      dockMenu.append(new MenuItem({ label: localize('common.newWindow'), click: () => this.windowsManager.createCodeWindow() }));
      app.dock.setMenu(dockMenu);
    }
  }
}
