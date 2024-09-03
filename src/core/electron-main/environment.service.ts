import { app } from 'electron'
import * as os from 'node:os'
import * as path from 'node:path'
import { Injectable, Autowired } from '@opensumi/di'
import { memoize } from '@opensumi/ide-core-common'
import { IEnvironmentService, IProduct } from '../common'

@Injectable()
export class EnvironmentService implements IEnvironmentService {
  @Autowired(IProduct)
  product: IProduct

  @memoize
  get isDev() { return process.env.NODE_ENV === 'development' }

  @memoize
  get dataFolderName() { return this.product.dataFolderName }

  @memoize
	get appRoot(): string { return app.getAppPath() }

  @memoize
  get userHome() { return os.homedir() }

  @memoize
	get userDataPath(): string { return app.getPath('userData') }

  @memoize
	get userSettingPath(): string { return path.join(this.userDataPath, 'user') }

  @memoize
	get storagePath(): string { return path.join(this.userSettingPath, 'storage.json') }

  @memoize
  get extensionsPath() {
    return path.join(this.userHome, this.product.dataFolderName, 'extensions')
  }

  @memoize
  get logRoot() {
    return path.join(this.userDataPath, 'logs')
  }

  @memoize
  get logHome() {
    const date = new Date();
    const logName = `${date.getFullYear()}${String((date.getMonth() + 1)).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    return path.join(this.logRoot, logName)
  }
}
