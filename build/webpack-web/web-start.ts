import { exec } from 'child_process';
import path from 'path';

// 定义每个命令的启动函数
const commands = {
    client: 'cross-env NODE_ENV=development WEBPACK_LOG_LEVEL=info webpack-dev-server --client-logging info --config ./build/webpack-web/webpack.browser.config.ts --progress --color',
    webview: 'cross-env NODE_ENV=development webpack-dev-server --config ./build/webpack-web/webpack.webview.config.ts --progress --color',
    server: 'cross-env NODE_ENV=development node -r ts-node/register -r tsconfig-paths/register src/bootstrap-web/node/index.ts'
};

// 启动子进程并打印输出
function startProcess(command: string, name: string) {
    const child = exec(command, {cwd: path.resolve(__dirname, '../../')}, (error, stdout, stderr) => {
        if (error) {
            console.error(`[${name}] Error: ${error.message}`);
            return;
        }

        if (stderr) {
            console.error(`[${name}] stderr: ${stderr}`);
            return;
        }

        console.log(`[${name}] stdout: ${stdout}`);
    });

    child.stdout?.on('data', (data) => {
        console.log(`[${name}] ${data.toString()}`);
    });

    child.stderr?.on('data', (data) => {
        console.error(`[${name}] ${data.toString()}`);
    });
}

// 启动所有进程
function startAll() {
    Object.entries(commands).forEach(([name, command]) => {
        startProcess(command, name);
    });
}

startAll();