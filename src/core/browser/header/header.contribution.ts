import { Domain } from '@opensumi/ide-core-browser';
import { ComponentContribution } from '@opensumi/ide-core-browser/lib/layout';

import { ElectronHeaderBar } from './header.view'
import type { ComponentRegistry } from '@opensumi/ide-core-browser/lib/layout';

export const ELECTRON_HEADER = 'electron_header';
export const WINDOW = 'electron_header';

@Domain(ComponentContribution)
export class HeaderContribution implements ComponentContribution {
  registerComponent(registry: ComponentRegistry): void {
    registry.register(
      ELECTRON_HEADER,
      {
        id: ELECTRON_HEADER,
        component: ElectronHeaderBar,
      },
    );
  }
}
