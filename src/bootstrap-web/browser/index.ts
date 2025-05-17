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
import { useInjectable } from '@opensumi/ide-core-browser';
import { EditorModule, IEditorService } from './editor.module';
import { SimpleModule } from './simple.module';
import { CustomClipboardModule } from './custom-clipboard.module';

// 添加消息监听器
window.addEventListener('message', async (event) => {
  // 确保消息来自父窗口
  if (event.origin !== window.location.origin) return;

  const message = event.data;
  
  // 处理来自父窗口的消息
  switch (message.type) {
    case 'updateContent':
      try {
        const editorService = useInjectable<IEditorService>(IEditorService);
        await editorService.updateContent(message.data);
        // 发送成功消息回父窗口
        window.parent.postMessage({
          type: 'contentUpdated',
          success: true
        }, window.location.origin);
      } catch (error: any) {
        console.error('Failed to update editor content:', error);
        // 发送错误消息回父窗口
        window.parent.postMessage({
          type: 'contentUpdated',
          success: false,
          error: error.message
        }, window.location.origin);
      }
      break;
    case 'getContent':
      try {
        const editorService = useInjectable<IEditorService>(IEditorService);
        const content = editorService.getContent();
        if (content !== undefined) {
          // 发送内容回父窗口
          window.parent.postMessage({
            type: 'editorContent',
            data: content,
            success: true
          }, window.location.origin);
        } else {
          // 发送错误消息回父窗口
          window.parent.postMessage({
            type: 'editorContent',
            success: false,
            error: 'No content available'
          }, window.location.origin);
        }
      } catch (error: any) {
        console.error('Failed to get editor content:', error);
        // 发送错误消息回父窗口
        window.parent.postMessage({
          type: 'editorContent',
          success: false,
          error: error.message
        }, window.location.origin);
      }
      break;
  }
});

// 添加键盘事件监听器来测试服务
document.addEventListener('keydown', async (event) => {
  // 按 Ctrl/Cmd + Shift + T 测试服务
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'T') {
    try {
      const editorService = useInjectable<IEditorService>(IEditorService);
      // 测试获取内容
      const content = editorService.getContent();
      console.log('Test getContent:', content);
      
      // 测试更新内容
      await editorService.updateContent('Test content ' + new Date().toISOString());
      console.log('Test updateContent completed');
    } catch (error) {
      console.error('Test failed:', error);
    }
  }
});

renderApp({
  modules: [
    ...CommonBrowserModules,
    ExpressFileServerModule,
    EditorModule, // 注册编辑器服务模块
    SimpleModule, // 注册简单模块
    CustomClipboardModule,
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
