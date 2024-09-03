import { Autowired, Provider } from '@opensumi/di'
import { Domain, Schemes, URI } from '@opensumi/ide-core-common'
import { AppConfig, WorkspaceScope } from '@opensumi/ide-core-browser'
import { IMenuRegistry, MenuId, MenuContribution, IMenuItem } from "@opensumi/ide-core-browser/lib/menu/next";
import { FILE_COMMANDS, ClientAppContribution, formatLocalize, StaticResourceContribution, StaticResourceService, electronEnv } from '@opensumi/ide-core-browser'
import { IViewsRegistry } from '@opensumi/ide-main-layout';
import { RESOURCE_VIEW_ID } from '@opensumi/ide-file-tree-next'
import { IPreferenceSettingsService } from '@opensumi/ide-core-browser/lib/preferences';
import { PreferenceSettingsService } from '@opensumi/ide-preferences/lib/browser/preference-settings.service'

@Domain(ClientAppContribution, MenuContribution, StaticResourceContribution)
export class PatchContribution implements MenuContribution, ClientAppContribution, StaticResourceContribution {
  @Autowired(IViewsRegistry)
  private viewsRegistry: IViewsRegistry;

  async onStart() {
    const viewContents = this.viewsRegistry.getViewWelcomeContent(RESOURCE_VIEW_ID);
    const openFolderContent = viewContents.find(item => item.content.includes(`(command:${FILE_COMMANDS.OPEN_FOLDER.id})`))
    if (openFolderContent) {
      Object.assign(openFolderContent, {
        content: formatLocalize('welcome-view.noFolderHelp', `${FILE_COMMANDS.OPEN_FOLDER.id}?{"newWindow":false}`)
      })
    }
  }

  registerMenus(menuRegistry: IMenuRegistry) {
    const openFolderMenu = menuRegistry.getMenuItems(MenuId.MenubarFileMenu).find(item => {
      return 'command' in item && item.command === FILE_COMMANDS.OPEN_FOLDER.id;
    }) as IMenuItem
    if (openFolderMenu) {
      openFolderMenu.extraTailArgs = [{ newWindow: false }]
    }
  }

  registerStaticResolver(service: StaticResourceService): void {
    service.registerStaticResourceProvider({
      scheme: Schemes.monaco,
      resolveStaticResource: (uri) => {
        const path = uri.codeUri.path;

        switch (path) {
          case 'worker': {
            const query = uri.query;
            if (query) {
              const { moduleId } = JSON.parse(query);
              if (moduleId === 'workerMain.js') {
                return URI.file(electronEnv.monacoWorkerPath);
              }
            }
            break;
          }
        }

        return uri;
      },
    });
  }
}

export class PatchPreferenceSettingsService extends PreferenceSettingsService {
  @Autowired(AppConfig)
  appConfig: AppConfig

  constructor() {
    super()
    if (!this.appConfig.workspaceDir) {
      this.tabList = this.tabList.filter(item => item !== WorkspaceScope);
    }
    this._currentScope = this.tabList[0]
  }
}

export const patchProviders: Provider[] = [
  PatchContribution,
  {
    token: IPreferenceSettingsService,
    useClass: PatchPreferenceSettingsService,
    override: true,
  }
]
