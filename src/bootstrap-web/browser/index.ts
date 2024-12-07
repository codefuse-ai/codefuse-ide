import '@opensumi/ide-i18n/lib/browser';
import {ExpressFileServerModule} from '@opensumi/ide-express-file-server/lib/browser';
import '@opensumi/ide-core-browser/lib/style/index.less';
import '@opensumi/ide-core-browser/lib/style/icon.less';

import {renderApp} from './render-app';
import {CommonBrowserModules} from '@/bootstrap-web/browser/common-modules';
import {layoutConfig} from './layout-config';
import './main.less';
import './styles.less';
import {AILayout} from "@opensumi/ide-ai-native/lib/browser/layout/ai-layout";
import {DEFAULT_LAYOUT_VIEW_SIZE} from "@opensumi/ide-core-browser/lib/layout/constants";
import {AINativeSettingSectionsId} from "@opensumi/ide-core-common";
import logo from '@/core/browser/assets/logo.svg'


renderApp({
  modules: [
    ...CommonBrowserModules,
    ExpressFileServerModule,
  ],
  layoutConfig,
  layoutComponent: AILayout,
  layoutViewSize: {
    bigSurTitleBarHeight: DEFAULT_LAYOUT_VIEW_SIZE.menubarHeight,
  },
  useCdnIcon: false,
  useExperimentalShadowDom: false,
  defaultPreferences: {
    'settings.userBeforeWorkspace': true,
    'general.icon': 'vs-seti',
    [AINativeSettingSectionsId.IntelligentCompletionsPromptEngineeringEnabled]: false,
    // 总是显示智能提示
    [AINativeSettingSectionsId.IntelligentCompletionsAlwaysVisible]: true,
  },
  AINativeConfig: {
    layout: {
      menubarLogo: logo,
    }
  }
});
