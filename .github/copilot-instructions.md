## 项目定位

这是一个 **NestJS 后端开发模板仓库**，为新项目提供开发基线（baseline）。它不是示例项目，而是生产就绪的模板，包含：

- 完整的 CI/CD 工作流
- 代码质量保证工具链
- 版本管理与发布流程
- Prisma 数据库集成
- Docker 容器化支持

## 快速概览

### 核心文件结构

- `src/main.ts` - 应用入口，读取 `PORT` 环境变量并启动 HTTP 服务
- `src/app.module.ts` - 根模块，声明 controllers 和 providers
- `src/app.controller.ts` - 示例控制器，包含 `/` 和 `/health` 路由
- `src/app.service.ts` - 示例服务，通过依赖注入提供业务逻辑
- `src/common/prisma.service.ts` - Prisma 数据库服务
- `package.json` - 项目依赖和脚本命令
- `prisma/schema.prisma` - 数据库模型定义

### 工作流文件（`.github/workflows/`）

- `auto-tag-release.yaml` - Release 分支合并时自动打标签
- `release-snapshot.yaml` - 生成快照版本用于测试
- `ci-feature.yaml` - 特性分支 CI 检查
- `ci-release.yaml` - Release 分支 CI 检查
- `ci-cd-dev.yaml` / `ci-cd-prod.yaml` - 开发/生产环境部署
- `pr-check-dev.yaml` / `pr-check-prod.yaml` - PR 验证

## 架构设计理念

- **约定优于配置**：遵循 NestJS 最佳实践，模块负责组装，控制器处理请求，服务封装业务逻辑
- **依赖注入**：所有服务通过构造函数注入，避免手动 new 实例
- **分层架构**：Controller → Service → Repository（Prisma）
- **类型安全**：TypeScript + Prisma 生成的类型，编译时检查
- **环境隔离**：通过环境变量和 Docker 实现开发/生产环境分离

## 关键命令（开发者工作流）

### 依赖管理

- 安装依赖：`pnpm install`
- 添加依赖：`pnpm add <package>`（生产）/ `pnpm add -D <package>`（开发）

### 开发流程

- 本地开发（热重载）：`pnpm start:dev`
- 代码检查：`pnpm lint`
- 代码修复：`pnpm lint:fix`
- 代码格式化：`pnpm format`
- 规范化提交：`pnpm commit`（交互式提交信息助手）

### 数据库操作

- 生成 Prisma Client：`pnpm prisma generate`
- 数据库迁移：`pnpm prisma migrate dev`
- 查看数据：`pnpm prisma studio`

### 构建与部署

- 构建：`pnpm build`（输出到 `dist/`）
- 生产运行：先 `pnpm build`，再 `pnpm start:prod`

### 测试（已配置 Jest）

- 单元测试：`pnpm test`
- E2E 测试：`pnpm test:e2e`
- 测试覆盖率：`pnpm test:cov`

## 技术栈与工具链

### 核心框架

- **NestJS** (v11.x) - 渐进式 Node.js 框架
- **TypeScript** (v5.x) - 类型安全的 JavaScript
- **Prisma** (v7.x) - 下一代 ORM
- **PostgreSQL** - 主数据库（通过 Prisma Adapter）

### 代码质量

- **ESLint** - 代码检查（配置：`eslint.config.js`）
- **Prettier** - 代码格式化
- **Commitizen** - 交互式提交助手
- **Husky** - Git 钩子
- **Lint-staged** - 暂存文件检查

### 测试框架

- **Jest** - 单元测试与 E2E 测试
- **Supertest** - HTTP 断言库

### 容器化

- **Docker** - 容器化部署（多阶段构建）
- **Docker Compose** - 本地开发环境编排

### 包管理

- **pnpm** (≥8.0.0) - 快速、节省空间的包管理器

## 项目约定与规范

### 目录结构约定

```
src/
├── common/          # 共享服务（如 PrismaService）
├── utils/           # 工具函数
│   ├── constants.ts # 常量定义
│   └── helpers/     # 辅助函数
├── *.module.ts      # 功能模块
├── *.controller.ts  # 控制器
├── *.service.ts     # 服务
└── main.ts          # 应用入口
```

### 代码风格

- **缩进**：4 空格（TypeScript），2 空格（YAML/JSON）
- **分号**：必须使用
- **引号**：单引号
- **文件末尾**：必须有空行
- **行尾空格**：自动移除

### 提交信息规范（Conventional Commits）

格式：`<type>(<scope>): <subject>`

支持的类型：

- `feat` - 新功能
- `fix` - 修复 bug
- `docs` - 文档更新
- `style` - 代码格式（不影响功能）
- `refactor` - 重构
- `perf` - 性能优化
- `test` - 测试相关
- `chore` - 构建/工具变更
- `ci` - CI 配置
- `build` - 构建系统
- `release` - 发布相关
- `revert` - 回退提交

示例：

```
feat(auth): add JWT authentication
fix(user): resolve duplicate email validation
docs(readme): update installation guide
```

### 环境变量规范

- 使用 `.env.example` 作为模板（不包含敏感信息）
- 生产环境变量通过 CI/CD 注入
- 当前环境变量：
    - `NODE_ENV` - 运行环境（development/production）
    - `PORT` - 服务端口
    - `DATABASE_URL` - 数据库连接 URL（注意：从 v0.3.0 起从 `DATABASE_URL` 重命名）

### 分支与版本管理

- **主分支**：`main` - 稳定的生产代码
- **开发分支**：`dev` - 日常开发集成
- **特性分支**：`feature/*` - 新功能开发
- **修复分支**：`bugfix/*` - Bug 修复
- **发布分支**：`release-X.Y` - 版本发布（如 `release-0.3`）

### 版本号规则（语义化版本）

- 格式：`MAJOR.MINOR.PATCH`（如 `0.3.1`）
- Release 分支合并到 main 时，自动创建 `vX.Y.Z` 标签
- 同一 release 分支多次合并，patch 号自动递增（`v0.3.0` → `v0.3.1` → `v0.3.2`）
- 快照版本格式：`vX.Y.Z-snapshot-YYYYMMDD-hash`

## CI/CD 工作流详解

### 1. 自动标签发布（auto-tag-release.yaml）

**触发条件**：Release 分支的 PR 合并到 main
**执行步骤**：

1. 提取 release 分支名称（如 `release-0.3` → `0.3`）
2. 查找该版本系列的最新 tag
3. 计算下一个 patch 号
4. 更新 package.json 版本号
5. 提交版本变更（带 `[skip ci]` 标记）
6. 创建并推送新 tag

**关键脚本**：`scripts/auto-tag-release.cjs`（JavaScript 实现）

### 2. 快照版本发布（release-snapshot.yaml）

**触发条件**：Release 分支推送且提交信息包含 `[snapshot]`
**用途**：生成测试版本，不影响正式版本号

### 3. 特性分支 CI（ci-feature.yaml）

**触发条件**：特性分支推送
**检查项**：代码检查、构建验证

### 4. Release 分支 CI（ci-release.yaml）

**触发条件**：Release 分支推送
**检查项**：完整的 CI 检查 + E2E 测试

## 给 AI 编码代理的具体指令

### 添加新功能

1. 创建新的模块、控制器、服务（使用 NestJS CLI 或手动）
2. 在对应的 module.ts 中注册
3. 遵循 Controller → Service 分层
4. 使用依赖注入，不要手动 new 实例
5. 添加相应的单元测试和 E2E 测试

### 修改数据库模型

1. 更新 `prisma/schema.prisma`
2. 运行 `pnpm prisma migrate dev` 创建迁移
3. 更新受影响的服务和 DTO

### 添加依赖

- 必须使用 `pnpm add` 或 `pnpm add -D`
- 自动更新 `pnpm-lock.yaml`
- 不要使用 npm 或 yarn

### 修改环境变量

1. 更新 `.env.example`
2. 如果是数据库相关，同步更新：
    - `prisma.config.ts`
    - `src/common/prisma.service.ts`
    - `Dockerfile`（ARG 参数）

### 生成 CHANGELOG

1. **必须使用 `git diff` 查看实际文件变更**，不只是 commit 信息
2. 生成两份文件：
    - `CHANGELOG.md`（英文版）
    - `CHANGELOG_zh-CN.md`（中文版）
3. 详细记录：新增的文件、修改的配置、依赖版本变化、重命名/删除的文件

### 代码风格要求

- 所有 JSON 接口返回值必须可序列化（Date 使用 ISO 字符串）
- 使用 TypeScript 严格模式
- 避免 any 类型，使用具体类型或泛型
- 优先使用 async/await 而不是 Promise.then()

### 禁止事项

- ❌ 不要假设存在未版本控制的文件（如 `.env`）
- ❌ 不要使用 npm/yarn，只用 pnpm
- ❌ 不要绕过 Git 钩子（如 `--no-verify`）
- ❌ 不要直接修改 `pnpm-lock.yaml`
- ❌ 不要在代码中硬编码敏感信息

## 常见任务示例

### 添加新路由

```typescript
// 在 app.controller.ts 中
@Get('metrics')
getMetrics() {
  return this.appService.getMetrics();
}

// 在 app.service.ts 中
getMetrics() {
  return {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
}
```

### 创建新模块

```bash
nest g module users
nest g controller users
nest g service users
```

### 数据库查询

```typescript
// 在 service 中注入 PrismaService
constructor(private prisma: PrismaService) {}

async findAll() {
  return this.prisma.user.findMany();
}
```

## 模板使用指南

### 从模板创建新项目

1. 点击 GitHub "Use this template" 按钮
2. 克隆新仓库
3. 运行 `pnpm install`
4. 复制 `.env.example` 到 `.env` 并配置
5. 运行 `pnpm prisma migrate dev` 初始化数据库
6. 开始开发：`pnpm start:dev`

### 定制化建议

- 更新 `package.json` 中的项目名称和描述
- 修改 `prisma/schema.prisma` 定义你的数据模型
- 删除示例代码（`app.controller.ts`、`app.service.ts`）
- 根据需求调整 CI/CD 工作流
- 更新 `README.md` 为你的项目文档

## 故障排查

### 常见问题

1. **pnpm 命令不存在**：运行 `npm install -g pnpm@latest`
2. **Prisma Client 未生成**：运行 `pnpm prisma generate`
3. **数据库连接失败**：检查 `.env` 中的 `DATABASE_URL`
4. **端口被占用**：修改 `.env` 中的 `PORT` 或停止占用进程
5. **commit 被拒绝**：提交信息不符合规范，使用 `pnpm commit` 交互式提交

### 调试技巧

- 使用 VS Code 调试配置（已包含在项目中）
- 查看 `pnpm start:dev` 的控制台输出
- 使用 Prisma Studio 查看数据库：`pnpm prisma studio`

## 项目维护

### 依赖更新

```bash
# 检查过时的包
pnpm outdated

# 更新依赖（需要手动修改 package.json 并测试）
pnpm update
```

### 安全检查

```bash
# 检查安全漏洞
pnpm audit

# 修复可自动修复的漏洞
pnpm audit --fix
```

## 更新记录

- **v0.3.0** (2025-12-20)：添加完整的 CI/CD 工作流、代码规范工具、自动版本管理
- **v0.2.0** (2025-12)：初始化 CI/CD 基础、Dockerfile、编辑器配置
