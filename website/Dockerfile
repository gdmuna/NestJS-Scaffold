# ===== 阶段1：构建 VitePress 文档站 =====
FROM node:22.22-slim AS builder
RUN apt-get update && apt-get install -y git --no-install-recommends && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm

WORKDIR /app

# 安装 workspace 级别依赖（利用 layer cache）
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY website/package.json ./website/

RUN echo 'shamefully-hoist=true' >> .npmrc && pnpm install --frozen-lockfile --ignore-scripts

# 复制文档内容和构建脚本
COPY tsconfig.json ./
COPY src ./src
COPY docs ./docs
COPY scripts ./scripts
COPY website ./website

# 生成错误码参考文档 + 构建 VitePress
RUN pnpm docs:build

# ===== 阶段2：运行 nginx =====
FROM nginx:alpine AS runner

# VitePress 产物（含 reference/index.html）
COPY --from=builder /app/website/dist /usr/share/nginx/html

# Scalar API Reference 页（VitePress 不复制 public/ 中的 index.html，需显式 COPY）
COPY --from=builder /app/website/public/reference/index.html /usr/share/nginx/html/reference/index.html

# openapi.json（本地构建前先运行 pnpm docs:gen-openapi；CI 通过 --build-arg 覆盖路径）
ARG OPENAPI_JSON_PATH=website/public/reference/openapi.json
COPY ${OPENAPI_JSON_PATH} /usr/share/nginx/html/reference/openapi.json

# nginx 配置
COPY website/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
    CMD wget -qO- http://127.0.0.1/ || exit 1
