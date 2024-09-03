import type { UpdateInfo, ProgressInfo } from 'electron-updater'

export { UpdateInfo, ProgressInfo }

export const enum UpdateState {
  NoAvailable = 'NoAvailable',
  Checking = 'Checking',
  CheckingError = 'CheckingError',
  Available = 'Available',
  Downloading = 'Downloading',
  DownloadError = 'DownloadError',
  Downloaded = 'Downloaded',
  UpdateError = 'UpdateError'
}

export const IUpdateMainService = 'IUpdateMainService'
export interface IUpdateMainService {
  checkForUpdatesManual(): Promise<void>
}

export enum IPC_CHANNEL {
  initialState = 'initialState',
  downloadAndInstall = 'downloadAndInstall',
  eventData = 'eventData',
  ignoreVersion = 'ignoreVersion'
}

export interface InitialState {
  updateState: UpdateState,
  updateInfo: UpdateInfo | null,
  progressInfo: ProgressInfo | null,
}

export interface EventData {
  event: string;
  data?: any;
}
