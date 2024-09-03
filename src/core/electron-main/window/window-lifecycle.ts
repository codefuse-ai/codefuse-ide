import { BrowserWindow } from 'electron';
import { Injector } from '@opensumi/di'
import { IElectronMainApiProvider, ElectronMainApp, IWindowOpenOptions } from '@opensumi/ide-core-electron-main'
import { ExtensionCandidate, URI } from '@opensumi/ide-core-common';
import { WindowsManager } from './windows-manager'

export class WindowLifecycle implements IElectronMainApiProvider<void> {
  eventEmitter: undefined;

  constructor(private app: ElectronMainApp, private injector: Injector) {}

  openWorkspace(workspace: string, openOptions: IWindowOpenOptions) {
    this.injector.get(WindowsManager).openCodeWindow(URI.parse(workspace), openOptions);
  }

  minimizeWindow(windowId: number) {
    const window = BrowserWindow.fromId(windowId);
    if (window) {
      window.minimize();
    }
  }

  fullscreenWindow(windowId: number) {
    const window = BrowserWindow.fromId(windowId);
    if (window) {
      window.setFullScreen(true);
    }
  }
  maximizeWindow(windowId: number) {
    const window = BrowserWindow.fromId(windowId);
    if (window) {
      window.maximize();
    }
  }

  unmaximizeWindow(windowId: number) {
    const window = BrowserWindow.fromId(windowId);
    if (window) {
      window.unmaximize();
    }
  }
  closeWindow(windowId: number) {
    const window = BrowserWindow.fromId(windowId);
    if (window) {
      const codeWindow = this.app.getCodeWindowByElectronBrowserWindowId(windowId);
      if (!codeWindow) {
        window.close();
        return;
      }

      if (codeWindow.isReloading) {
        codeWindow.isReloading = false;

        if (!codeWindow.isRemote) {
          // reload 的情况下不需要等待 startNode 执行完
          // 所以可以同时执行 startNode 和 reload 前端
          codeWindow.startNode();
        }
        window.webContents.reload();
      } else {
        // 正常关闭窗口的情况下，需要回收子进程，耗时可能会比较长
        // 这里先隐藏窗口，体感会更快
        window.hide();
        codeWindow.clear().finally(() => {
          window.close();
        });
      }
    }
  }

  reloadWindow(windowId: number) {
    const codeWindow = this.app.getCodeWindowByElectronBrowserWindowId(windowId);
    if (codeWindow) {
      codeWindow.reload();
    }
  }

  setExtensionDir(extensionDir: string, windowId: number) {
    const window = BrowserWindow.fromId(windowId);
    if (window) {
      const codeWindow = this.app.getCodeWindowByElectronBrowserWindowId(windowId);
      if (codeWindow) {
        codeWindow.setExtensionDir(extensionDir);
      }
    }
  }

  setExtensionCandidate(candidate: ExtensionCandidate[], windowId: number) {
    const window = BrowserWindow.fromId(windowId);
    if (window) {
      const codeWindow = this.app.getCodeWindowByElectronBrowserWindowId(windowId);
      if (codeWindow) {
        codeWindow.setExtensionCandidate(candidate);
      }
    }
  }
}
