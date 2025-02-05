import http from 'http';
import path from 'path';

import { namedHookWithTaskFn, PluginBase } from '@electron-forge/plugin-base';
import { ForgeMultiHookMap, StartResult } from '@electron-forge/shared-types';
import Logger, { Tab } from '@electron-forge/web-multi-logger';
import chalk from 'chalk';
import debug from 'debug';
import fs from 'fs/promises';
import { PRESET_TIMER } from 'listr2';
import webpack, { Configuration, Watching, Compiler } from 'webpack';
import WebpackDevServer from 'webpack-dev-server';

import mainConfig from './webpack.main.config'
import rendererConfig from './webpack.renderer.config'
import nodeConfig from './webpack.node.config'
import { extHostConfig, workerHostConfig } from './webpack.ext-host.config'
import { watcherHostConfig } from './webpack.watcher-host.config'
import webviewConfig from './webpack.webview.config'

const d = debug('electron-forge:plugin:webpack');
const DEFAULT_LOGGER_PORT = 9000;

type WebpackToJsonOptions = Parameters<webpack.Stats['toJson']>[0];

const pluginName = 'ElectronForgeLogging';

class LoggingPlugin {
  tab: Tab;

  constructor(tab: Tab) {
    this.tab = tab;
  }

  apply(compiler: Compiler): void {
    compiler.hooks.done.tap(pluginName, (stats) => {
      if (stats) {
        this.tab.log(
          stats.toString({
            colors: true,
          })
        );
      }
    });
    compiler.hooks.failed.tap(pluginName, (err) => this.tab.log(err.message));
    compiler.hooks.infrastructureLog.tap(pluginName, (name: string, _type: string, args: string[]) => {
      this.tab.log(`${name} - ${args.join(' ')}\n`);
      return true;
    });
  }
}

export interface WebpackPluginConfig {
  jsonStats?: boolean;
  loggerPort?: number;
}

export class WebpackPlugin extends PluginBase<WebpackPluginConfig> {
  name = 'webpack';

  private isProd = false;

  private baseDir!: string;

  private watchers: Watching[] = [];

  private servers: http.Server[] = [];

  private loggers: Logger[] = [];

  private loggerPort = DEFAULT_LOGGER_PORT;

  private alreadyStarted = false;

  get mode() {
    return this.isProd ? 'production' : 'development';
  }

  constructor(c: WebpackPluginConfig) {
    super(c);

    if (c.loggerPort) {
      if (this.isValidPort(c.loggerPort)) {
        this.loggerPort = c.loggerPort;
      }
    }
  }

  init = (dir: string): void => {
    this.baseDir = path.resolve(dir, 'out');

    d('hooking process events');
    process.on('exit', (_code) => this.exitHandler({ cleanup: true }));
    process.on('SIGINT' as NodeJS.Signals, (_signal) => this.exitHandler({ exit: true }));
  };

  startLogic = async (): Promise<StartResult> => {
    if (this.alreadyStarted) return false;
    this.alreadyStarted = true;

    await fs.rm(this.baseDir, { recursive: true, force: true });

    const logger = new Logger(this.loggerPort);
    this.loggers.push(logger);
    await logger.start();

    return {
      tasks: [
        {
          title: 'Compiling main process code',
          task: async () => {
            const tab = logger.createTab('Main Process')
            await this.compile(mainConfig, 'main', 'main', true, tab);
          },
          rendererOptions: {
            timer: { ...PRESET_TIMER },
          },
        },
        {
          title: 'Compiling node process code',
          task: async () => {
            const tab = logger.createTab('Node Process')
            await this.compile(nodeConfig, 'node', 'node', true, tab);
          },
          rendererOptions: {
            timer: { ...PRESET_TIMER },
          },
        },
        {
          title: 'Compiling ext host code',
          task: async () => {
            const tab = logger.createTab('Ext Host Process')
            await this.compile(extHostConfig, 'ext-host', 'ext-host', true, tab)
          },
          rendererOptions: {
            timer: { ...PRESET_TIMER },
          },
        },
        {
          title: 'Compiling worker host code',
          task: async () => {
            const tab = logger.createTab('Worker Host')
            await this.compile(workerHostConfig, 'ext-host', 'worker-host', false, tab)
          },
          rendererOptions: {
            timer: { ...PRESET_TIMER },
          },
        },
        {
          title: 'Compiling wathcer host code',
          task: async () => {
            const tab = logger.createTab('Watcher Host')
            await this.compile(watcherHostConfig, 'watcher-host', 'watcher-host', false, tab)
          },
          rendererOptions: {
            timer: { ...PRESET_TIMER },
          },
        },
        {
          title: 'Compiling webview process code',
          task: async () => {
            const tab = logger.createTab('Webview Process')
            await this.compile(webviewConfig, 'webview', 'webview', false, tab)
          },
          rendererOptions: {
            timer: { ...PRESET_TIMER },
          },
        },
        {
          title: 'Launching dev servers for renderer process code',
          task: async (_, task) => {
            const tab = logger.createTab('Render Process')
            await this.launchRendererDevServers(tab);
            task.output = `Output Available: ${chalk.cyan(`http://localhost:${this.loggerPort}`)}\n`;
          },
          rendererOptions: {
            persistentOutput: true,
            timer: { ...PRESET_TIMER },
          },
        },
      ],
      result: false,
    };
  }

  getHooks = (): ForgeMultiHookMap => {
    return {
      prePackage: [
        namedHookWithTaskFn<'prePackage'>(async (task, config, platform, arch) => {
          if (!task) {
            throw new Error('Incompatible usage of webpack-plugin prePackage hook');
          }

          this.isProd = true;
          await fs.rm(this.baseDir, { recursive: true, force: true });

          return task.newListr(
            [
              {
                title: 'Building webpack bundles',
                task: async () => {
                  await this.compile(mainConfig, 'main', 'main');
                  await this.compile(nodeConfig, 'node', 'node');
                  await this.compile(extHostConfig, 'ext-host', 'ext-host');
                  await this.compile(workerHostConfig, 'ext-host', 'worker-host');
                  await this.compile(webviewConfig, 'webview', 'webview');
                  await this.compile(rendererConfig, 'renderer', 'renderer');
                },
                rendererOptions: {
                  timer: { ...PRESET_TIMER },
                },
              },
            ],
            { concurrent: false }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ) as any;
        }, 'Preparing webpack bundles'),
      ],
      postStart: async (_config, child) => {
        d('hooking electron process exit');
        child.on('exit', () => {
          if (child.restarted) return;
          this.exitHandler({ cleanup: true, exit: true });
        });
      },
    };
  }

  private isValidPort = (port: number) => {
    if (port < 1024) {
      throw new Error(`Cannot specify port (${port}) below 1024, as they are privileged`);
    } else if (port > 65535) {
      throw new Error(`Port specified (${port}) is not a valid TCP port.`);
    } else {
      return true;
    }
  };

  private exitHandler = (options: { cleanup?: boolean; exit?: boolean }): void => {
    d('handling process exit with:', options);
    if (options.cleanup) {
      for (const watcher of this.watchers) {
        d('cleaning webpack watcher');
        watcher.close(() => {
          /* Do nothing when the watcher closes */
        });
      }
      this.watchers = [];
      for (const server of this.servers) {
        d('cleaning http server');
        server.close();
      }
      this.servers = [];
      for (const logger of this.loggers) {
        d('stopping logger');
        logger.stop();
      }
      this.loggers = [];
    }
    if (options.exit) process.exit();
  };

  private async writeJSONStats(type: string, stats: webpack.Stats | undefined, statsOptions: WebpackToJsonOptions, suffix: string): Promise<void> {
    if (!stats) return;
    d(`Writing JSON stats for ${type} config`);
    const jsonStats = stats.toJson(statsOptions);
    const jsonStatsFilename = path.resolve(this.baseDir, type, `stats-${suffix}.json`);
    await fs.writeFile(jsonStatsFilename, JSON.stringify(jsonStats, null, 2))
  }

  private async compile(c: Configuration | ((env: unknown, argv: Record<string, any>) => Configuration), name: string, statsName: string, watch = false, tab?: Tab) {  
    await new Promise((resolve, reject) => {
      const config = this.processConfig(c)
      const compiler = webpack(config);
      const cb: Parameters<webpack.Compiler['watch']>[1] = async (err, stats) => {
        if (tab && stats) {
          tab.log(
            stats.toString({
              colors: true,
            })
          );
        }
        if (this.config.jsonStats) {
          await this.writeJSONStats(name, stats, config.stats, statsName);
        }
  
        if (err) return reject(err);
        if (!watch && stats?.hasErrors()) {
          return reject(new Error(`Compilation errors in the ${name} process: ${stats.toString()}`));
        }
  
        return resolve(undefined);
      };
      if (watch) {
        this.watchers.push(compiler.watch({}, cb));
      } else {
        compiler.run(cb);
      }
    });
  }

  private launchRendererDevServers = async (tab: Tab): Promise<void> => {
    const config = this.processConfig(rendererConfig)
    if (!config.plugins) config.plugins = [];
    config.plugins.push(new LoggingPlugin(tab));
    const compiler = webpack(config);
    const webpackDevServer = new WebpackDevServer(config.devServer, compiler);
    await webpackDevServer.start();
    this.servers.push(webpackDevServer.server!);
  };

  private processConfig(c: Configuration | ((env: unknown, argv: Record<string, any>) => Configuration)) {
    if (typeof c === 'function') {
      return c({}, { mode: this.mode })
    }
    return c
  }
}
