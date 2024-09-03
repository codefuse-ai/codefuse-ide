import type { ThemeType } from '@opensumi/ide-theme';

export { ThemeType }

export interface ThemeData {
  menuBarBackground?: string;
  sideBarBackground?: string;
  editorBackground?: string;
  panelBackground?: string;
  statusBarBackground?: string;
}

export const IStorageService = 'IStorageService';

export type IStorageData = object | string | number | boolean | undefined | null;
export interface IStorageService {
  getItem<T>(key: string, defaultValue: T): T;
	getItem<T>(key: string, defaultValue?: T): T | undefined;
  setItem(key: string, data?: IStorageData): void;
	setItems(items: readonly { key: string; data?: IStorageData }[]): void;
	removeItem(key: string): void;
	close(): Promise<void>;
}

export const IThemeService = 'IThemeService';

export interface ThemeData {
  menuBarBackground?: string;
  sideBarBackground?: string;
  editorBackground?: string;
  panelBackground?: string;
  statusBarBackground?: string;
  themeType?: ThemeType;
}

export interface IThemeService {
  setTheme(windowId: number, themeData: ThemeData): void;
}

export const IAppMenuService = 'IAppMenuService';

export interface IAppMenuService {
  renderRecentWorkspaces(workspaces: string[]): Promise<void>;
}

export const IProduct = Symbol('IProduct');
export interface IProduct {
  productName: string;
  applicationName: string;
  autoUpdaterConfigUrl: string;
  dataFolderName: string;
  commit: string,
  date: string,
}

export const IEnvironmentService = Symbol('IEnvironmentService');
export interface IEnvironmentService {
  isDev: boolean;
  dataFolderName: string;
  appRoot: string;
  userHome: string;
  userDataPath: string;
  userSettingPath: string;
  storagePath: string;
  extensionsPath: string;
  logRoot: string;
  logHome: string;
}
