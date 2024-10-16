import { autoUpdater, UpdateInfo, Provider, ResolvedUpdateFileInfo, AppUpdater, CancellationToken, ProgressInfo } from 'electron-updater'
import type { CustomPublishOptions as BaseCustomPublishOptions } from 'builder-util-runtime'
import yaml from 'js-yaml'
import { Autowired, Injectable } from '@opensumi/di'
import { Emitter } from '@opensumi/ide-core-common'
import { ILogService } from '@/logger/common'
import { StorageService } from '@/core/electron-main'
import { IProduct } from '@/core/common'
import { UpdateState, EventData } from '../common'

interface CustomPublishOptions extends BaseCustomPublishOptions {
  readonly configUrl: string
}

interface AutoUpdateConfig {
  platform: string;
  channel: string;
  channelUrl: string;
  releaseNote: string;
  stagingPercentage: number;
}

export class CustomProvider extends Provider<UpdateInfo> {
  constructor(
    private readonly configuration: CustomPublishOptions,
    private readonly updater: AppUpdater,
    runtimeOptions: any,
  ) {
    super(runtimeOptions)
  }

  private get channel(): string {
    const result = this.updater.channel || this.configuration.channel
    return result == null ? this.getDefaultChannelName() : this.getCustomChannelName(result)
  }

  async getLatestVersion(): Promise<UpdateInfo> {
    const channelFile = `${this.channel}.yml`
    for (let attemptNumber = 0; ; attemptNumber++) {
      try {
        const rawData = await this.httpRequest(new URL(this.configuration.configUrl))
        if (!rawData) {
          throw new Error(`Cannot get update config (${this.configuration.configUrl}): rawData: null`)
        }
        let config: AutoUpdateConfig[]
        try {
          config = JSON.parse(rawData)
        } catch (err: any) {
          throw new Error(`Cannot parse update config (${this.configuration.configUrl}): ${err.stack || err.message}, rawData: ${rawData}`)
        }
        const channelConfig = config.find(item => item.channel === this.channel)
        if (!channelConfig) {
          throw new Error(`Cannot find chanel config (${this.configuration.configUrl}), rawData: ${rawData}`)
        }
        const { channelUrl, stagingPercentage, releaseNote } = channelConfig;
        const channelRawData = await this.httpRequest(new URL(channelUrl))
        if (!channelRawData) {
          throw new Error(`Cannot get channel info (${channelUrl}): rawData: null`)
        }
        let updateInfo: UpdateInfo
        try {
          updateInfo = yaml.load(channelRawData) as UpdateInfo
          Object.assign(updateInfo, {
            stagingPercentage,
            releaseNotes: releaseNote,
          })
        } catch (err) {
          throw new Error(`Cannot prase channel info (${channelUrl}): rawData: ${channelRawData}`)
        }
        return updateInfo
      } catch (e: any) {
        if ('statusCode' in e && e.statusCode === 404) {
          throw new Error(`Cannot request channel "${channelFile}" update info: ${e.stack || e.message}`)
        } else if (e.code === "ECONNREFUSED") {
          if (attemptNumber < 3) {
            await new Promise((resolve, reject) => {
              try {
                setTimeout(resolve, 1000 * attemptNumber)
              } catch (e: any) {
                reject(e)
              }
            })
            continue
          }
        }
        throw e
      }
    }
  }

  resolveFiles(updateInfo: UpdateInfo): Array<ResolvedUpdateFileInfo> {
    return updateInfo.files.map(info => ({
      url: new URL(info.url),
      info,
    }))
  }
}

@Injectable()
export class AutoUpdaterService {
  @Autowired(StorageService)
  storageService: StorageService

  @Autowired(ILogService)
  logger: ILogService

  @Autowired(IProduct)
  product: IProduct

  #initialized = false;

  #updateState = UpdateState.NoAvailable
  get updateState() { return this.#updateState }

  #updateInfo: UpdateInfo | null = null;
  get updateInfo() { return this.#updateInfo }

  #cancellationToken: CancellationToken | null

  #progressInfo: ProgressInfo | null = null;
  get progressInfo() { return this.#progressInfo }

  #updateEmitter = new Emitter<EventData>()
  get updateEvent() { return this.#updateEmitter.event }

  #ignoreVersions = new Set<string>()
  get ignoreVersion() { return this.#ignoreVersions }

  init() {
    if (this.#initialized) return
    this.#initialized = true
    autoUpdater.autoDownload = false
    autoUpdater.disableDifferentialDownload = true
    autoUpdater.logger = this.logger;
    autoUpdater.setFeedURL({
      provider: 'custom',
      updateProvider: CustomProvider,
      configUrl: this.storageService.getItem('autoUpdaterConfigUrl') || this.product.autoUpdaterConfigUrl,
    } as CustomPublishOptions)
    this.logger.info('[auto-updater] init')
    this.registerAutoUpdaterListener()
    let ignoreVersions = this.storageService.getItem('ignoreUpdateVersions')
    if (Array.isArray(ignoreVersions)) {
      this.#ignoreVersions = new Set(ignoreVersions)
    }
  }

  private registerAutoUpdaterListener() {
    autoUpdater
      .on('checking-for-update', () => {
        this.logger.debug('[auto-updater] checking-for-update')
        this.#updateState = UpdateState.Checking
      })
      .on('update-not-available', (info: UpdateInfo) => {
        this.logger.debug('[auto-updater] update-not-available', info)
        this.#updateState = UpdateState.NoAvailable
      })
      .on('update-available', (info: UpdateInfo) => {
        this.logger.debug('[auto-updater] update-available', info)
        this.#updateState = UpdateState.Available
        this.#updateInfo = info;
      })
      .on('download-progress', (info: ProgressInfo) => {
        this.#updateState = UpdateState.Downloading
        this.#progressInfo = info;
        this.#updateEmitter.fire({
          event: 'download-progress',
          data: info,
        })
      })
      .on('update-downloaded', () => {
        this.#updateState = UpdateState.Downloaded
        autoUpdater.quitAndInstall()
      })
      .on('error', (err) => {
        this.#updateState = UpdateState.UpdateError
        this.#updateEmitter.fire({
          event: 'error',
          data: err?.message,
        })
      })
  }

  async checkForUpdates() {
    this.init();
    try {
      await autoUpdater.checkForUpdates()
    } catch (err) {
      this.#updateState = UpdateState.CheckingError
      this.logger.error(`[auto-updater] checkForUpdates error: ${err}`)
      return null
    }
  }

  async downloadUpdate() {
    this.#cancellationToken?.dispose()
    this.#cancellationToken = new CancellationToken()
    try {
      await autoUpdater.downloadUpdate(this.#cancellationToken)
    } catch (err) {
      this.#updateState = UpdateState.DownloadError
      console.error('[autoUpdater] downloadUpdate error')
      throw err
    }
  }

  updateIgnoreVersion() {
    if (this.#updateInfo) {
      this.#ignoreVersions.add(this.#updateInfo.version)
      this.storageService.setItem('ignoreUpdateVersions', [...this.#ignoreVersions])
    }
  }
}
