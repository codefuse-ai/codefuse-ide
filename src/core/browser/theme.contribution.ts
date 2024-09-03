import { Autowired } from '@opensumi/di';
import { ClientAppContribution } from '@opensumi/ide-core-browser/lib/common';
import { Domain, OnEvent, WithEventBus } from '@opensumi/ide-core-common';
import { ThemeChangedEvent } from '@opensumi/ide-theme/lib/common';
import { IThemeService } from '../common';
import { electronEnv } from '@opensumi/ide-core-browser';

@Domain(ClientAppContribution)
export class LocalThemeContribution extends WithEventBus implements ClientAppContribution {
  @Autowired(IThemeService)
  private readonly themeService: IThemeService;

  initialize() {}

  @OnEvent(ThemeChangedEvent)
  onThemeChanged({ payload: { theme } }: ThemeChangedEvent) {
    this.themeService.setTheme(electronEnv.currentWindowId, {
      themeType: theme.type,
      menuBarBackground: theme.getColor('kt.menubar.background')?.toString(),
      sideBarBackground: theme.getColor('sideBar.background')?.toString(),
      editorBackground: theme.getColor('editor.background')?.toString(),
      panelBackground: theme.getColor('panel.background')?.toString(),
      statusBarBackground: theme.getColor('statusBar.background')?.toString(),
    })
  }
}
