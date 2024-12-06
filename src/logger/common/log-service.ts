import { uuid } from "@opensumi/ide-core-common";
import { format, LogLevel } from "@opensumi/ide-logs";

import type { ILogService } from "./types";
import type { BaseLogServiceOptions } from "@opensumi/ide-logs";
import type * as spdlog from "@vscode/spdlog";

interface ILog {
  level: LogLevel;
  message: string;
}

interface ILogServiceOptions {
  logPath: string;
  logLevel: LogLevel;
  pid?: number;
}

enum SpdLogLevel {
  Trace,
  Debug,
  Info,
  Warning,
  Error,
  Critical,
  Off,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogArgumentType = any[];

export abstract class AbstractLogService implements ILogService {
  protected logger: SpdLogger | undefined;
  protected logPath: string;
  protected logLevel: LogLevel;

  protected constructor(options: ILogServiceOptions) {
    this.logPath = options.logPath;
    this.logLevel = options.logLevel || LogLevel.Info;
  }

  abstract sendLog(level: LogLevel, message: string): void;

  verbose(...args: LogArgumentType): void {
    if (!this.shouldLog(LogLevel.Verbose)) return;
    this.sendLog(LogLevel.Verbose, format(args));
  }

  debug(...args: LogArgumentType): void {
    if (!this.shouldLog(LogLevel.Debug)) return;
    this.sendLog(LogLevel.Debug, format(args));
  }

  log(...args: LogArgumentType): void {
    if (!this.shouldLog(LogLevel.Info)) return;
    this.sendLog(LogLevel.Info, format(args));
  }

  info(...args: LogArgumentType): void {
    if (!this.shouldLog(LogLevel.Info)) return;
    this.sendLog(LogLevel.Info, format(args));
  }

  warn(...args: LogArgumentType): void {
    if (!this.shouldLog(LogLevel.Warning)) return;
    this.sendLog(LogLevel.Warning, format(args));
  }

  error(...args: LogArgumentType): void {
    if (!this.shouldLog(LogLevel.Error)) return;
    const arg = args[0];
    let message: string;

    if (arg instanceof Error) {
      const array = Array.prototype.slice.call(arg) as LogArgumentType;
      array[0] = arg.stack;
      message = format(array);
      this.sendLog(LogLevel.Error, message);
    } else {
      message = format(args);
      this.sendLog(LogLevel.Error, message);
    }
  }

  critical(...args: LogArgumentType): void {
    if (!this.shouldLog(LogLevel.Critical)) return;
    this.sendLog(LogLevel.Critical, format(args));
  }

  setOptions(options: BaseLogServiceOptions) {
    if (options.logLevel) {
      this.logLevel = options.logLevel;
    }
  }

  getLevel(): LogLevel {
    return this.logLevel;
  }

  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  async drop() {}

  async flush() {}

  dispose() {}

  protected shouldLog(level: LogLevel): boolean {
    return this.getLevel() <= level;
  }
}

export class SpdLogger extends AbstractLogService {
  #buffer: ILog[] = [];
  #spdLoggerCreatePromise: Promise<void>;
  #logger: spdlog.Logger | undefined;

  constructor(options: ILogServiceOptions) {
    super(options);
    this.#spdLoggerCreatePromise = this.#createSpdLogLogger();
  }

  sendLog(level: LogLevel, message: string): void {
    if (this.#logger) {
      switch (level) {
        case LogLevel.Verbose:
          return this.#logger.trace(message);
        case LogLevel.Debug:
          return this.#logger.debug(message);
        case LogLevel.Info:
          return this.#logger.info(message);
        case LogLevel.Warning:
          return this.#logger.warn(message);
        case LogLevel.Error:
          return this.#logger.error(message);
        case LogLevel.Critical:
          return this.#logger.critical(message);
        default:
          throw new Error("Invalid log level");
      }
    } else if (this.getLevel() <= level) {
      this.#buffer.push({ level, message });
    }
  }

  override async flush() {
    if (this.#logger) {
      this.#logger.flush();
    } else {
      this.#spdLoggerCreatePromise.then(() => this.flush());
    }
  }

  override async drop() {
    if (this.#logger) {
      this.#logger.drop();
    } else {
      return this.#spdLoggerCreatePromise.then(() => this.drop());
    }
  }

  override dispose(): void {
    this.drop();
  }

  async #createSpdLogLogger(): Promise<void> {
    const fileCount = 6;
    const fileSize = 5 * 1024 * 1024;
    try {
      const _spdlog = await import("@vscode/spdlog");
      _spdlog.setFlushOn(SpdLogLevel.Trace);
      const logger = await _spdlog.createAsyncRotatingLogger(
        uuid(),
        this.logPath,
        fileSize,
        fileCount,
      );
      this.#logger = logger;
      logger.setPattern("%Y-%m-%d %H:%M:%S.%e [%l] %v");
      logger.setLevel(this.getSpdLogLevel(this.getLevel()));
      for (const { level, message } of this.#buffer) {
        this.sendLog(level, message);
      }
      this.#buffer = [];
    } catch (e) {
      console.error(e);
    }
  }

  private getSpdLogLevel(level: LogLevel): SpdLogLevel {
    switch (level) {
      case LogLevel.Verbose:
        return SpdLogLevel.Trace;
      case LogLevel.Debug:
        return SpdLogLevel.Debug;
      case LogLevel.Info:
        return SpdLogLevel.Info;
      case LogLevel.Warning:
        return SpdLogLevel.Warning;
      case LogLevel.Error:
        return SpdLogLevel.Error;
      case LogLevel.Critical:
        return SpdLogLevel.Critical;
      default:
        return SpdLogLevel.Off;
    }
  }
}
