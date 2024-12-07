import { Injectable, Autowired } from '@opensumi/di';
import { CommandContribution, CommandRegistry, Domain, FILE_COMMANDS } from '@opensumi/ide-core-browser';
import { IWindowDialogService } from '@opensumi/ide-overlay';
import { IWorkspaceService } from '@opensumi/ide-workspace';

@Injectable()
@Domain(CommandContribution)
export class CoreCommandContribution implements CommandContribution {
  @Autowired(IWindowDialogService)
  private window: IWindowDialogService;

  @Autowired(IWorkspaceService)
  private workspace: IWorkspaceService;
  
  registerCommands(commands: CommandRegistry) {
    commands.registerCommand(FILE_COMMANDS.OPEN_FOLDER, {
      execute: async () => {
        const newWorkspace = await this.window.showOpenDialog({
          canSelectFolders: true,
          canSelectMany: false,
        });
        if (newWorkspace) {
          if (this.workspace.workspace?.uri.toString() === newWorkspace[0].toString()) {
            return;
          }
          window.open(`${window.location.protocol}//${window.location.host}?workspaceDir=${newWorkspace[0].codeUri.fsPath.toString()}`);
        }
      }
    })
  }

}
