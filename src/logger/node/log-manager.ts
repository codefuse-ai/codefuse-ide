import * as path from 'path'
import { Injectable } from '@opensumi/di';
import { AbstractLogServiceManager } from '../common'
import * as process from "node:process";

@Injectable()
export class LogServiceManager extends AbstractLogServiceManager {
  getRootLogFolder(): string {
    return process.env.IDE_LOG_ROOT!;
  }

  getLogFolder(): string {
    return path.join(process.env.IDE_LOG_HOME || '', `window${process.env.CODE_WINDOW_CLIENT_ID?.slice('CODE_WINDOW_CLIENT_ID:'?.length)}`)
  }
}
