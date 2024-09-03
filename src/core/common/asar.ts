import path from 'node:path'
import module from 'node:module'

function enableASARSupport() {
  const NODE_MODULES_PATH = path.join(__dirname, '../../node_modules');
  const NODE_MODULES_ASAR_PATH = `${NODE_MODULES_PATH}.asar`;

  const Module = module.Module as any;
  const originalResolveLookupPaths = Module._resolveLookupPaths;
  Module._resolveLookupPaths = function (request: any, parent: any) {
    const paths = originalResolveLookupPaths(request, parent);
    if (Array.isArray(paths)) {
      for (let i = 0, len = paths.length; i < len; i++) {
        if (paths[i] === NODE_MODULES_PATH) {
          paths.splice(i, 0, NODE_MODULES_ASAR_PATH);
          break;
        }
      }
    }
    return paths;
  };
}

enableASARSupport()
