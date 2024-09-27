import { BrowserWindowConstructorOptions } from 'electron'
import { isWindows, URI } from '@opensumi/ide-core-common';
import { Injectable, INJECTOR_TOKEN, Autowired, Injector } from '@opensumi/di'
import { IWindowOpenOptions, ElectronAppConfig, IElectronMainApp, ElectronMainApp } from '@opensumi/ide-core-electron-main'
import { IEnvironmentService, StorageKey } from '../../common'
import { ThemeService } from '../theme.service'

@Injectable()
export class WindowsManager {
  @Autowired(INJECTOR_TOKEN)
  injector: Injector

  @Autowired(ElectronAppConfig)
  appConfig: ElectronAppConfig

  @Autowired(IElectronMainApp)
  mainApp: ElectronMainApp

  @Autowired(IEnvironmentService)
  environmentService: IEnvironmentService

  @Autowired(ThemeService)
  themeService: ThemeService;

  openCodeWindow(workspaceUri?: URI, options?: IWindowOpenOptions) {
    if (workspaceUri) {
      for (const codeWindow of this.mainApp.getCodeWindows()) {
        if (codeWindow.workspace?.toString() === workspaceUri.toString()) {
          codeWindow.getBrowserWindow().show()
          return;
        }
      }
    }
    if (options?.windowId) {
      const codeWindow = this.mainApp.getCodeWindowByElectronBrowserWindowId(options.windowId)
      if (codeWindow) {
        if (workspaceUri) {
          codeWindow.setWorkspace(workspaceUri.toString());
        }
        codeWindow.reload();
        return;
      }
    }
    this.createCodeWindow(workspaceUri);
  }

  createCodeWindow(
    workspaceUri?: URI,
    metadata?: any,
    browserWindowOptions?: BrowserWindowConstructorOptions,
  ) {
    this.themeService.setSystemTheme();
    const editorBackground = this.themeService.themeBackgroundColor.editorBackground ||  '#1e1e1e'
    const menuBarBackground = this.themeService.themeBackgroundColor.menuBarBackground || editorBackground;
    
    const codeWindow = this.mainApp.loadWorkspace(
      workspaceUri ? workspaceUri.toString() : undefined,
      {
        ...metadata,
        environment: {
          dataFolderName: this.environmentService.dataFolderName,
          isDev: this.environmentService.isDev,
          logRoot: this.environmentService.logRoot,
        },
      },
      {
        trafficLightPosition: {
          x: 10,
          y: 10,
        },
        ...(isWindows ? {
          titleBarOverlay: this.themeService.getTitleBarOverlay(menuBarBackground)
        } : null),
        show: false,
        backgroundColor: editorBackground,
        ...browserWindowOptions,
        webPreferences: {
          preload: this.appConfig.browserPreload,
          nodeIntegration: this.appConfig.browserNodeIntegrated,
          webviewTag: true,
          contextIsolation: false,
          webSecurity: !this.environmentService.isDev,
        },
      }
    );

    const browserWindow = codeWindow.getBrowserWindow()
    // 默认全屏
    // TODO: 支持窗口状态缓存
    browserWindow.maximize();
    browserWindow.show();
  }
}
