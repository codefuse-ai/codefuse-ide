import { Autowired } from "@opensumi/di";
import { CommandContribution } from "@opensumi/ide-core-browser";
import {
  MenuContribution,
  MenuId,
} from "@opensumi/ide-core-browser/lib/menu/next";
import { Domain, localize } from "@opensumi/ide-core-common";

import { IUpdateMainService } from "../common";
import type { IMenuRegistry } from "@opensumi/ide-core-browser/lib/menu/next";
import type { CommandRegistry } from "@opensumi/ide-core-common";

const CHECK_COMMAND_ID = {
  id: "autoUpdater.checkForUpdates",
  label: localize("autoUpdater.checkForUpdates"),
};

@Domain(MenuContribution, CommandContribution)
export class UpdaterContribution
  implements MenuContribution, CommandContribution
{
  @Autowired(IUpdateMainService)
  updateService: IUpdateMainService;

  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(
      { id: CHECK_COMMAND_ID.id },
      {
        execute: async () => {
          await this.updateService.checkForUpdatesManual();
        },
      },
    );
  }

  registerMenus(menuRegistry: IMenuRegistry) {
    menuRegistry.registerMenuItem(MenuId.MenubarAppMenu, {
      group: "0_about",
      order: 1,
      command: {
        id: CHECK_COMMAND_ID.id,
        label: CHECK_COMMAND_ID.label,
      },
    });
  }
}
