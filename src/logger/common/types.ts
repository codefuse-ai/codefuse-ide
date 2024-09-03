import type { ILogService as _ILogService } from '@opensumi/ide-logs/lib/common'
export const ILogService = Symbol('ILogService');
export interface ILogService extends _ILogService {
  info(...args: any[]): void;
}
