import * as fs from 'node:fs/promises'
import * as path from 'path'
import { Injectable, Autowired } from '@opensumi/di';
import { IEnvironmentService } from '@/core/common'
import { AbstractLogServiceManager } from '../common'

@Injectable()
export class LogServiceManager extends AbstractLogServiceManager {
  @Autowired(IEnvironmentService)
  environmentService: IEnvironmentService

  constructor() {
    super();
    // 启动时清除旧日志，后续加个定时任务清除
    this.cleanOldLogs();
  }

  getRootLogFolder(): string {
    return this.environmentService.logRoot;
  }

  getLogFolder(): string {
    return this.environmentService.logHome;
  }

  async cleanOldLogs(): Promise<void> {
    try {
      const { logHome, logRoot } = this.environmentService;
      const currentLog = path.basename(logHome);
      const children = await fs.readdir(logRoot);
      const allSessions = children.filter((name) => /^\d{8}$/.test(name));
      const oldSessions = allSessions.sort().filter((d) => d !== currentLog);
      const toDelete = oldSessions.slice(0, Math.max(0, oldSessions.length - 4));
      if (toDelete.length > 0) {
        await Promise.all(toDelete.map((name) => fs.rm(path.join(logRoot, name), { recursive: true, force: true, maxRetries: 3 })));
      }
    } catch {
      // noop
    }
  }

  async cleanAllLogs(): Promise<void> {
    try {
      const { logRoot } = this.environmentService;
      const children = await fs.readdir(logRoot);
      const allSessions = children.filter((name) => /^\d{8}$/.test(name));
      if (allSessions.length > 0) {
        await Promise.all(allSessions.map((name) => fs.rm(path.join(logRoot, name), { recursive: true, force: true, maxRetries: 3 })));
      }
    } catch {
      // noop
    }
  }

  async cleanExpiredLogs(day: number): Promise<void> {
    try {
      const { logRoot } = this.environmentService;
      const children = await fs.readdir(logRoot);
      const expiredSessions = children.filter((name) => /^\d{8}$/.test(name) && Number(name) < day);
      if (expiredSessions.length > 0) {
        await Promise.all(expiredSessions.map((name) => fs.rm(path.join(logRoot, name), { recursive: true, force: true, maxRetries: 3 })));
      }
    } catch {
      // noop
    }
  }
}
