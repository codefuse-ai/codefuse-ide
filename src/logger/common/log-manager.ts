import * as path from 'node:path'
import { Emitter } from '@opensumi/ide-core-common';
import { ILogServiceManager, LogLevel, SupportLogNamespace, ILogService, BaseLogServiceOptions, Archive } from '@opensumi/ide-logs'
import { SpdLogger } from './log-service'

export abstract class AbstractLogServiceManager implements ILogServiceManager {
  #logLevel = process.env.NODE_ENV === 'development' ? LogLevel.Debug : LogLevel.Info;
  #logMap = new Map<SupportLogNamespace | string, ILogService>();
  #logLevelChangeEmitter = new Emitter<LogLevel>();

  getLogger(namespace: SupportLogNamespace | string, loggerOptions?: BaseLogServiceOptions): ILogService {
    let logger = this.#logMap.get(namespace);
    if (logger) {
      if (loggerOptions) {
        logger.setOptions(loggerOptions)
      }
      return logger
    }
    // 默认使用 spdlog，上层也可拿到 logger 再次封装
    const options = {
      namespace,
      logLevel: this.getGlobalLogLevel(),
      logServiceManager: this,
      ...loggerOptions,
    }
    logger = new SpdLogger({
      logLevel: options.logLevel,
      logPath: options.logDir || path.join(this.getLogFolder(), `${namespace}.log`),
    });
    this.#logMap.set(namespace, logger);
    return logger;
  }

  removeLogger(namespace: SupportLogNamespace) {
    this.#logMap.delete(namespace);
  }

  getGlobalLogLevel(): LogLevel {
    return this.#logLevel;
  }

  setGlobalLogLevel(level: LogLevel) {
    this.#logLevel = level;
  }

  get onDidChangeLogLevel() {
    return this.#logLevelChangeEmitter.event;
  }

  abstract getLogFolder(): string

  abstract getRootLogFolder(): string

  async cleanOldLogs() {}

  async cleanAllLogs() {}

  async cleanExpiredLogs(_day: number) {}

  async getLogZipArchiveByDay(_day: number): Promise<Archive> { return { pipe: () => null } }

  async getLogZipArchiveByFolder(_foldPath: string): Promise<Archive> { return { pipe: () => null } }

  dispose() {
    this.#logLevelChangeEmitter.dispose();
    this.#logMap.forEach((logger) => {
      logger.dispose();
    });
  }
}
