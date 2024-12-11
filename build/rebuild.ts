import * as path from 'node:path';
import { version as electronVersion } from 'electron/package.json'
import { nativeDeps, postInstallDeps } from './deps'
import { exec } from './util'
import { parseArgv } from '@opensumi/ide-utils/lib/argv'

const argv = parseArgv(process.argv)

export const rebuild = async (config?: { arch?: string, cwd?: string, silent?: boolean, loglevel?: string }) => {
  const target = argv.target || 'electron'
  const arch = config?.arch || process.arch
  const cwd = config?.cwd || process.cwd()
  const loglevel = config?.loglevel || 'info'

  for (const pkgName of nativeDeps) {
    const pkgPath = path.join(cwd, 'node_modules', pkgName);
    await exec(
      [
        'npx',
        'node-gyp',
        'rebuild',
        ...target == 'electron' ? [
          '--runtime=electron',
          `--target=${electronVersion}`,
          `--arch=${arch}`,
          `--dist-url=https://electronjs.org/headers`,
          `--loglevel=${loglevel}`
        ] : []
      ].join(' '),
      null,
      {
        cwd: pkgPath,
        stdio: config?.silent ? 'ignore' : 'inherit',
      })
  }

  for (const pkgName of postInstallDeps) {
    const pkgPath = path.join(process.cwd(), 'node_modules', pkgName);
    await exec(
      `npm run postinstall --arch=${arch} -- --force`,
      null,
      {
        cwd: pkgPath,
        stdio: config?.silent ? 'ignore' : 'inherit'
      }
    )
  }
}

if (require.main === module) {
  rebuild({
    silent: false
  })
}
