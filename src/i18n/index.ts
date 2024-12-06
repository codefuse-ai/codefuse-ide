import { registerLocalizationBundle } from '@opensumi/ide-core-common/lib/localize';

import { localizationBundle as en } from './en-US';
import { localizationBundle as zh } from './zh-CN';

// 先初始化语言包
registerLocalizationBundle(zh);
registerLocalizationBundle(en);
