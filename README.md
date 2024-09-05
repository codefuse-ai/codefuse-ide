<h1 align="center">CodeFuse IDE</h1>

<p align="center">AI Native IDE based on CodeFuse and OpenSumi.</p>

![图片 1](https://github.com/user-attachments/assets/9b55b1a9-dd98-4f9e-a948-2f12dcaa67cf)

[![Discussions][discussions-image]][discussions-url] [![Open in CodeBlitz][codeblitz-image]][codeblitz-url]

[discussions-image]: https://img.shields.io/badge/discussions-on%20github-blue
[discussions-url]: https://github.com/codefuse-ai/codefuse-ide/discussions
[codeblitz-image]: https://img.shields.io/badge/Ant_Codespaces-Open_in_CodeBlitz-1677ff
[codeblitz-url]: https://codeblitz.cloud.alipay.com/github/codefuse-ai/codefuse-ide
[github-issues-url]: https://github.com/opensumi/core/issues
[help-wanted-image]: https://flat.badgen.net/github/label-issues/codefuse-ai/codefuse-ide/🤔%20help%20wanted/open
[help-wanted-url]: https://github.com/codefuse-ai/codefuse-ide/issues?q=is%3Aopen+is%3Aissue+label%3A%22🤔+help+wanted%22

## ✨ Features
- **AI-Native Development Environment**: Enjoy an integrated development environment that leverages AI technologies to enhance productivity and streamline workflows.
- **Open Model Integration**: Our platform supports the seamless integration of various models, allowing developers to customize and extend functionality according to their needs.
- **VS Code Extension Compatibility**: Benefit from a rich ecosystem of plugins by ensuring compatibility with VS Code extensions, enabling you to leverage existing tools and resources.


## Getting started

### Preparation
- install Node.js >= 20
- you can use npmmirror.com to speed up the installation in china
  - `yarn config set -H npmRegistryServer "https://registry.npmmirror.com"`
  - `export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`

### Start the project
```bash
# install dependencies
yarn
# rebuild native dependencies for electron
yarn run electron-rebuild
# start project
yarn run start
```

## Links

- **CodeFuse**: https://codefuse.ai
- **OpenSumi**: https://opensumi.com
