import * as path from 'path';
import * as http from 'http';
import Koa from 'koa';
import koaStatic from 'koa-static';
import { Deferred } from '@opensumi/ide-core-common';
import { IServerAppOpts, ServerApp, NodeModule } from '@opensumi/ide-core-node';

export async function startServer(arg1: NodeModule[] | Partial<IServerAppOpts>) {
  const app = new Koa();
  const deferred = new Deferred<http.Server>();
  process.env.EXT_MODE = 'js';
  const port = process.env.IDE_SERVER_PORT || 8000;
  const workspaceDir = process.env.WORKSPACE_DIR || process.env.NODE_ENV === 'production' ? path.join(__dirname, '../../workspace') : path.join(__dirname, '../../../workspace');
  const extensionDir = process.env.EXTENSION_DIR || process.env.NODE_ENV === 'production' ? path.join(__dirname, '../../extensions') : path.join(__dirname, '../../../extensions');
  const extensionHost = process.env.EXTENSION_HOST_ENTRY || 
  process.env.NODE_ENV === 'production' ? path.join(__dirname, '..', '..', 'out/ext-host/index.js') : path.join(__dirname, '..', '..', '..', 'out/ext-host/index.js');

  let opts: IServerAppOpts = {
    use: app.use.bind(app),
    processCloseExitThreshold: 5 * 60 * 1000,
    terminalPtyCloseThreshold: 5 * 60 * 1000,
    staticAllowOrigin: '*',
    staticAllowPath: [
      workspaceDir,
      extensionDir,
      '/',
    ],
    extHost: extensionHost,
  };

  opts.marketplace = {
    showBuiltinExtensions: true,
  }
  
  if (Array.isArray(arg1)) {
    opts = {
      ...opts,
       modulesInstances: arg1,
      };
  } else {
    opts = {
      ...opts,
      ...arg1,
    };
  }

  const serverApp = new ServerApp(opts);
  const server = http.createServer(app.callback());

  if (process.env.NODE_ENV === 'production') {
    app.use(koaStatic(path.join(__dirname, '../../out')));
  }

  await serverApp.start(server);

  server.on('error', (err) => {
    deferred.reject(err);
    console.error('Server error: ' + err.message);
    setTimeout(process.exit, 0, 1);
  });

  server.listen(port, () => {
    console.log(`Server listen on port ${port}`);
    deferred.resolve(server);
  });
  return deferred.promise;
}
