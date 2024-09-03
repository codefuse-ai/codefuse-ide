import { Autowired } from '@opensumi/di'
import { Command, CommandRegistry, Domain, localize } from '@opensumi/ide-core-common'
import { BrowserModule, CommandContribution } from '@opensumi/ide-core-browser';
import { MenuId, MenuContribution, IMenuRegistry } from '@opensumi/ide-core-browser/lib/menu/next';
import { IUpdateMainService } from '../common'

const CHECK_COMMAND_ID = {
  id: 'autoUpdater.checkForUpdates',
  label: localize('autoUpdater.checkForUpdates'),
}

@Domain(MenuContribution, CommandContribution)
export class UpdaterContribution implements MenuContribution, CommandContribution {
  @Autowired(IUpdateMainService)
  updateService: IUpdateMainService

  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(
      { id: CHECK_COMMAND_ID.id },
      {
        execute: async () => {
          await this.updateService.checkForUpdatesManual()
        }
      }
    )
  }

  registerMenus(menuRegistry: IMenuRegistry) {
    menuRegistry.registerMenuItem(MenuId.MenubarAppMenu, {
      group: '0_about',
      order: 1,
      command: {
        id: CHECK_COMMAND_ID.id,
        label: CHECK_COMMAND_ID.label,
      },
    });
  }
}
