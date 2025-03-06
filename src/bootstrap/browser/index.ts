import '@opensumi/ide-i18n';
import '@/i18n';
import '@opensumi/ide-core-browser/lib/style/index.less';
import '@opensumi/ide-core-browser/lib/style/icon.less';
import './index.less'

import { DEFAULT_LAYOUT_VIEW_SIZE } from '@opensumi/ide-core-browser/lib/layout/constants';
import { AINativeSettingSectionsId } from '@opensumi/ide-core-common'
import { IElectronMainLifeCycleService } from '@opensumi/ide-core-common/lib/electron';
import { IClientAppOpts, electronEnv, URI, ClientCommonModule, BrowserModule, ConstructorOf, LayoutConfig, SlotLocation } from '@opensumi/ide-core-browser';
import { ClientApp } from '@opensumi/ide-core-browser/lib/bootstrap/app';
import { MainLayoutModule } from '@opensumi/ide-main-layout/lib/browser';
import { MenuBarModule } from '@opensumi/ide-menu-bar/lib/browser';
import { MonacoModule } from '@opensumi/ide-monaco/lib/browser';
import { WorkspaceModule } from '@opensumi/ide-workspace/lib/browser';
import { StatusBarModule } from '@opensumi/ide-status-bar/lib/browser';
import { EditorModule } from '@opensumi/ide-editor/lib/browser';
import { ExplorerModule } from '@opensumi/ide-explorer/lib/browser';
import { FileTreeNextModule } from '@opensumi/ide-file-tree-next/lib/browser';
import { FileServiceClientModule } from '@opensumi/ide-file-service/lib/browser';
import { SearchModule } from '@opensumi/ide-search/lib/browser';
import { FileSchemeModule } from '@opensumi/ide-file-scheme/lib/browser';
import { OutputModule } from '@opensumi/ide-output/lib/browser';
import { QuickOpenModule } from '@opensumi/ide-quick-open/lib/browser';
import { ThemeModule } from '@opensumi/ide-theme/lib/browser';
import { OpenedEditorModule } from '@opensumi/ide-opened-editor/lib/browser';
import { OutlineModule } from '@opensumi/ide-outline/lib/browser';
import { PreferencesModule } from '@opensumi/ide-preferences/lib/browser';
import { ToolbarModule } from '@opensumi/ide-toolbar/lib/browser';
import { OverlayModule } from '@opensumi/ide-overlay/lib/browser';
import { ExtensionStorageModule } from '@opensumi/ide-extension-storage/lib/browser';
import { StorageModule } from '@opensumi/ide-storage/lib/browser';
import { SCMModule } from '@opensumi/ide-scm/lib/browser';
import { MarkersModule } from '@opensumi/ide-markers/lib/browser';
import { WebviewModule } from '@opensumi/ide-webview';
import { MarkdownModule } from '@opensumi/ide-markdown';
import { LogModule } from '@opensumi/ide-logs/lib/browser';
import { WorkspaceEditModule } from '@opensumi/ide-workspace-edit/lib/browser';
import { ExtensionModule } from '@opensumi/ide-extension/lib/browser';
import { DecorationModule } from '@opensumi/ide-decoration/lib/browser';
import { DebugModule } from '@opensumi/ide-debug/lib/browser';
import { VariableModule } from '@opensumi/ide-variable/lib/browser';
import { KeymapsModule } from '@opensumi/ide-keymaps/lib/browser';
import { MonacoEnhanceModule } from '@opensumi/ide-monaco-enhance/lib/browser/module';
import { TerminalNextModule } from '@opensumi/ide-terminal-next/lib/browser';
import { terminalPreferenceSchema } from '@opensumi/ide-terminal-next/lib/common/preference'
import { CommentsModule } from '@opensumi/ide-comments/lib/browser';
import { ClientAddonModule } from '@opensumi/ide-addons/lib/browser';
import { TaskModule } from '@opensumi/ide-task/lib/browser';
import { OpenVsxExtensionManagerModule } from '@opensumi/ide-extension-manager/lib/browser';
import { DesignModule } from '@opensumi/ide-design/lib/browser';
import { DESIGN_MENUBAR_CONTAINER_VIEW_ID } from '@opensumi/ide-design/lib/common/constants';
import { AILayout } from '@opensumi/ide-ai-native/lib/browser/layout/ai-layout';
import { AINativeModule } from "@opensumi/ide-ai-native/lib/browser";
import { DESIGN_MENU_BAR_LEFT } from '@opensumi/ide-design';
import { CoreBrowserModule, ELECTRON_HEADER } from '@/core/browser';
import { AIFeatureModule, AI_MENU_BAR_LEFT_ACTION } from '@/ai/browser';
import { AutoUpdaterModule } from '@/auto-updater/browser'
import logo from '@/core/browser/assets/logo.svg'
import { DefaultSystemPrompt } from '@/ai/browser/prompt';

// 临时修复 bash 打开 -l 参数不支持导致报错的问题
terminalPreferenceSchema.properties['terminal.integrated.shellArgs.osx'].default = [];

const modules: ConstructorOf<BrowserModule>[] = [
  MainLayoutModule,
  OverlayModule,
  LogModule,
  ClientCommonModule,
  MenuBarModule,
  MonacoModule,
  StatusBarModule,
  EditorModule,
  ExplorerModule,
  FileTreeNextModule,
  FileServiceClientModule,
  SearchModule,
  FileSchemeModule,
  OutputModule,
  QuickOpenModule,
  MarkersModule,
  ThemeModule,
  WorkspaceModule,
  ExtensionStorageModule,
  StorageModule,
  OpenedEditorModule,
  OutlineModule,
  PreferencesModule,
  ToolbarModule,
  WebviewModule,
  MarkdownModule,
  WorkspaceEditModule,
  SCMModule,
  DecorationModule,
  DebugModule,
  VariableModule,
  KeymapsModule,
  TerminalNextModule,
  ExtensionModule,
  OpenVsxExtensionManagerModule,
  MonacoEnhanceModule,
  ClientAddonModule,
  CommentsModule,
  TaskModule,
  CoreBrowserModule,
  // ai
  DesignModule,
  AINativeModule,
  AIFeatureModule,
  AutoUpdaterModule,
];

const layoutConfig: LayoutConfig = {
  [SlotLocation.top]: {
    modules: [ELECTRON_HEADER, DESIGN_MENUBAR_CONTAINER_VIEW_ID],
  },
  [SlotLocation.left]: {
    modules: [
      '@opensumi/ide-explorer',
      '@opensumi/ide-search',
      '@opensumi/ide-scm',
      '@opensumi/ide-extension-manager',
      '@opensumi/ide-debug',
    ],
  },
  [SlotLocation.right]: {
    modules: [],
  },
  [SlotLocation.main]: {
    modules: ['@opensumi/ide-editor'],
  },
  [SlotLocation.bottom]: {
    modules: [
      '@opensumi/ide-terminal-next',
      '@opensumi/ide-output',
      'debug-console',
      '@opensumi/ide-markers',
      '@opensumi/ide-refactor-preview',
    ],
  },
  [SlotLocation.statusBar]: {
    modules: ['@opensumi/ide-status-bar'],
  },
  [SlotLocation.action]: {
    modules: ['@opensumi/ide-toolbar-action'],
  },
  [SlotLocation.extra]: {
    modules: ['breadcrumb-menu'],
  },
  [DESIGN_MENU_BAR_LEFT]: {
    modules: [AI_MENU_BAR_LEFT_ACTION]
  }
};


renderApp();

async function renderApp() {
  const opts: IClientAppOpts = {
    appName: 'CodeFuse IDE',
    modules,
    layoutConfig,
    layoutComponent: AILayout,
    layoutViewSize: {
      bigSurTitleBarHeight: DEFAULT_LAYOUT_VIEW_SIZE.menubarHeight,
    },
    workspaceDir: electronEnv.env.WORKSPACE_DIR,
    extensionDir: electronEnv.metadata.extensionDir,
    preferenceDirName: electronEnv.metadata.environment.dataFolderName,
    storageDirName: electronEnv.metadata.environment.dataFolderName,
    extensionStorageDirName: electronEnv.metadata.environment.dataFolderName,
    extWorkerHost: electronEnv.metadata.workerHostEntry ? URI.file(electronEnv.metadata.workerHostEntry).toString() : undefined,
    defaultPreferences: {
      'settings.userBeforeWorkspace': true,
      'general.icon': 'vs-seti',
      [AINativeSettingSectionsId.IntelligentCompletionsPromptEngineeringEnabled]: false,
      // 总是显示智能提示
      [AINativeSettingSectionsId.IntelligentCompletionsAlwaysVisible]: true,
      // 开启 Code Edits
      [AINativeSettingSectionsId.CodeEditsLintErrors]: true,
      [AINativeSettingSectionsId.CodeEditsLineChange]: true,
      [AINativeSettingSectionsId.SystemPrompt]: DefaultSystemPrompt,
    },
    onigWasmUri: URI.file(electronEnv.onigWasmPath).toString(true),
    treeSitterWasmDirectoryUri: URI.file(electronEnv.treeSitterWasmDirectoryPath).toString(true),
    AINativeConfig: {
      layout: {
        menubarLogo: logo,
      },
      capabilities: {
        supportsMCP: true,
        supportsCustomLLMSettings: true,
      }
    },
  }

  const app = new ClientApp(opts);

  app.fireOnReload = () => {
    app.injector.get(IElectronMainLifeCycleService).reloadWindow(electronEnv.currentWindowId);
  };

  app.start(document.getElementById('main')!, 'electron');
}
