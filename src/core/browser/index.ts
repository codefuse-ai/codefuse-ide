import { Injectable } from '@opensumi/di';
import { BrowserModule, createElectronMainApi, IElectronNativeDialogService } from '@opensumi/ide-core-browser';
import { ElectronBasicContribution } from '@opensumi/ide-electron-basic/lib/browser'
import { ElectronNativeDialogService } from '@opensumi/ide-electron-basic/lib/browser/dialog'
import { ElectronPreferenceContribution } from '@opensumi/ide-electron-basic/lib/browser/electron-preference.contribution'
import { ElectronHeaderService } from '@opensumi/ide-electron-basic/lib/browser/header/header.service'
import { IElectronHeaderService } from '@opensumi/ide-electron-basic/lib/common/header'

import { HeaderContribution, ELECTRON_HEADER } from './header/header.contribution'
import { LocalMenuContribution } from './menu.contribution';
import { patchProviders } from './patch'
import { ProjectSwitcherContribution } from './project.contribution';
import { LocalThemeContribution } from './theme.contribution';
import { IStorageService, IAppMenuService, IThemeService } from '../common';
import { WelcomeContribution } from './welcome/welcome.contribution'

export { ELECTRON_HEADER }

@Injectable()
export class CoreBrowserModule extends BrowserModule {
  providers = [
    {
      token: IElectronNativeDialogService,
      useClass: ElectronNativeDialogService,
    },
    {
      token: IElectronHeaderService,
      useClass: ElectronHeaderService,
    },
    ElectronBasicContribution,
    ElectronPreferenceContribution,
    WelcomeContribution,
    HeaderContribution,
    ProjectSwitcherContribution,
    LocalMenuContribution,
    LocalThemeContribution,
    {
      token: IStorageService,
      useValue: createElectronMainApi(IStorageService),
    },
    {
      token: IThemeService,
      useValue: createElectronMainApi(IThemeService),
    },
    {
      token: IAppMenuService,
      useValue: createElectronMainApi(IAppMenuService),
    },
    ...patchProviders,
  ];
}
