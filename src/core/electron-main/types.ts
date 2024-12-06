import { ElectronMainContribution as BaseElectronMainContribution } from '@opensumi/ide-core-electron-main';

import type { MaybePromise,  } from '@opensumi/ide-core-common'

export const ElectronMainContribution = BaseElectronMainContribution;

export interface ElectronMainContribution extends BaseElectronMainContribution {
  /**
   * app.isReady 之前
   */
  onBeforeReady?(): void;
  /**
   * after app.isReady
   */
  onWillStart?(): MaybePromise<void>;

  /**
   * after all onWillStart
   */
  onStart?(): MaybePromise<void>;

  /**
   * app event will-quit
   */
  onWillQuit?(): MaybePromise<void>;
}

