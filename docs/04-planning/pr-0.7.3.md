---
title: "发布 PR：v0.7.3"
version: "0.7.3"
base: main
branch: release/0.7
date: 2026-04-07
---

# 发布 v0.7.3

## 概述

本 PR 将 `release/0.7` 分支合并至 `main`，发布 v0.7.3 补丁版本。本版本为针对 `cd-prod.yaml` OpenAPI 导出步骤的精准修复，解决 Docker `--env-file` 不支持多行值导致容器启动失败的问题。

---

## 变更内容

### 🐛 缺陷修复

#### CI/CD 流水线

- **CD-prod OpenAPI 导出容器启动失败**（`fix(ci)`）— `cd-prod.yaml` 中"Start backend container for OpenAPI export"步骤先通过 `dotenvx decrypt --stdout > /tmp/.env.cd_export` 将解密后的环境变量写入临时文件，再以 `--env-file` 挂载到 Docker 容器。但 `.env.test` 中的 EC 私钥（`-----BEGIN EC PRIVATE KEY-----` 格式）包含换行符，而 Docker `--env-file` 要求每行为单一 `KEY=value` 格式，无法处理多行变量值，导致报错：
  ```
  docker: invalid env file (/tmp/.env.cd_export): variable '-----END EC PRIVATE KEY-----"' contains whitespaces
  ```

  **修复方案**：移除中间解密步骤，直接传入私钥让容器内 dotenvx 解密：
  - 删除 "Decrypt .env.test" 步骤及 `/tmp/.env.cd_export` 临时文件
  - 删除 `--env-file /tmp/.env.cd_export` 参数
  - 新增 `-e DOTENV_PRIVATE_KEY_TEST=` + GitHub Actions secret ref，容器内 dotenvx 自动解密 `.env.test`
  - `NODE_ENV=production` 改为 `NODE_ENV=test`（dotenvx 按 `NODE_ENV` 匹配解密文件；`production` 对应 `DOTENV_PRIVATE_KEY_PRODUCTION`，`test` 对应 `DOTENV_PRIVATE_KEY_TEST`）

---

## 文件变更

```
.github/workflows/
  cd-prod.yaml    ← 移除 "Decrypt .env.test" 步骤
                  ← docker run 改为 -e DOTENV_PRIVATE_KEY_TEST
                  ← NODE_ENV=production → NODE_ENV=test
```

---

## 测试

- `pnpm lint` — 零错误
- `pnpm build` — 编译通过
- 无应用代码变更，无需执行测试套件

## 检查清单

- [x] `pnpm lint` — 零错误
- [x] `pnpm build` — 编译通过
- [x] 无应用代码变更，无需测试
- [x] CHANGELOG 已更新（`CHANGELOG.md`）
- [x] 无功能性变更，无需更新 API 文档
