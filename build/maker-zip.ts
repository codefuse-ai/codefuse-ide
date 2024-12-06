import path from 'node:path'

import { MakerBase } from '@electron-forge/maker-base';
import { build } from 'app-builder-lib'

import { productName, applicationName } from '../product.json'
import type { MakerOptions } from '@electron-forge/maker-base';
import type { ForgePlatform } from '@electron-forge/shared-types';




interface MakerZipConfig {}

export default class MakerZip extends MakerBase<MakerZipConfig> {
  name = 'zip';

  defaultPlatforms: ForgePlatform[] = ['darwin'];

  isSupportedOnCurrentPlatform(): boolean {
    return true;
  }

  async make({ dir, makeDir, targetArch, appName }: MakerOptions): Promise<string[]> {
    return build(
      {
        prepackaged: path.resolve(dir, `${appName}.app`),
        mac: [`zip:${targetArch}`],
        config: {
          productName,
          artifactName: `${applicationName}-\${os}-\${arch}.\${ext}`,
          directories: {
            output: path.join(makeDir, 'zip', targetArch),
          },
          publish: {
            provider: 'generic',
            url: '',
            channel: 'latest'
          }
        },
      }
    )
  }
}

export { MakerZip };
