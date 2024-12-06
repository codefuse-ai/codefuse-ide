import type { ILogService as _ILogService } from "@opensumi/ide-logs/lib/common";

export const ILogService = Symbol("ILogService");
export interface ILogService extends _ILogService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(...args: any[]): void;
}
