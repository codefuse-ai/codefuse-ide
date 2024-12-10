import { SlotLocation } from '@opensumi/ide-core-browser/lib/react-providers/slot';
import { defaultConfig } from '@opensumi/ide-main-layout/lib/browser/default-config';
import { DESIGN_MENUBAR_CONTAINER_VIEW_ID } from '@opensumi/ide-design/lib/common/constants';
import {DESIGN_MENU_BAR_LEFT} from "@opensumi/ide-design";
import {AI_MENU_BAR_LEFT_ACTION} from "@/ai/browser";

export const layoutConfig = {
  ...defaultConfig,
  [SlotLocation.top]: {
    modules: [DESIGN_MENUBAR_CONTAINER_VIEW_ID],
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

  [DESIGN_MENU_BAR_LEFT]: {
    modules: [AI_MENU_BAR_LEFT_ACTION]
  }
};
