FROM node:20 AS builder

ENV WORKSPACE_DIR=/workspace
ENV EXTENSION_DIR=/extensions
ENV NODE_ENV=production
ENV WS_PATH=ws://localhost:8000

RUN mkdir -p ${WORKSPACE_DIR}  &&\
    mkdir -p ${EXTENSION_DIR}

RUN apt-get update && apt-get install -y libsecret-1-dev

RUN npm config set registry https://registry.npmmirror.com

# 设置工作目录
WORKDIR /build

COPY . /build

# 清理全局安装的包并安装 yarn
RUN npm cache clean --force && \
    rm -rf /usr/local/lib/node_modules/yarn* && \
    rm -rf /usr/local/bin/yarn* && \
    npm install -g yarn

# 配置yarn为国内源
RUN yarn config set npmRegistryServer https://registry.npmmirror.com

# 安装依赖$构建项目
RUN yarn install && \
    yarn run build-web && \
    yarn run web-rebuild

FROM node:20 AS app

ENV WORKSPACE_DIR=/workspace
ENV EXTENSION_DIR=/root/.sumi/extensions

RUN mkdir -p ${WORKSPACE_DIR}  &&\
    mkdir -p ${EXTENSION_DIR} &&\
    mkdir -p /extensions

# 设置工作目录
WORKDIR /release

COPY --from=builder /build/out /release/out
COPY --from=builder /build/node_modules /release/node_modules

EXPOSE 8000

CMD [ "node", "./out/node/index.js"]