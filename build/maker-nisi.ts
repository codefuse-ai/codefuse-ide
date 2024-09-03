import { MakerBase, MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';
import { buildForge } from 'app-builder-lib'
import path from 'node:path'
import { signWinApp } from './util'
import { productName, applicationName } from '../product.json'

interface MakerNsisConfig {}

export default class MakerNsis extends MakerBase<MakerNsisConfig> {
  name = 'nsis';

  defaultPlatforms: ForgePlatform[] = ['win32'];

  isSupportedOnCurrentPlatform(): boolean {
    return true;
  }

  async make({ dir, makeDir, targetArch }: MakerOptions): Promise<string[]> {
    return buildForge(
      { dir },
      {
        win: [`nsis:${targetArch}`],
        prepackaged: dir,
        config: {
          productName,
          artifactName: `${applicationName}Setup-\${os}-\${arch}.\${ext}`,
          directories: {
            output: path.join(makeDir, 'nsis', targetArch),
          },
          win: {
            sign: ({ path }) => signWinApp(path)
          },
          nsis: {
            oneClick: false,
            allowToChangeInstallationDirectory: true,
            perMachine: true,
            installerIcon: path.join(__dirname, '../assets/icon/icon.ico')
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

export { MakerNsis };
