export const nativeDeps = [
  '@parcel/watcher',
  '@vscode/spdlog',
  'node-pty',
  'nsfw',
  'spdlog',
  'keytar',
]

export const postInstallDeps = [
  '@opensumi/vscode-ripgrep',
]

export const asarDeps = [
  ...nativeDeps,
  ...postInstallDeps,
  'vscode-oniguruma',
  '@opensumi/tree-sitter-wasm'
]
