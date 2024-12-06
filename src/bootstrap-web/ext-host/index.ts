import '../common'

import '@/core/common/asar'
import { extProcessInit } from '@opensumi/ide-extension/lib/hosted/ext.process-base.js';
import { Injector } from '@opensumi/di';
import { LogServiceManager } from '@/logger/node/log-manager';
import { LogServiceManager as LogServiceManagerToken } from '@opensumi/ide-logs/lib/node/log-manager';

const injector = new Injector()
injector.addProviders(
  {
    token: LogServiceManagerToken,
    useClass: LogServiceManager
  },
)

extProcessInit({
  injector,
})
