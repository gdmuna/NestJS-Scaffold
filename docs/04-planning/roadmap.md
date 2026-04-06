---
title: 版本路线图
inherits: docs/04-planning/STANDARD.md
status: active
version: "0.7.3"
last-updated: 2026-04-07
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
| [v0.7.3](#v073--cd-prod-导出容器启动修复) | 2026-04-07 | ✅ 已发布 | cd-prod OpenAPI 导出容器环境变量注入方式修复 |
| [v0.7.2](#v072--cicd-工作流补缺) | 2026-04-07 | ✅ 已发布 | cd-dev / cd-prod Postgres 端口映射补缺 |
| [v0.7.1](#v071--cicd-修复与架构文档同步) | 2026-04-06 | ✅ 已发布 | PostgreSQL 健康检查、分支匹配、构建管理修复 |
| [v0.7.0](#v070--api-文档-文档站与-cicd-流水线) | 2026-04-06 | ✅ 已发布 | @ApiRoute、VitePress 文档站、可复用 CI、CD 自动部署 |
| [v0.6.2](#v062--异常系统重构与配置架构整合) | 2026-04-04 | ✅ 已发布 | 异常体系重构、config 整合、Docker 编排、工具链升级 |
| [v0.6.1](#v061--数据模型与中间件修复) | 2026-03-28 | ✅ 已发布 | Prisma schema 补全、Middleware 修复、文档更新 |
| [v0.6.0](#v060--业务模块与文档工程) | 2026-03-27 | ✅ 已发布 | 认证、安全层、Swagger、dotenvx、文档工程 |
| [v0.5.x](#v05x--nestjs-应用基础架构) | 2026-01~03 | ✅ 已发布 | NestJS 基础架构、可观测性、安全层 |
| [v0.4.x](#v04x--cicd-安全加固与工程化完善) | 2025-12-23 | ✅ 已发布 | 命令注入修复、并行 Job、版本管理脚本 |
| [v0.3.x](#v03x--提交规范与流程标准化) | 2025-12-20~21 | ✅ 已发布 | 提交规范、工作流重命名、Prisma 升级 |
| [v0.2.0](#v020--cicd-初始化) | 2025-12 | ✅ 已发布 | CI/CD 工作流 + Docker |
| [v0.1.0](#v010--项目初始化) | 2025-11 | ✅ 已发布 | NestJS 项目 scaffold |

---

## v0.7.3 — cd-prod 导出容器启动修复

> 发布日期：2026-04-07｜分支：`release/0.7` → `main`｜状态：✅ 已发布

**目标**：修复 `cd-prod.yaml` 中 OpenAPI 导出容器无法正确加载应用配置的问题，无功能性变更。

- [x] **移除中间解密文件写入步骤**（`fix(ci)`）：原先通过 `dotenvx decrypt --stdout > /tmp/.env.cd_export` 生成临时文件再以 `--env-file` 挂载，但 EC 私钥包含多行值，Docker `--env-file` 不支持多行变量，导致容器启动失败
- [x] **改为直接传入私钥环境变量**：`docker run` 时直接传入 `-e DOTENV_PRIVATE_KEY_TEST=...`，容器内 dotenvx 自动解密 `.env.test`
- [x] **`NODE_ENV=production` → `NODE_ENV=test`**：与 `.env.test` 文件及对应私钥名 `DOTENV_PRIVATE_KEY_TEST` 保持一致

---

## v0.7.2 — CI/CD 工作流补缺

> 发布日期：2026-04-07｜分支：`release/0.7` → `main`｜状态：✅ 已发布

**目标**：修复 CD 工作流中缺失的 Postgres 端口映射，无功能性变更。

- [x] **CD 工作流 Postgres 端口映射缺失**：`cd-dev.yaml` 和 `cd-prod.yaml` 补缺 `ports: [5432:5432]` 配置，确保 E2E 测试数据库连接可用

---

## v0.7.1 — CI/CD 修复与架构文档同步

> 发布日期：2026-04-06｜分支：`release/0.7` → `main`｜状态：✅ 已发布

**目标**：修复 v0.7.0 上线后暴露的 CI/CD、脚本问题；对齐所有架构文档与 v0.7.0 + v0.7.1 的实现，确保文档完全准确。

### 缺陷修复

#### CI/CD 流水线

- [x] **PostgreSQL 健康检查失效**：`ci-reusable.yaml`、`cd-dev.yaml`、`cd-prod.yaml` 中 `pg_isready` 未指定用户/数据库参数，导致容器尚未就绪健康检查即已通过
  - 改为 `pg_isready -U ci_test -d nestjs_demo_basic_test`
  - 新增 `--health-start-period 30s`；间隔 10s→5s、重试 5→10 次
  - 连接 URL 从 `localhost` 改为 `127.0.0.1`，绕开 IPv6 优先解析

- [x] **CI Release 分支匹配模式过窄**：`ci-release.yaml` 使用 `release-[0-9]*` 无法匹配实际 `release/X.Y` 命名，改为 `release/**`

#### 脚本

- [x] **版本前缀提取正则错误**：`scripts/validate-release-version.cjs` 正则由 `release-X.Y` 改为 `release/X.Y`

#### 文档构建

- [x] **VitePress 构建崩溃**：`pr-0.7.0.md` frontmatter `head: dev` 重命名为 `branch: dev`，消除与 VitePress 保留字段冲突

### 📚 架构文档同步（v0.7.0 + v0.7.1 实现对齐）

- [x] **所有 `docs/02-architecture/` 文档升至 v0.7.1**，frontmatter 和内容完全对齐实现
  - **auth-module.md**：修复 Mermaid 中 TokenService 的 JWT 算法标注（RS256 → ES256）
  - **project-architecture-overview.md**：更新技术栈版本（Node.js ≥22、PostgreSQL ≥18）、Mermaid ExceptionCatalogController 引用、Header 版本字段
  - **contributing.md**：分支命名 `release-X.Y` → `release/X.Y`；完整重写 CI/CD 触发条件表（移除已删除工作流、修正触发规则）
  - **cicd-deployment.md**：完整重写工作流拓扑 Mermaid；更新工作流表（10 个实际工作流、新增 health check 参数说明、DB URL 改用 `localhost`）；自动标签流程改为从 package.json 提取版本
  - **request-pipeline.md**：修复 ThrottlerGuard/AuthGuard 错误码映射；重写 AuthGuard 部分（ES256、三策略系统、新错误码 AUTH_TOKEN_MISSING/INVALID）；完整重写异常过滤器分层架构
  - **exception-system.md**：修正异常文件路径为 singular 格式；替换 Result<T,E> 伪代码为实际 `to()` 元组模式；更新异常注册机制（index.ts 直接 import）；完整重写目录结构清单
  - **database.md**：重写 Prisma 错误处理部分（DatabaseService try/catch 而非 AllExceptionsFilter）；更新错误码前缀（DB_* 格式）
  - **route-decorator.md**：完整重写（`ApiRouteOptions.errors` 类型修正、`AUTH_STRATEGY_KEY` 而非 `ROUTE_AUTH_KEY`、移除 `IS_PUBLIC_KEY`、更新装饰器展开和消费层文档）
  - **openapi-enrichment.md**：移除 `IS_PUBLIC_KEY` 引用、安全方案推断改为 `auth='public'` 判断、升至 v0.7.1
  - **observability.md**、**docs/AGENTS.md**：版本升至 v0.7.1（内容无变化）
  - **docs/README.md**：更新索引条目、文档描述、各文档版本信息

### 杂项

- [x] **`openapi.json` 移出 git 追踪**，添加至 `.gitignore`

---

## v0.7.0 — API 文档、文档站与 CI/CD 流水线

> 发布日期：2026-04-06｜分支：`dev` → `main`｜状态：✅ 已发布

**目标**：将 API 文档能力提升至生产级别，建立公开文档站，并完成 CI/CD 流水线的基础设施化。

### API 文档增强

- [x] **`@ApiRoute` 装饰器**：整合 `@Auth()`、OpenAPI 注解、错误码声明于单一装饰器，消除 Controller 层样板代码
- [x] **OpenAPI 标准响应封装**：`wrapSuccessResponses()` 将所有 2xx 响应自动包裹为 `{ success, data, timestamp, context }` 格式
- [x] **`@Cookie()` 装饰器**：提取并验证类型化的 Cookie 参数

### VitePress 文档站

- [x] **`website/` 子包**：集成 VitePress + Scalar，`/reference` 页面提供交互式 OpenAPI 文档
- [x] **OpenAPI 导出脚本**：`scripts/generate-openapi.ts`，通过 `pnpm docs:gen-openapi` 从运行中的后端导出 `openapi.json`，支持 `BACKEND_URL` 覆盖

### CI/CD 流水线

- [x] **可复用 CI 工作流**（`ci-reusable.yaml`）：lint / format / test 三段阶段提取复用，六个触发流程统一引用；新增 build job 验证编译产物
- [x] **CD-dev 工作流**（`cd-dev.yaml`）：CI 成功后自动构建并推送 `:dev-latest` 镜像，Watchtower HTTP API 通知服务器
- [x] **三段式 CD 模式**：后端镜像构建 → OpenAPI 导出 → 文档镜像构建（内嵌最新 `openapi.json`）
- [x] **CD-prod 工作流**：支持 `workflow_dispatch` 手动指定 tag 部署，三个 checkout 步骤均使用动态 `ref`

### 重构 / 配置

- [x] **`CorsMiddleware` / `TimeoutInterceptor` / `ThrottlerModule`**：改为通过 `ConfigService` 注入 HTTP 配置，新增 `http.constant.ts`
- [x] **`prisma.config.ts`**：按 `NODE_ENV` 动态选择 `.env.*` 文件
- [x] **`error-catalog` → `error-reference`**：路径重命名，接口路径及文档同步更新

### 缺陷修复

- [x] `workflow_call` 调用方添加 `secrets: inherit`，修复 `DOTENV_PRIVATE_KEY_TEST` 在 reusable workflow 内为空的问题
- [x] 修复 dotenvx 私钥缺失时 `PORT` 被注入密文、解析为 `NaN` 的问题
- [x] 修复三条 CI/CD 流水线中 Shadow Database URL 与主库相同导致 Prisma 迁移失败的问题
- [x] 修复 CD-dev `cancel-in-progress: false` 导致旧提交可能覆盖新部署的竞态问题

---

## v0.6.2 — 异常系统重构与配置架构整合

> 发布日期：2026-04-04｜分支：`dev`｜状态：✅ 已发布

**目标**：彻底重构异常体系、整合配置层，并完成基础设施模块的分离与标准化。

### ⚠️ 破坏性变更

- **`BusinessException` 已删除**：改为基于 `@RegisterException` 装饰器的分层异常体系（`ClientException` / `SystemException`）
- **`config/` 目录已移除**：所有 `registerAs` 工厂函数和 Zod schema 整合至 `src/constants/`
- **`RequestContextService` 重命名为 `AlsService`**：迁移至 `src/infra/als/`

### 异常系统

- [x] **分层异常架构**：`AppException → ClientException / SystemException`，`@RegisterException` 集中注册元数据
- [x] **`ErrorRegistry` 单例**：统一管理错误码、HTTP 状态码、日志级别
- [x] **按模块声明异常**：`auth.exception.ts`、`database.exception.ts` 各自独立
- [x] **AllExceptionsFilter 拆分**：按异常类型分为 Zod / Throttler / 兜底三个 Filter

### 配置与基础设施

- [x] **`registerAs` 工厂函数**：`app`、`auth`、`database`、`observability` 命名空间，`z.infer<>` 派生类型，导出 `AllConfig`
- [x] **`config/` 整合进 `src/constants/`**：新增 `app.constant.ts`（`IS_DEV/IS_TEST/IS_PROD/GIT_COMMIT`）、`database.constant.ts`、JWT 懒加载缓存
- [x] **`AlsModule` / `DatabaseModule`** 提取为独立基础设施模块
- [x] **`(data, err)` 元组结果模式**：替代 try/catch，应用于异步操作层

### Docker / 部署

- [x] **`docker-compose.yml`**：服务编排，`database` / `backend` 命名规范，健康检查，`SHADOW_DATABASE_URL` 支持
- [x] **Dockerfile**：Node.js 22.22，runner 阶段集成 dotenvx，更新健康检查间隔

### 工具链

- [x] `cross-env` 替换为 `dotenvx`，Node.js 最低版本升至 22，PostgreSQL 最低版本升至 18
- [x] TypeScript：移除 `baseUrl`，修正路径别名；Jest 模块解析改为 `nodenext`
- [x] `pnpm-lock.yaml` 纳入版本追踪

---

## v0.6.1 — 数据模型与中间件修复

> 发布日期：2026-03-28｜分支：`dev`｜状态：✅ 已发布

**目标**：补全 Prisma 数据模型字段，修复中间件上下文处理缺陷，更新项目文档。

- [x] **Prisma Schema 补全**：`schema.prisma` 新增字段定义，完善用户数据模型
- [x] **`fix(middleware)`**：`AppMiddleware` 补充请求上下文字段处理逻辑
- [x] **`README.md` 更新**：补充项目使用说明
- [x] **`AGENTS.md` 更新**：完善 AI 协助者操作手册描述

---

## v0.6.0 — 业务模块与文档工程

> 发布日期：2026-03-27｜分支：`dev`｜状态：✅ 已发布

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
