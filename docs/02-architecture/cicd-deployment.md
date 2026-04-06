---
title: CI/CD 与部署
inherits: docs/02-architecture/STANDARD.md
status: active
version: "0.7.1"
last-updated: 2026-04-06
category: architecture
related:
  - docs/02-architecture/STANDARD.md
  - docs/02-architecture/project-architecture-overview.md
---

# CI/CD 与部署

代码从提交到生产容器的完整流水线。

---

## 1. 分支策略与 Workflow 触发关系

```mermaid
flowchart LR
    FT["push → feature/**"] --> CF["ci-feature\nlint + test（via ci-reusable）"]
    DV["push → dev"] --> CIDEV["ci-dev\nlint + test（via ci-reusable）"]
    CIDEV -- "成功" --> CDDEV["cd-dev\n构建 + 开发环境部署"]
    RL["push → release/**"] --> CR["ci-release\nlint + test + 版本检查（via ci-reusable）"]
    MN["push → main"] --> CP["ci-prod\nlint + test（via ci-reusable）"]
    PRD["PR 合并 → main\n（from release/*）"] --> AT["auto-tag-release\n版本提取 + tag 创建"]
    AT -- "tag 创建" --> CDP["cd-prod\n生产部署"]
```

---

## 2. Workflow 清单

| 文件 | 触发条件 | 核心步骤 | 含 DB 服务 |
|------|---------|---------|-----------|
| `ci-reusable.yaml` | workflow_call（被其他 CI 复用）| lint + build + test + E2E | 是 |
| `ci-feature.yaml` | push → `feature/**`, `fix/**`, `refactor/**` | lint + test（via ci-reusable）| 是（via ci-reusable）|
| `ci-dev.yaml` | push → `dev` | lint + test（via ci-reusable）| 是（via ci-reusable）|
| `cd-dev.yaml` | ci-dev 成功完成 | 构建并推送 Docker 镜像，部署至开发环境 | 否 |
| `ci-release.yaml` | push → `release/**` | lint + test + 版本号校验（via ci-reusable）| 是（via ci-reusable）|
| `ci-prod.yaml` | push → `main` | lint + test（via ci-reusable）| 是（via ci-reusable）|
| `auto-tag-release.yaml` | PR 合并至 `main`（from `release/*`）| 版本提取 + 创建 tag | 否 |
| `cd-prod.yaml` | tag 创建事件 | 生产环境部署 | 否 |
| `pr-check-dev.yaml` | PR → `dev` | 规范性检查 | — |
| `pr-check-prod.yaml` | PR → `main` | 规范性检查 + 版本号检查 | — |

**公共配置**：Node.js 22、pnpm 10、Runner: `ubuntu-latest`

---

## 3. 含 DB 服务的 CI 环境

`ci-release` 和 `ci-prod` 中启动 PostgreSQL 服务容器供 E2E 测试使用：

| 配置项 | 值 |
|--------|-----|
| 镜像 | `postgres:18` |
| `POSTGRES_USER` | `ci_test` |
| `POSTGRES_PASSWORD` | `ci_test_password` |
| `POSTGRES_DB` | `nestjs_demo_basic_test` |
| 映射端口 | `5432` |
| 健康检查 | `pg_isready -U ci_test -d nestjs_demo_basic_test`，间隔 10s，超时 5s，start-period 10s，重试 5 次 |

注入到 CI Job 的 `DATABASE_URL`：

```
postgresql://ci_test:ci_test_password@localhost:5432/nestjs_demo_basic_test?schema=public
```

---

## 4. 自动版本标签（auto-tag-release）

当 `release/*` 分支的 PR 被合并到 `main` 时自动触发：

```mermaid
flowchart TD
    A["PR merged: release/X.Y → main"] --> B["从 package.json 提取版本号"]
    B --> C["node scripts/create-release-tag.cjs"]
    C --> D{tag 已存在?}
    D -- 是 --> E["跳过，幂等退出"]
    D -- 否 --> F["git tag vX.Y.Z 目标 commit"]
    F --> G{有 PAT 可用?}
    G -- 是 --> H["使用 PAT push tag（触发 cd-prod）"]
    G -- 否 --> I["使用 GITHUB_TOKEN push tag"]
    H & I --> J["输出 tag 短 SHA（7 位）"]
```

> `create-release-tag.cjs` 做幂等保护：tag 已存在时直接退出，不报错。

---

## 5. Docker 多阶段构建

### 阶段示意

```mermaid
flowchart LR
    subgraph builder["Stage: builder（node:22-slim）"]
        direction TB
        B1["apt-get install openssl"] --> B2["COPY package.json + pnpm files"]
        B2 --> B3["pnpm install（全量 deps）"]
        B3 --> B4["pnpm prisma generate"]
        B4 --> B5["pnpm build\n(tsc + tsc-alias)"]
        B5 --> B6["pnpm prune --prod\n移除 devDependencies"]
    end

    subgraph runner["Stage: runner（node:22-slim）"]
        direction TB
        R1["COPY node_modules（已裁剪）"] --> R2["COPY dist/"]
        R2 --> R3["COPY .env.*"]
        R3 --> R4["apt-get install openssl curl"]
        R4 --> R5["EXPOSE ${PORT}"]
        R5 --> R6["HEALTHCHECK /health"]
        R6 --> R7["CMD node dist/src/main"]
    end

    builder --> runner
```

### 构建 ARG

| 参数 | 默认值 | 用途 |
|------|--------|------|
| `DATABASE_URL` | postgresql 占位符 | Prisma generate 所需 |
| `SHADOW_DATABASE_URL` | postgresql 占位符 | Prisma migrate 所需 |
| `APP_VERSION` | — | 注入应用版本 |
| `APP_NAME` | — | 注入应用名 |
| `GIT_COMMIT` | — | 注入 Git 提交哈希 |
| `NODE_ENV` | `production` | 环境标识 |
| `PORT` | `3000` | 服务监听端口 |

### 健康检查配置

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl --fail http://localhost:${PORT}/health || exit 1
```

健康检查端点 `GET /health` 返回 DB 连接状态与应用版本，由 `AppController` 提供。

---

## 引用

- [架构设计规范](STANDARD.md)
- [项目架构全览](project-architecture-overview.md)
