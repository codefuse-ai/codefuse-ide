import { registerLocalizationBundle } from '@opensumi/ide-core-common/lib/localize';
import { localizationBundle as zh } from './zh-CN';
import { localizationBundle as en } from './en-US';

// 先初始化语言包
registerLocalizationBundle(zh);
registerLocalizationBundle(en);
