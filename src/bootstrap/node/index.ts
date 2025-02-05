
import '@/core/common/asar'
import * as net from 'node:net';
import path from 'node:path';
import mri from 'mri'
import { IServerAppOpts, ServerApp, ConstructorOf, NodeModule } from '@opensumi/ide-core-node';
import { ServerCommonModule } from '@opensumi/ide-core-node';
import { FileServiceModule } from '@opensumi/ide-file-service/lib/node';
import { ProcessModule } from '@opensumi/ide-process/lib/node';
import { FileSearchModule } from '@opensumi/ide-file-search/lib/node';
import { SearchModule } from '@opensumi/ide-search/lib/node';
import { TerminalNodePtyModule } from '@opensumi/ide-terminal-next/lib/node';
import { terminalPreferenceSchema } from '@opensumi/ide-terminal-next/lib/common/preference'
import { LogServiceModule } from '@opensumi/ide-logs/lib/node';
import { ExtensionModule } from '@opensumi/ide-extension/lib/node';
import { FileSchemeNodeModule } from '@opensumi/ide-file-scheme/lib/node';
import { AddonsModule } from '@opensumi/ide-addons/lib/node';
import { OpenVsxExtensionManagerModule } from '@opensumi/ide-extension-manager/lib/node';
import { AINativeModule } from '@opensumi/ide-ai-native/lib/node';
import { CoreNodeModule } from '@/core/node';
import { LoggerModule } from '@/logger/node'
import { AIServiceModule } from '@/ai/node';

const modules: ConstructorOf<NodeModule>[] = [
  ServerCommonModule,
  LogServiceModule,
  FileServiceModule,
  ProcessModule,
  FileSearchModule,
  SearchModule,
  TerminalNodePtyModule,
  ExtensionModule,
  OpenVsxExtensionManagerModule,
  FileSchemeNodeModule,
  AddonsModule,
  CoreNodeModule,
  LoggerModule,
  // ai
  AINativeModule,
  AIServiceModule,
]

startServer();

async function startServer() {
  const opts: IServerAppOpts = {
    modules,
    webSocketHandler: [],
    marketplace: {
      showBuiltinExtensions: true,
      extensionDir: process.env.IDE_EXTENSIONS_PATH!,
    },
    watcherHost: path.join(__dirname, '../watcher-host/index'),
  };

  const server = net.createServer();
  const serverApp = new ServerApp(opts);
  await serverApp.start(server);

  server.on('error', () => {
    setTimeout(() => {
      process.exit(1);
    });
  });

  const listenPath = mri(process.argv).listenPath;
  server.listen(listenPath, () => {
    process.send?.('ready');
  });
}
