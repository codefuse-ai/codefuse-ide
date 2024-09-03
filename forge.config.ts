import type { ForgeConfig } from '@electron-forge/shared-types';
import path from 'path'
import fsp from 'fs/promises'
import { downloadExtensions } from './build/download-extensions'
import { WebpackPlugin } from './build/webpack/ForgeWebpackPlugin'
import { buildAsar } from './build/build-asar'
import { signWinApp } from './build/util'
import { rebuild } from './build/rebuild'
import { MakerNsis } from './build/maker-nisi'
import { MakerZip } from './build/maker-zip'
import packageData from './package.json'
import productData from './product.json'

const config: ForgeConfig = {
  packagerConfig: {
    asar: false,
    appVersion: packageData.version,
    name: productData.productName,
    appBundleId: productData.darwinBundleIdentifier,
    icon: path.join(__dirname, './assets/icon/icon'),
    extendInfo: {
      CFBundleIconFile: 'icon.icns',
    },
    ignore: (file: string) => {
      if (!file) return false;
      return !/^[/\\](out|extensions|package\.json|product\.json)($|[/\\]).*$/.test(file);
    },
    prune: false,
    afterFinalizePackageTargets: [
      async (targets, done) => {
        for (const target of targets) {
          await rebuild({ arch: target.arch })
          await buildAsar(path.resolve(`out/asar/${target.arch}`))
        }
        done()
      }
    ],
    afterCopy: [
      async (appPath, electronVersion, pPlatform, pArch, done) => {
        const asarDir = path.join(appPath, 'out/asar')
        const files = await fsp.readdir(path.join(asarDir, pArch))
        for (const filename of files) {
          await fsp.rename(path.join(asarDir, pArch, filename), path.join(appPath, filename))
        }
        await fsp.rm(asarDir, { recursive: true })
        done()
      }
    ],
    afterComplete: [
      async (finalPath, electronVersion, pPlatform, pArch, done) => {
        if (process.env.MAC_NOTARIZE_SCRIPT) {
          const mod = await import(process.env.MAC_NOTARIZE_SCRIPT)
          const fn = typeof mod === 'object' && mod && mod.default ? mod.default : mod;
          if (typeof fn === 'function') {
            await fn(path.join(finalPath, `${productData.productName}.app`), productData.darwinBundleIdentifier)
          }
        }
        done()
      }
    ],
    extraResource: [
      path.join(__dirname, './assets/app-update.yml'), // for electron-updater
    ],
    ...(process.env.WINDOWS_SIGN_TOOL_PATH ? ({
      windowsSign: {
        hookFunction: file => signWinApp(file)
      },
    }) : null),
    ...(process.env.OSX_SIGN_IDENTITY ? {
      osxSign: {
        identity: process.env.OSX_SIGN_IDENTITY,
      },
    } : null),
  },
  outDir: 'dist',
  // @electron/rebuild 不支持 node-gyp 10，手动构建，跳过 forge 的自动构建
  rebuildConfig: {
    onlyModules: [],
  },
  makers: [new MakerNsis(), new MakerZip()],
  plugins: [
    new WebpackPlugin({}),
  ],
  hooks: {
    generateAssets: async () => {
      await downloadExtensions();
    },
  },
};

export default config;
