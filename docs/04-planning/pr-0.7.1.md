---
title: "发布 PR：v0.7.1"
version: "0.7.1"
base: main
branch: release/0.7
date: 2026-04-06
---

# 发布 v0.7.1

## 概述

本 PR 将 `release/0.7` 分支合并至 `main`，发布 v0.7.1 补丁版本。本版本为纯缺陷修复发布，解决 v0.7.0 上线后在 CI/CD 流水线、分支命名规范与文档构建等方面暴露的多个问题，无功能性变更。

---

## 变更内容

### 🐛 缺陷修复

#### CI/CD 流水线

- **PostgreSQL 健康检查失效**（`fix(ci)`）— `ci-reusable.yaml`、`cd-dev.yaml`、`cd-prod.yaml` 中 `pg_isready` 未指定用户/数据库参数，导致容器尚未就绪时健康检查即已通过，后续步骤连接 PostgreSQL 时报 "Connection refused"
  - `--health-cmd` 从 `pg_isready` 改为 `pg_isready -U ci_test -d nestjs_demo_basic_test`
  - 新增 `--health-start-period 30s`，给 postgres:18 初始化留足缓冲
  - 检查间隔从 10s 收紧至 5s，重试次数从 5 次提升至 10 次
  - 在 test job 中新增显式等待步骤，主机侧确认 `127.0.0.1:5432` 端口可达
  - 全部连接 URL 从 `localhost` 改为 `127.0.0.1`，绕开 IPv6 (`::1`) 优先解析导致的连接失败

- **CI Release 分支匹配模式过窄**（`fix(ci)`）— `ci-release.yaml` 触发器使用 `release-[0-9]*`，无法匹配斜杠分隔的 `release/X.Y` 命名规范，导致 release 分支推送时 CI 未被触发
  - 改为 `release/**`，兼容任意子路径命名

#### 脚本

- **版本前缀提取正则错误**（`fix(scripts)`）— `scripts/validate-release-version.cjs` 中正则使用 `release-X.Y` 格式（连字符），与实际分支名 `release/X.Y`（斜杠）不符，导致版本验证步骤始终抛出异常
  - 正则从 `release-(\d+\.\d+)` 改为 `release\/(\d+\.\d+)`

#### 文档

- **VitePress 构建崩溃**（`fix(docs)`）— `docs/04-planning/pr-0.7.0.md` frontmatter 使用 `head: dev`，与 VitePress 保留字段 `head`（类型必须为数组，用于注入 `<head>` 标签）冲突，导致文档镜像构建时抛出 `head.find is not a function`
  - 将字段重命名为 `branch: dev`

### 🔧 杂项

- **`openapi.json` 移出版本追踪**（`chore`）— 将 `website/public/reference/openapi.json` 从 git 追踪中移除，添加至 `.gitignore`，避免每次导出后产生 6000+ 行无意义 diff

---

## 文件变更

```
.github/workflows/
  ci-reusable.yaml     ← PostgreSQL 健康检查修复（pg_isready 参数 + start-period + wait 步骤）
  cd-dev.yaml          ← PostgreSQL 健康检查修复
  cd-prod.yaml         ← PostgreSQL 健康检查修复
  ci-release.yaml      ← 分支匹配模式改为 release/**
scripts/
  validate-release-version.cjs  ← 版本前缀正则修复（- → /）
docs/04-planning/
  pr-0.7.0.md          ← frontmatter head → branch（修复 VitePress 保留字冲突）
.gitignore             ← 新增 openapi.json 忽略规则
website/public/reference/
  openapi.json         ← 移出追踪
```

---

## 测试

- `pnpm lint` — 零错误
- `pnpm build` — 编译通过
- `pnpm test` — 通过（PostgreSQL 健康检查修复后 CI 可正常建立数据库连接）

## 检查清单

- [x] `pnpm lint` — 零错误
- [x] `pnpm build` — 编译通过
- [x] `pnpm test` — CI 中通过
- [x] CHANGELOG 已更新（`CHANGELOG.md`）
- [x] 无功能性变更，无需更新 API 文档
- [x] `openapi.json` 已移出 git 追踪
