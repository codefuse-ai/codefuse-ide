import {
  BaseLogServiceOptions,
  LogLevel,
  format,
} from '@opensumi/ide-logs';
import { uuid } from '@opensumi/ide-core-common';
import type * as spdlog from '@vscode/spdlog'
import { ILogService } from './types'

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
	Off
}

export abstract class AbstractLogService implements ILogService {
  protected logger: SpdLogger | undefined;
  protected logPath: string;
  protected logLevel: LogLevel;

  constructor(options: ILogServiceOptions) {
    this.logPath = options.logPath;
    this.logLevel = options.logLevel || LogLevel.Info;
  }

  abstract sendLog(level: LogLevel, message: string): void

  protected shouldLog(level: LogLevel): boolean {
		return this.getLevel() <= level;
	}

  verbose(): void {
    if (!this.shouldLog(LogLevel.Verbose)) return
    this.sendLog(LogLevel.Verbose, format(arguments));
  }

  debug(): void {
    if (!this.shouldLog(LogLevel.Debug)) return
    this.sendLog(LogLevel.Debug, format(arguments));
  }

  log(): void {
    if (!this.shouldLog(LogLevel.Info)) return
    this.sendLog(LogLevel.Info, format(arguments));
  }

  info(): void {
    if (!this.shouldLog(LogLevel.Info)) return
    this.sendLog(LogLevel.Info, format(arguments));
  }

  warn(): void {
    if (!this.shouldLog(LogLevel.Warning)) return
    this.sendLog(LogLevel.Warning, format(arguments));
  }

  error(): void {
    if (!this.shouldLog(LogLevel.Error)) return
    const arg = arguments[0];
    let message: string;

    if (arg instanceof Error) {
      const array = Array.prototype.slice.call(arguments) as any[];
      array[0] = arg.stack;
      message = format(array);
      this.sendLog(LogLevel.Error, message);
    } else {
      message = format(arguments);
      this.sendLog(LogLevel.Error, message);
    }
  }

  critical(): void {
    if (!this.shouldLog(LogLevel.Critical)) return
    this.sendLog(LogLevel.Critical, format(arguments));
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
}

export class SpdLogger extends AbstractLogService {
  #buffer: ILog[] = [];
	#spdLoggerCreatePromise: Promise<void>;
	#logger: spdlog.Logger | undefined;

	constructor(options: ILogServiceOptions) {
		super(options);
		this.#spdLoggerCreatePromise = this.#createSpdLogLogger();
	}

	async #createSpdLogLogger(): Promise<void> {
		const fileCount = 6;
		const fileSize = 5 * 1024 * 1024;
    try {
      const _spdlog = await import('@vscode/spdlog');
      _spdlog.setFlushOn(SpdLogLevel.Trace);
      const logger = await _spdlog.createAsyncRotatingLogger(uuid(), this.logPath, fileSize, fileCount);
      this.#logger = logger;
      logger.setPattern('%Y-%m-%d %H:%M:%S.%e [%l] %v');
      logger.setLevel(this.getSpdLogLevel(this.getLevel()))
      for (const { level, message } of this.#buffer) {
        this.sendLog( level, message);
      }
      this.#buffer = [];
    } catch (e) {
      console.error(e);
    }
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
          throw new Error('Invalid log level');
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

  private getSpdLogLevel(level: LogLevel): SpdLogLevel {
    switch (level) {
      case LogLevel.Verbose: return SpdLogLevel.Trace;
      case LogLevel.Debug: return SpdLogLevel.Debug;
      case LogLevel.Info: return SpdLogLevel.Info;
      case LogLevel.Warning: return SpdLogLevel.Warning;
      case LogLevel.Error: return SpdLogLevel.Error;
      case LogLevel.Critical: return SpdLogLevel.Critical;
      default: return SpdLogLevel.Off;
    }
  }
}
