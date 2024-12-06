import { Autowired } from '@opensumi/di'
import { Domain, isWindows, localize } from '@opensumi/ide-core-common'
import { app } from 'electron'


import { ElectronMainContribution } from '../types'
import { ILogService } from '@/logger/common'
import type { MaybePromise } from '@opensumi/ide-core-common';
import type { JumpListCategory } from 'electron';

@Domain(ElectronMainContribution)
export class WorkspaceHistoryContribution implements ElectronMainContribution {
	@Autowired(ILogService)
	logger: ILogService

  onWillStart(): MaybePromise<void> {
		this.handleWindowsJumpList()
  }

  private async handleWindowsJumpList(): Promise<void> {
		if (!isWindows) {
			return;
		}
		await this.updateWindowsJumpList();
	}

  private async updateWindowsJumpList(): Promise<void> {
    const jumpList: JumpListCategory[] = [];
		jumpList.push({
			type: 'tasks',
			items: [
				{
					type: 'task',
					title: localize('common.newWindow'),
					description: localize('common.newWindowDesc'),
					program: process.execPath,
					iconPath: process.execPath,
					iconIndex: 0
				}
			]
		});

		try {
			const res = app.setJumpList(jumpList);
			if (res && res !== 'ok') {
				this.logger.warn(`updateWindowsJumpList#setJumpList unexpected result: ${res}`);
			}
		} catch (error) {
			this.logger.warn('updateWindowsJumpList#setJumpList', error);
		}
  }
}
