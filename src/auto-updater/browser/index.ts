import { Provider, Injectable } from '@opensumi/di';
import { BrowserModule, createElectronMainApi } from '@opensumi/ide-core-browser';
import { UpdaterContribution } from './update.contribution'
import { IUpdateMainService } from '../common'

@Injectable()
export class AutoUpdaterModule extends BrowserModule {
  providers: Provider[] = [
    UpdaterContribution,
    {
      token: IUpdateMainService,
      useValue: createElectronMainApi(IUpdateMainService)
    }
  ]
}
