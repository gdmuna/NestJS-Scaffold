---
title: 版本路线图
inherits: docs/04-planning/STANDARD.md
status: active
version: "0.5.3"
last-updated: 2026-03-27
category: planning
related:
  - docs/04-planning/STANDARD.md
  - docs/02-architecture/project-architecture-overview.md
  - docs/02-architecture/auth-module.md
  - docs/02-architecture/cicd-deployment.md
---

# 版本路线图

本文档记录项目从立项至今的版本演进脉络，并规划下一阶段目标。各版本完整的文件级变更见根目录 [CHANGELOG.md](../../CHANGELOG.md)，本文档记录每个版本的主题分组与关键变更点。

---

## 概览

| 版本 | 发布日期 | 状态 | 核心主题 |
|------|---------|------|---------|
| [v0.6.0](#v060--业务模块与文档工程进行中) | — | 🚧 进行中 | 认证、安全层、Swagger、dotenvx、文档工程 |
| [v0.5.x](#v05x--nestjs-应用基础架构) | 2026-01~03 | ✅ 已发布 | NestJS 基础架构、可观测性、安全层 |
| [v0.4.x](#v04x--cicd-安全加固与工程化完善) | 2025-12-23 | ✅ 已发布 | 命令注入修复、并行 Job、版本管理脚本 |
| [v0.3.x](#v03x--提交规范与流程标准化) | 2025-12-20~21 | ✅ 已发布 | 提交规范、工作流重命名、Prisma 升级 |
| [v0.2.0](#v020--cicd-初始化) | 2025-12 | ✅ 已发布 | CI/CD 工作流 + Docker |
| [v0.1.0](#v010--项目初始化) | 2025-11 | ✅ 已发布 | NestJS 项目 scaffold |

---

## v0.6.0 — 业务模块与文档工程（进行中）

> 分支：`dev`｜目标版本：v0.6.0｜状态：🚧 开发中

**目标**：完成第一个可用的业务功能（认证系统），补全生产就绪的安全层，并建立受版本控制的文档体系。

### 认证模块

- [x] 用户注册：用户名/邮箱唯一性校验（`OR` 联合查询），密码 bcryptjs 10 rounds 哈希
- [x] 用户登录：用户名或邮箱均可登录，大小写不敏感匹配
- [x] JWT RS256 双令牌：Access Token（15min，Bearer）+ Refresh Token（7d，HttpOnly Cookie，Path=/auth）
- [x] Token 刷新：`POST /auth/refresh-token`，验签 → 重新签发 → 写新 Cookie
- [x] JWT Payload 携带 `jti`（ULID），具备防重放基础
- [x] `AuthGuard` 全局 JWT 守卫，`@Public()` 装饰器通过 `Reflector` 放行白名单路由

### 安全层

- [x] 自定义 `CorsMiddleware`（`src/app.middleware.ts`）替代 `app.enableCors()`：Origin 白名单、CORS 拒绝携带 requestId、OPTIONS 预检返回 204
- [x] 中间件执行顺序锁定：`RequestPreprocessing → RequestScope → CORS`，CORS 事件始终有完整追踪上下文
- [x] 三级限流规则配置（`global` 100r/60s / `strict` 20r/60s / `public` 1000r/5min）

### API 文档

- [x] Swagger / OpenAPI 集成（`GET /api-doc`），Bearer Auth 已配置
- [x] DTO Swagger 注解：通过 `nestjs-zod` `.meta({ description, example })` 自动生成（等效于 `@ApiBody`）

### 错误目录模块

- [x] `GET /errors`：全量错误码文档（`@Public`，无需认证）
- [x] `GET /errors/:errorCode`：单条错误码详情 + 示例响应体

### Utils 工程化

- [x] 目录重构：`errors/` → `operations/`，新增 `array / async / date / function / json / number / object / string` 共 9 个领域操作模块
- [x] Token 提取工具：`helpers/auth-service.helper.ts`（`extractAccessTokenFromRequest`、`extractRefreshTokenFromRequest`）

### 数据层

- [x] Prisma seed 配置（`prisma/seed.ts`）：生成 10 个测试用户
- [x] 加密环境变量：接入 `@dotenvx/dotenvx-ops`，`.env.development`/`.env.production`/`.env.test` 均已加密，Husky pre-commit 自动加密

### 文档工程

- [x] 建立 `docs/` 目录体系：5 个分类目录，各含 `STANDARD.md` 规范继承链
- [x] 从 `.gitignore` 移除 `docs/`，纳入版本控制（此前文档未被追踪）
- [x] 6 篇架构文档：项目架构全览、请求管道、认证模块、数据库、可观测性、CI/CD 部署
- [x] AI 协作规范体系：根 `AGENTS.md` → `docs/AGENTS.md`（专项操作流程）→ `docs/STANDARD.md`（写作规范）继承链
- [x] 发布 `docs/04-planning/roadmap.md`（本文档）
- [x] CHANGELOG 合并为单一中文版本（原 `CHANGELOG_zh-CN.md` + `CHANGELOG.md` → 统一为 `CHANGELOG.md`）

---

## 规划中

以下条目处于讨论阶段，尚未分配目标版本。

| 条目 | 优先级 | 说明 |
|------|--------|------|
| Refresh Token 状态化 | P0 | 数据库存储 `jti` + 黑名单撤销；当前 `POST /auth/logout` 无法真正使 RT 失效 |
| 登出接口语义修正 | P0 | `GET /auth/clear-cookie` → `POST /auth/logout`，防止浏览器预取触发登出 |
| `strict`/`public` 限流绑定 | P0 | 登录/注册添加 `@Throttle('strict')`，公开只读端点添加 `@Throttle('public')` |
| 角色/权限系统（RBAC） | P1 | `Role` 枚举 + `@Roles()` 装饰器，补全 `INSUFFICIENT_PERMISSIONS` 错误码使用场景 |
| 文件存储模块 | P1 | `src/infra/storage/` 当前为空目录，补全 `StorageService` 实现 |
| Utils 测试覆盖 | P1 | 为 `src/common/utils/` 编写 Jest 单元测试，目标覆盖率 ≥80% |
| 邮件验证 | P2 | 注册邮件确认流程，需新增 `EmailModule` |
| 生产就绪度审计 | P2 | 覆盖 OWASP Top 10，记录为 `docs/05-audits/` 文档 |

---

## 历史版本

> 各版本完整文件级变更见 [CHANGELOG.md](../../CHANGELOG.md)。

### v0.5.x — NestJS 应用基础架构

#### v0.5.3

**Docker & 构建优化**
- 路径别名重构（`tsc-alias`），修复生产构建中 `@/` 别名解析失败
- Docker 镜像体积优化（多阶段构建精简）
- `package.json` 版本动态读取改进，避免 Banner 显示空版本号

#### v0.5.2

**修复：Docker 生产构建**
- `RUN pnpm prune --prod` 缺少 `--ignore-scripts` 参数导致构建失败

#### v0.5.1

**修复：Docker 编译阶段**
- `@types/*` 未作为 `dependencies` 导致 TypeScript 编译阶段找不到类型定义

#### v0.5.0

**应用核心**
- 全局异常过滤器 `AllExceptionsFilter`，统一错误响应格式 `{ success, code, message, timestamp, context }`
- `BusinessException` 异常类 + `ERROR_CATALOG` 错误码目录（12 条预定义错误码）
- Zod 4 全局验证管道（`ZodValidationPipe`）+ 响应序列化（`ZodSerializerInterceptor`）
- `ResponseFormatInterceptor` 统一成功响应包装

**可观测性**
- Pino 结构化日志（dev: pino-pretty / prod: `logs/app.log`）
- `AsyncLocalStorage` 请求级上下文（`RequestScopeMiddleware`）
- ULID 请求 ID 分配（`RequestPreprocessingMiddleware`），全链路透传 `x-request-id`
- `PerformanceInterceptor`：请求耗时记录，慢请求分级告警（warn ≥1s / error ≥3s）
- 慢查询监控（warn ≥100ms / error ≥500ms）
- `POST /change-logging-level`：运行时动态调整 Pino 日志级别

**安全与健壮性**
- Helmet 响应头加固
- `ThrottlerGuard`（v0.5.0 为单一 global 规则）
- `TimeoutInterceptor`：全局 30s 请求超时

**基础设施**
- `DatabaseService`：Prisma + `@prisma/adapter-pg` 连接池（max=12, min=2）
- 环境变量 Zod Schema 验证（`envSchema`）
- `GET /health`：DB 状态 + 版本 + uptime
- ASCII art 彩色启动 Banner（`figlet` + `gradient-string`）

---

### v0.4.x — CI/CD 安全加固与工程化完善

#### v0.4.3

**CI/CD 工程化**
- 所有 workflow 添加 `concurrency` 组，同分支推送自动取消旧运行
- release 脚本重构：提取 `setGitHubOutput()` 到 `version-utils.cjs`，使脚本可单独测试
- Secret 命名规范化：`PAT_TOKEN` → `PAT`
- 新增 `.prettierignore`，排除 `.md` 文件格式化

#### v0.4.2

**CI/CD 跨 workflow 触发**
- `auto-tag-release.yaml` 支持 `PAT` Secret，解决 `GITHUB_TOKEN` 推送后无法触发下游 workflow 的系统限制
- 新增 `docs/github-pat-setup.md`：PAT 创建、配置与故障排查指南

#### v0.4.1

**测试与部署增强**
- `ci-prod.yaml`：添加 PostgreSQL 18-alpine 服务容器，E2E 测试可在 CI 环境中运行
- `cd-prod.yaml`：添加 `workflow_dispatch`，支持手动指定 tag 部署（PAT 未配置或紧急场景）

#### v0.4.0

**安全修复**
- `version-utils.cjs`：`execSync` → `execFileSync`（参数数组传参，消除 shell 注入）
- 新增 `validateVersionPrefixFormat()`，严格校验版本前缀格式
- 所有 workflow 中用户输入（PR 标题/分支名/提交信息）改为环境变量传参

**CI/CD 架构重构**
- 所有 workflow 重构为并行 Job（`lint-and-format` + `test` 异步执行，提升 CI 速度）
- 生产流程拆分：`ci-cd-prod.yaml` → `ci-prod.yaml`（CI）+ `cd-prod.yaml`（CD）
- Docker 镜像 tag 从 5+ 简化为 3 个（`latest` / `YYYYMMDD-hash` / 版本号）

**版本管理脚本（全新，位于 `scripts/`）**
- `validate-version.cjs`：PR 版本与 release 分支匹配校验，生成双语评论
- `generate-snapshot-info.cjs`：快照版本信息生成（JS 实现，替代原 bash 脚本）
- `create-release-tag.cjs`：自动计算下一个 patch tag
- `version-utils.cjs`：版本管理通用工具库（`extractVersionPrefix`、`calculateNextPatch` 等）

**移除**：Commitlint + `@commitlint/cli`/`@commitlint/config-conventional`

---

### v0.3.x — 提交规范与流程标准化

#### v0.3.2

- README 核心功能描述优化

#### v0.3.1

- 发布通道验证

#### v0.3.0

**工作流规范化**
- `.yml` → `.yaml`，命名规范化（`ci-cd(dev)` → `ci-cd-dev`，`PR-check` → `pr-check`）
- 新增工作流：`auto-tag-release.yaml`（release 分支合并自动打 tag）、`release-snapshot.yaml`、`ci-feature.yaml`、`ci-release.yaml`

**提交规范**
- Commitlint + Commitizen + Husky commit-msg 钩子，强制 Conventional Commits 格式
- 新增 `pnpm commit` 命令（交互式提交引导）

**依赖与配置**
- Prisma 升级：`7.1.0` → `7.2.0`
- 环境变量重命名：`DATABASE_URL` → `DB_URL`

---

### v0.2.0 — CI/CD 初始化

**CI/CD**
- GitHub Actions 工作流：`ci-cd(dev).yml`（开发环境）、`ci-cd(prod).yml`（生产环境）
- PR 验证工作流：`PR-check(dev).yml`、`PR-check(prod).yml`

**容器化**
- 多阶段 Dockerfile（`node:22-slim`），建立容器化部署基础

---

### v0.1.0 — 项目初始化

**项目骨架**
- NestJS 11 + TypeScript 5（strict + ESM + nodenext + path aliases）
- Prisma ORM 接入 PostgreSQL，初始 `User` Schema（ULID 主键）
- pnpm workspaces 基础配置，`engines` 版本约束

**代码规范**
- ESLint（Flat Config）+ Prettier
- Husky pre/post-commit 钩子

---

## 引用

- [项目架构全览](../02-architecture/project-architecture-overview.md)
- [认证模块设计](../02-architecture/auth-module.md)
- [CI/CD 部署流程](../02-architecture/cicd-deployment.md)
- [规划文档规范](STANDARD.md)
