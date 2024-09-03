import { execSync } from 'node:child_process'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { glob } from 'glob'
import { createPackageWithOptions } from 'asar';
import { asarDeps } from './deps'

interface Dep {
  name: string;
  version: string;
}

export async function buildAsar(destDir: string) {
  const deps = getAllAsarDeps()
  await fs.rm(destDir, { recursive: true, force: true })
  const srcModules = path.join(process.cwd(), 'node_modules')
  const destModules = path.join(destDir, 'node_modules')
  await copyDeps(srcModules, destModules, deps)
  await createPackageWithOptions(
    destModules,
    path.join(destDir, 'node_modules.asar'),
    {
      dot: true,
      unpack: '{' + [
        '**/*.node',
        '**/@opensumi/vscode-ripgrep/bin/*',
        '**/node-pty/build/Release/*',
        '**/node-pty/lib/worker/conoutSocketWorker.js',
        '**/node-pty/lib/shared/conout.js',
        '**/*.wasm',
      ].join(',') + '}'
    }
  );
  await fs.rm(destModules, { recursive: true })
}

function parseSemver(value) {
  const [, name, version] = value.match(/(@?[^@]+)@(?:.+):(.+)/);
  return { name, version }
}

function getAllAsarDeps() {
  const raw = execSync('corepack yarn info -A -R --json', { encoding: 'utf-8' })
  const asarDepsMap = {};
  const result: Dep[] = [];
  const allDeps = raw
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line))
    .reduce((acc, data) => {
      const { name } = parseSemver(data.value);
      if (asarDeps.includes(name)) {
        if (asarDepsMap[name]) {
          throw new Error(`Duplicate package: ${name}`)
        }
        asarDepsMap[name] = data.value
      }
      acc[data.value] = data
      return acc
    }, {});

  const addDep = (value) => {
    const { name, version } = parseSemver(value)
    if (name === 'node-gyp') return
    result.push({ name, version })
    const dependencies = allDeps[value].children.Dependencies
    if (!dependencies) return
    dependencies.forEach(({ locator }) => {
      const { name, version } = parseSemver(locator)
      addDep(`${name}@npm:${version}`)
    })
  }

  asarDeps.forEach((pkgName) => {
    const value = asarDepsMap[pkgName]
    addDep(value)
  })

  return result
}

async function copyDeps(srcModules: string, destModules: string, depList: Dep[]) {
  const filenames = await Promise.all([
    glob(depList.map(dep => `${dep.name}/**`), {
      cwd: srcModules,
      dot: true,
      nodir: true,
      ignore: [
        '**/package-lock.json',
        '**/yarn.lock',
        '**/*.js.map',
        'nan/**',
        '*/node_modules/nan/**',
        '**/docs/**',
        '**/example/**',
        '**/examples/**',
        '**/test/**',
        '**/tests/**',
        '**/.vscode/**',
        '**/node-addon-api/**/*',
        '**/prebuild-install/**/*',
        '**/History.md',
        '**/CHANGELOG.md',
        '**/README.md',
        '**/readme.md',
        '**/readme.markdown',
        '**/CODE_OF_CONDUCT.md',
        '**/SUPPORT.md',
        '**/CONTRIBUTING.md',
        '**/*.ts',
        '@vscode/spdlog/binding.gyp',
        '@vscode/spdlog/build/**',
        '@vscode/spdlog/deps/**',
        '@vscode/spdlog/src/**',
        '@vscode/spdlog/*.yml',
        'node-pty/binding.gyp',
        'node-pty/build/**',
        'node-pty/src/**',
        'node-pty/lib/*.test.js',
        'node-pty/tools/**',
        'node-pty/deps/**',
        'node-pty/scripts/**',
        '@parcel/watcher/binding.gyp',
        '@parcel/watcher/build/**',
        '@parcel/watcher/prebuilds/**',
        '@parcel/watcher/src/**',
        'nsfw/binding.gyp',
        'nsfw/build/**',
        'nsfw/includes/**',
        'nsfw/src/**',
        'keytar/binding.gyp',
        'keytar/build/**',
        'keytar/src/**',
      ]
    }),
    glob([
      '@vscode/spdlog/build/Release/*.node',
      'node-pty/build/Release/spawn-helper',
      'node-pty/build/Release/*.exe',
      'node-pty/build/Release/*.dll',
      'node-pty/build/Release/*.node',
      '@parcel/watcher/build/Release/*.node',
      'nsfw/build/Release/*.node',
      'keytar/build/Release/*.node',
    ], {
      cwd: srcModules,
      dot: true,
      nodir: true,
    })
  ])
  await fs.rm(destModules, { recursive: true, force: true })

  for (const filename of filenames.flat(Infinity) as string[]) {
    const destPath = path.join(destModules, filename)
    await fs.mkdir(path.dirname(destPath), { recursive: true })
    await fs.copyFile(path.join(srcModules, filename), destPath)
  }
}
