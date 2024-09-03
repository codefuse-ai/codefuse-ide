import { MakerBase, MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';
import { build } from 'app-builder-lib'
import path from 'node:path'
import { productName, applicationName } from '../product.json'

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
