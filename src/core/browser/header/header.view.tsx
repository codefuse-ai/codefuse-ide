import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';

import {
  ComponentRegistry,
  ComponentRenderer,
  Disposable,
  DomListener,
  IWindowService,
  electronEnv,
  getIcon,
  isMacintosh,
  useEventEffect,
  useInjectable,
} from '@opensumi/ide-core-browser';
import { LayoutViewSizeConfig } from '@opensumi/ide-core-browser/lib/layout/constants';
import { IElectronMainUIService } from '@opensumi/ide-core-common/lib/electron';
import { IElectronHeaderService } from '@opensumi/ide-electron-basic/lib/common/header';

import styles from './header.module.less';

const macTrafficWidth = 72;
const winActionWidth = 138;
const menuBarLeftWidth = 286
const menuBarRightWidth = 28
const extraWidth = 150

const useMaximize = () => {
  const uiService: IElectronMainUIService = useInjectable(IElectronMainUIService);

  const [maximized, setMaximized] = useState(false);

  const getMaximized = async () => uiService.isMaximized(electronEnv.currentWindowId);

  useEffect(() => {
    const maximizeListener = uiService.on('maximizeStatusChange', (windowId, isMaximized) => {
      if (windowId === electronEnv.currentWindowId) {
        setMaximized(isMaximized);
      }
    });
    getMaximized().then((maximized) => {
      setMaximized(maximized);
    });
    return () => {
      maximizeListener.dispose();
    };
  }, []);

  return {
    maximized,
    getMaximized,
  };
};

/**
 * autoHide: Hide the HeaderBar when the macOS full screen
 */
export const ElectronHeaderBar = () => {
  const ref = useRef<HTMLDivElement | null>(null)
  const windowService: IWindowService = useInjectable(IWindowService);
  const layoutViewSize = useInjectable<LayoutViewSizeConfig>(LayoutViewSizeConfig);

  const { getMaximized } = useMaximize();

  const safeHeight = useMemo(() => {
    return layoutViewSize.calcElectronHeaderHeight();
  }, [layoutViewSize]);

  useLayoutEffect(() => {
    const currentElement = ref.current
    if (!currentElement) return
    const { parentElement } = currentElement
    if (!parentElement) return
    if (isMacintosh) {
      parentElement.style.paddingLeft = `${macTrafficWidth}px`
      currentElement.style.left = `${macTrafficWidth + menuBarLeftWidth + extraWidth}px`
      currentElement.style.right = `${menuBarRightWidth + extraWidth}px`
    } else {
      parentElement.style.paddingRight = `${winActionWidth}px`
      currentElement.style.left = `${menuBarLeftWidth + extraWidth}px`
      currentElement.style.right = `${menuBarRightWidth + winActionWidth + extraWidth}px`
    }
  }, [])

  return (
    <div
      className={styles.header}
      style={{ height: safeHeight }}
      onDoubleClick={async () => {
        if (await getMaximized()) {
          windowService.unmaximize();
        } else {
          windowService.maximize();
        }
      }}
      ref={ref}
    >
      <HeaderBarTitleComponent />
    </div>
  );
};

export const HeaderBarTitleComponent = () => {
  const headerService = useInjectable(IElectronHeaderService) as IElectronHeaderService;
  const ref = useRef<HTMLDivElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const [appTitle, setAppTitle] = useState<string>('');

  useEffect(() => {
    const defaultAppTitle = 'CodeFuse IDE'
    setAppTitle(headerService.appTitle || defaultAppTitle)
    const disposable = headerService.onTitleChanged((v) => {
      setAppTitle(v || defaultAppTitle);
    })
    return () => {
      disposable.dispose()
    }
  }, [])

  useEffect(() => {
    setPosition();
    const disposer = new Disposable();

    disposer.addDispose(
      new DomListener(window, 'resize', () => {
        setPosition();
      }),
    );
  }, []);

  function setPosition() {
    window.requestAnimationFrame(() => {
      if (ref.current && spanRef.current) {
        const windowWidth = window.innerWidth;
        const leftWidth = menuBarLeftWidth + extraWidth + (isMacintosh ? macTrafficWidth : 0)
        const left = Math.max(0, windowWidth * 0.5 - leftWidth - spanRef.current.offsetWidth * 0.5);
        ref.current.style.paddingLeft = left + 'px';
        ref.current.style.visibility = 'visible';
      }
    });
  }

  // 同时更新 document Title
  useEffect(() => {
    document.title = appTitle;
  }, [appTitle]);

  return (
    <div className={styles.title_info} ref={ref} style={{ visibility: 'hidden' }}>
      <span ref={spanRef}>{appTitle}</span>
    </div>
  );
};
