import { Provider, ResolvedUpdateFileInfo, UpdateInfo, AppUpdater } from 'electron-updater'
import yaml from 'js-yaml'
import type { CustomPublishOptions as BaseCustomPublishOptions } from 'builder-util-runtime'

export interface CustomPublishOptions extends BaseCustomPublishOptions {
  readonly configUrl: string
}

interface AutoUpdateConfig {
  platform: string;
  channel: string;
  channelUrl: string;
  releaseNote: string;
  stagingPercentage: number;
}

const newError = (message: string, code: string) => {
  const error = new Error(message)
  ;(error as NodeJS.ErrnoException).code = code;
  return error
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
          throw newError(`Cannot get config data in the latest release config (${this.configuration.configUrl}): rawData: null`, 'ERR_UPDATER_INVALID_UPDATE_INFO')
        }
        let config: AutoUpdateConfig[]
        try {
          config = JSON.parse(rawData)
        } catch (err: any) {
          throw newError(
            `Cannot parse update info in the latest release config (${this.configuration.configUrl}): ${err.stack || err.message}, rawData: ${rawData}`,
            'ERR_UPDATER_INVALID_UPDATE_INFO'
          )
        }
        const channelConfig = config.find(item => item.channel === this.channel)
        if (!channelConfig) {
          throw newError(
            `Cannot find chanel update info in the latest release config (${this.configuration.configUrl}), rawData: ${rawData}`,
            'ERR_UPDATER_INVALID_UPDATE_INFO'
          )
        }
        const { channelUrl, stagingPercentage, releaseNote } = channelConfig;
        const channelRawData = await this.httpRequest(new URL(channelUrl))
        if (!channelRawData) {
          throw newError(`Cannot get channel data in latest release channel (${channelUrl}): rawData: null`, 'ERR_UPDATER_INVALID_UPDATE_INFO')
        }
        let updateInfo: UpdateInfo
        try {
          updateInfo = yaml.load(channelRawData) as UpdateInfo
          Object.assign(updateInfo, {
            stagingPercentage,
            releaseNotes: releaseNote,
          })
        } catch (err) {
          throw newError(`Cannot prase update info in latest release channel (${channelUrl}): rawData: ${channelRawData}`, 'ERR_UPDATER_INVALID_UPDATE_INFO')
        }
        return updateInfo
      } catch (e: any) {
        if ('statusCode' in e && e.statusCode === 404) {
          throw newError(`Cannot find channel "${channelFile}" update info: ${e.stack || e.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND")
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
