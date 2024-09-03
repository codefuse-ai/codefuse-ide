import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import yauzl, { Entry, ZipFile, Options } from 'yauzl';
import os from 'os';
import { pipeline } from 'stream/promises'
import { ReadableStream } from 'stream/web'
import { randomUUID } from 'crypto';
import { promisify } from 'util';
import debug from 'debug'
import { extensions } from './extensions.json'

const d = debug('download-extension')

const extensionsDir = path.resolve('extensions');

const parallelRunPromise = (lazyPromises: (() => Promise<void>)[], n: number) => {
  let working = 0;
  let complete = 0;
  let all = lazyPromises.length;

  return new Promise<void>((resolve, reject) => {
    const addWorking = () => {
      while (working < n) {
        const current = lazyPromises.shift();
        if (!current) break
  
        working++;

        current()
          .then(() => {
            working--;
            complete++;
    
            if (complete === all) {
              resolve()
              return;
            }
            addWorking()
          })
          .catch(err => reject(err))
      }
    };
    addWorking()
  })
};

async function downloadExtension(url: string, extensionId: string) {
  const tmpPath = path.join(os.tmpdir(), 'extension', randomUUID());
  const tmpZipFile = path.join(tmpPath, extensionId);
  await fsp.mkdir(tmpPath, { recursive: true })

  const res = await fetch(url, {
    method: 'GET',
    signal: AbortSignal.timeout(100000),
  })

  if (!res.ok) {
    throw new Error(`request extension failed: ${res.statusText}`)
  }
  if (!res.body) {
    throw new Error(`request extension failed, body is null`)
  }

  await pipeline(res.body as ReadableStream, fs.createWriteStream(tmpZipFile))

  return tmpZipFile;
}

function modeFromEntry(entry: Entry) {
  const attr = entry.externalFileAttributes >> 16 || 33188;

  return [448 /* S_IRWXU */, 56 /* S_IRWXG */, 7 /* S_IRWXO */]
    .map((mask) => attr & mask)
    .reduce((a, b) => a + b, attr & 61440 /* S_IFMT */);
}

async function unzipFile(tmpZipFile: string, dist: string, extensionId: string) {
  const extensionDir = path.join(dist, extensionId);
  await fsp.mkdir(extensionDir, { recursive: true });

  const zipFile = await promisify<string, Options, ZipFile>(yauzl.open)(tmpZipFile, { lazyEntries: true });
  let canceled = false;

  return new Promise((resolve, reject) => {
    zipFile.readEntry();

    zipFile.on('error', (e) => {
      canceled = true;
      reject(e);
    });

    zipFile.on('close', () => {
      if (!fs.existsSync(path.join(extensionDir, 'package.json'))) {
        reject(`Download Error: ${extensionDir}/package.json`);
        return;
      }
      fsp.rm(tmpZipFile)
      resolve(extensionDir)
    });

    const extensionPrefix = 'extension/'
    zipFile.on('entry', async (entry: Entry) => {
      if (canceled) {
        return;
      }
      if (!entry.fileName.startsWith(extensionPrefix)) {
        zipFile.readEntry();
        return;
      }
      let fileName = entry.fileName.slice(extensionPrefix.length);

      try {
        if (/\/$/.test(fileName)) {
          const targetFileName = path.join(extensionDir, fileName);
          await fsp.mkdir(targetFileName, { recursive: true });
          zipFile.readEntry()
          return;
        }
  
        const dirname = path.dirname(fileName);
        const targetDirName = path.join(extensionDir, dirname);
        if (targetDirName.indexOf(extensionDir) !== 0) {
          throw new Error(`invalid file path ${targetDirName}`)
        }
        await fsp.mkdir(targetDirName, { recursive: true })
        
        const targetFileName = path.join(extensionDir, fileName);
        const readStream = await promisify(zipFile.openReadStream.bind(zipFile))(entry)
        await pipeline(readStream, fs.createWriteStream(targetFileName, { mode: modeFromEntry(entry) }))
        zipFile.readEntry()
      } catch (err) {
        canceled = true
        zipFile.close()
        reject(err)
      }
    });
  });
}

const installExtension = async (extensionId: string, publisher: string, name: string, version?: string) => {
  const extensionPath = `${publisher}/${name}${version ? `/${version}` : ''}`
  const res = await fetch(`https://open-vsx.org/api/${extensionPath}`, {
    signal: AbortSignal.timeout(100000)
  });
  const data = await res.json();
  if (data.files?.download) {
    const tmpZipFile = await downloadExtension(data.files.download, extensionId);
    await unzipFile(tmpZipFile, extensionsDir, extensionId)
  }
};

export const downloadExtensions = async (force = false) => {
  if (force) {
    d('清空 extension 目录：%s', extensionsDir);
    await fsp.rm(extensionsDir, { recursive: true, force: true })
  }
  await fsp.mkdir(extensionsDir, { recursive: true })

  const promises: (() => Promise<void>)[] = [];
  const publishers = Object.keys(extensions);
  for (const publisher of publishers) {
    const items = extensions[publisher];

    for (const item of items) {
      const { name, version } = item;
      promises.push(async () => {
        const extensionId = `${publisher}.${name}`
        if (fs.existsSync(path.join(extensionsDir, extensionId, 'package.json'))) {
          d(`${publisher}.${name} 已存在，跳过`)
          return
        }
        d('开始安装：%s', name, version);
        try {
          await installExtension(extensionId, publisher, name, version);
        } catch (e: any) {
          console.error(`${name} 插件安装失败`);
          throw e;
        }
      });
    }
  }

  await parallelRunPromise(promises, 2);
  d('安装完毕');
};

if (require.main === module) {
  downloadExtensions()
}
