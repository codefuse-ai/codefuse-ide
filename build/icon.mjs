import { appBuilderPath } from 'app-builder-bin';
import { spawnSync } from 'child_process'
import { join } from 'path'

for (const format of ['icns', 'ico']) {
  const { error } = spawnSync(appBuilderPath, [
    'icon',
    '--format',
    format,
    '--input',
    join(import.meta.dirname, '../assets/icon/1024.png'),
    '--out',
    join(import.meta.dirname, '../assets/icon'),
  ], {
    stdio: 'inherit'
  })
  if (error) {
    console.error(error)
  }
}
