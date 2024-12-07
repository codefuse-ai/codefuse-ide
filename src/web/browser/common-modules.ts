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
import { BrowserModule, ClientCommonModule, ConstructorOf } from '@opensumi/ide-core-browser';
import { ThemeModule } from '@opensumi/ide-theme/lib/browser';
import { OpenedEditorModule } from '@opensumi/ide-opened-editor/lib/browser';
import { RemoteOpenerModule } from '@opensumi/ide-remote-opener/lib/browser';
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
import { OpenVsxExtensionManagerModule } from '@opensumi/ide-extension-manager/lib/browser';
import { TerminalNextModule } from '@opensumi/ide-terminal-next/lib/browser';
import { CommentsModule } from '@opensumi/ide-comments/lib/browser';
import { ClientAddonModule } from '@opensumi/ide-addons/lib/browser';
import { TaskModule } from '@opensumi/ide-task/lib/browser';
import { TestingModule } from '@opensumi/ide-testing/lib/browser';
import {CoreBrowserModule} from "@/core/browser";
import {DesignModule} from "@opensumi/ide-design/lib/browser";
import {AINativeModule} from "@opensumi/ide-ai-native/lib/browser";
import {AIFeatureModule} from "@/ai/browser";
import {AutoUpdaterModule} from "@/auto-updater/browser";

export const CommonBrowserModules: ConstructorOf<BrowserModule>[] = [
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
  TestingModule, RemoteOpenerModule,
  // ai
  DesignModule,
  AINativeModule,
  AIFeatureModule,
  AutoUpdaterModule,
];
