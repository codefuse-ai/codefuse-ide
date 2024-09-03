import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { Autowired, Injectable } from '@opensumi/di'
import { ShellIntegrationService as BaseShellIntegrationService } from '@opensumi/ide-terminal-next/lib/node/shell-integration.service'

const shellIntegrationDirPath = path.join(os.homedir(), process.env.IDE_DATA_FOLDER_NAME!, 'shell-integration');

export const bashIntegrationPath = path.join(shellIntegrationDirPath, 'bash-integration.bash');

export class ShellIntegrationService extends BaseShellIntegrationService {
  @Autowired(ShellIntegrationService)
  shellIntegrationService: ShellIntegrationService

  async initBashInitFile(): Promise<string> {
    await fs.mkdir(shellIntegrationDirPath, { recursive: true });
    await fs.writeFile(bashIntegrationPath, await this.getBashIntegrationContent());
    return bashIntegrationPath;
  }
}
