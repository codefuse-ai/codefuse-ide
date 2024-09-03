import { nativeTheme } from 'electron';
import { Injectable, Autowired } from '@opensumi/di';
import { Domain, isWindows } from '@opensumi/ide-core-common';
import {
  ElectronMainApiRegistry,
  ElectronMainContribution,
  ElectronMainApiProvider,
} from '@opensumi/ide-core-electron-main/lib/bootstrap/types';
import { IElectronMainApp } from '@opensumi/ide-core-electron-main'
import { Color } from '@opensumi/ide-theme/lib/common/color';

import { StorageService } from './storage.service'
import { IThemeService, ThemeData, ThemeType } from '../common/types';
import { StorageKey } from '../common';

@Injectable()
export class ThemeService extends ElectronMainApiProvider implements IThemeService {
  @Autowired(StorageService)
  storageService: StorageService

  @Autowired(IElectronMainApp)
  electronMainApp: IElectronMainApp

	setTheme(windowId: number, themeData: ThemeData): void {
    this.storageService.setItem(StorageKey.THEME_BG_COLOR, themeData)
    this.updateSystemColorTheme(themeData.themeType);
    if (themeData.menuBarBackground && isWindows) {
      const currentWindow = this.electronMainApp.getCodeWindows().find(codeWindow => codeWindow.getBrowserWindow().id === windowId)
      if (currentWindow) {
        currentWindow.getBrowserWindow().setTitleBarOverlay(this.getTitleBarOverlay(themeData.menuBarBackground!))
      }
    }
  }

  getTitleBarOverlay(color: string) {
    return {
      height: 35,
      color,
      symbolColor: Color.fromHex(color).isDarker() ? '#FFFFFF' : '#000000',
    }
  }

  get themeBackgroundColor() {
    return this.storageService.getItem<ThemeData>(StorageKey.THEME_BG_COLOR, {})
  }

  setSystemTheme() {
    const theme = this.storageService.getItem<ThemeData>(StorageKey.THEME_BG_COLOR)
    this.updateSystemColorTheme(theme?.themeType || 'dark');
  }

  private updateSystemColorTheme(themeType?: ThemeType) {
    switch (themeType) {
      case 'light': nativeTheme.themeSource = 'light'; break;
      case 'dark': nativeTheme.themeSource = 'dark'; break;
      default: nativeTheme.themeSource = 'system';
    }
  }
}

@Domain(ElectronMainContribution)
export class ThemeContribution implements ElectronMainContribution {
  @Autowired(ThemeService)
  themeService: ThemeService;

  registerMainApi(registry: ElectronMainApiRegistry) {
    registry.registerMainApi(IThemeService, this.themeService);
  }
}
