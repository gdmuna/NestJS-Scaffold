> [!Warning]
> 该模板仓库文档尚不完善，部分内容存在缺失，敬请期待后续更新。

<div align="center">

<h1>🚀 NestJS Enterprise Starter</h1>

<p align="center">
  <strong>5 分钟启动生产级 NestJS 后端</strong><br/>
  开箱即用的企业级开发模板，从代码到部署的完整工程化解决方案
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11.x-E0234E?logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/pnpm-8.x-F69220?logo=pnpm&logoColor=white" alt="pnpm" />
  <img src="https://img.shields.io/badge/License-MIT-success?logo=opensourceinitiative&logoColor=white" alt="License" />
  <img src="https://img.shields.io/github/stars/gdmuna/nestjs-demo-basic?style=social" alt="GitHub stars" />
</p>

<p align="center">
  <a href="#-为什么选择这个模板"><strong>为什么选择</strong></a> •
  <a href="#-快速开始"><strong>快速开始</strong></a> •
  <a href="#-核心特性"><strong>核心特性</strong></a> •
  <a href="#-在线演示"><strong>在线演示</strong></a> •
  <a href="#-贡献指南"><strong>参与贡献</strong></a>
</p>

<br/>

<p align="center">
  <img src="https://via.placeholder.com/800x400/1a1a1a/00d8ff?text=Demo+Screenshot" alt="项目截图" />
  <br/>
</p>

</div>

<br/>

## 🎯 为什么选择这个模板？

> 大多数 NestJS 模板只给你一个空壳，而这个项目提供了从开发到部署的**完整工程化解决方案**

### 🤔 你是否遇到过这些问题？

- ❌ 每次新项目都要从头配置 ESLint、Prettier、Husky...
- ❌ 不知道如何搭建规范的 CI/CD 流程
- ❌ 手动管理版本号，经常忘记打 tag
- ❌ 团队成员提交信息格式不统一，难以追踪变更
- ❌ Docker 配置复杂，部署流程不清晰

### ✅ 这个模板帮你解决

| 痛点               | 解决方案                              |
| ------------------ | ------------------------------------- |
| **环境配置繁琐**   | 一键初始化，5 分钟启动完整开发环境    |
| **代码质量难保证** | ESLint + Prettier 全家桶              |
| **版本管理混乱**   | 自动化语义化版本控制，PR 合并即打 tag |
| **CI/CD 缺失**     | 6 个开箱即用的 GitHub Actions 工作流  |
| **团队协作困难**   | 统一的代码规范 + 提交规范 + Git 钩子  |
| **生产部署复杂**   | Docker 多阶段构建 + 环境变量管理      |

### 🏆 与其他模板对比

```diff
+ ✅ 完整的 CI/CD 工作流（自动测试、自动部署、自动发布）
+ ✅ 自动化版本管理（Semantic Versioning + Changelog 生成）
+ ✅ 生产级数据库集成（Prisma + 迁移管理 + 类型安全）
+ ✅ 企业级代码规范（Husky + Lint-staged）
+ ✅ 双语文档支持（中英文 README 和 CHANGELOG）
- ⚠️  其他模板：基础配置，需要自行完善
- ⚠️  其他模板：缺少 CI/CD，手动部署
- ⚠️  其他模板：没有版本管理策略
```

<br/>

---

## 🚀 核心特性

### 核心功能

- 🚀 **NestJS 11.x** - 渐进式 Node.js 框架
- 📘 **TypeScript** - 类型安全的 JavaScript
- 🗄️ **Prisma** - 下一代 ORM
- 🐘 **PostgreSQL** - 主数据库支持
- 🐳 **Docker** - 容器化部署

### 开发体验

- ⚡ **热重载** - 开发模式自动重启
- 🧪 **Jest** - 单元测试与 E2E 测试
- 🎨 **ESLint + Prettier** - 代码格式化
- ⚙️ **Husky** - Git 钩子管理

### CI/CD

- 🔄 **自动化发布** - Release 分支自动打标签
- 📸 **快照版本** - 测试环境快照发布
- ✅ **自动化测试** - Feature/Release 分支 CI 检查
- 🚀 **部署流程** - Dev/Prod 环境自动部署

## 📋 前提条件

- **Node.js** >= 20.0.0
- **pnpm** >= 8.0.0
- **PostgreSQL** >= 15.0（可选，用于数据库功能）
- **Docker**（可选，用于容器化部署）

## 快速开始

### 1. 从模板创建项目

```bash
# 使用 GitHub "Use this template" 按钮，或直接克隆
git clone https://github.com/your-username/nestjs-demo-basic.git my-project
cd my-project
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/mydb?schema=public
```

### 4. 初始化数据库

```bash
# 生成 Prisma Client
pnpm prisma generate

# 运行数据库迁移
pnpm prisma migrate dev

# （可选）查看数据库
pnpm prisma studio
```

### 5. 启动开发服务器

```bash
pnpm start:dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 详细文档

### 目录结构

```
nestjs-demo-basic/
├── .github/
│   ├── workflows/              # GitHub Actions 工作流
│   │   ├── auto-tag-release.yaml
│   │   ├── release-snapshot.yaml
│   │   ├── ci-feature.yaml
│   │   ├── ci-release.yaml
│   │   ├── ci-cd-dev.yaml
│   │   └── ci-cd-prod.yaml
│   └── copilot-instructions.md # AI 编码助手指令
├── prisma/
│   ├── schema.prisma          # 数据库模型定义
│   └── migrations/            # 数据库迁移文件
├── scripts/
│   └── auto-tag-release.cjs   # 自动标签发布脚本
├── src/
│   ├── common/                # 共享服务
│   │   └── prisma.service.ts
│   ├── utils/                 # 工具函数
│   ├── app.module.ts          # 根模块
│   ├── app.controller.ts      # 示例控制器
│   ├── app.service.ts         # 示例服务
│   └── main.ts                # 应用入口
├── test/                      # 测试文件
│   ├── unit/                  # 单元测试
│   └── e2e/                   # E2E 测试
├── .env.example               # 环境变量模板
├── .husky/                    # Git 钩子
├── Dockerfile                 # Docker 镜像
├── package.json               # 项目配置
└── README.md                  # 项目文档
```

### 可用命令

#### 开发命令

```bash
pnpm start:dev      # 开发模式（热重载）
pnpm start:prod     # 生产模式
pnpm build          # 构建项目
```

#### 代码质量

```bash
pnpm lint           # 代码检查
pnpm lint:fix       # 修复代码问题
pnpm format         # 格式化代码
pnpm commit         # 交互式提交（规范化）
```

#### 测试

```bash
pnpm test           # 运行单元测试
pnpm test:watch     # 监听模式测试
pnpm test:cov       # 测试覆盖率
pnpm test:e2e       # E2E 测试
```

#### 数据库

```bash
pnpm prisma generate      # 生成 Prisma Client
pnpm prisma migrate dev   # 运行迁移（开发）
pnpm prisma migrate deploy # 运行迁移（生产）
pnpm prisma studio        # 数据库可视化界面
```

### API 接口

| 方法 | 路径      | 描述     | 响应示例                                          |
| ---- | --------- | -------- | ------------------------------------------------- |
| GET  | `/`       | 欢迎消息 | `"Hello World!"`                                  |
| GET  | `/health` | 健康检查 | `{"status": "ok", "timestamp": "2025-12-21T..."}` |

### 环境变量

| 变量名     | 描述           | 默认值        | 必需 |
| ---------- | -------------- | ------------- | ---- |
| `NODE_ENV` | 运行环境       | `development` | 否   |
| `PORT`     | 服务端口       | `3000`        | 否   |
| `DATABASE_URL`   | 数据库连接 URL | -             | 是\* |

\*仅在使用数据库功能时必需

## CI/CD 工作流

### 工作流架构

```mermaid
graph TB
    subgraph 特性开发
        A[特性分支] -->|推送| B[ci-feature.yaml]
        B -->|代码检查和构建| C{通过?}
        C -->|是| D[准备提交 PR]
        C -->|否| E[修复问题]
        E --> A
    end

    subgraph 发布流程
        F[发布分支] -->|推送| G[ci-release.yaml]
        G -->|完整 CI 和测试| H{通过?}
        H -->|是| I[合并到 Main]
        H -->|否| J[修复问题]
        J --> F

        F -->|提交包含 snapshot| K[release-snapshot.yaml]
        K -->|创建快照标签| L[v0.3.0-snapshot-...]
    end

    subgraph 生产部署
        I -->|自动触发| M[auto-tag-release.yaml]
        M -->|计算下一个版本| N[更新 package.json]
        N -->|创建标签| O[v0.3.2]
        O -->|触发| P[ci-cd-prod.yaml]
        P -->|部署| Q[生产环境]
    end

    subgraph 开发部署
        D -->|合并到 Dev| R[ci-cd-dev.yaml]
        R -->|部署| S[开发环境]
    end
```

### 提交信息规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**支持的类型：**

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具变更
- `ci`: CI 配置
- `build`: 构建系统
- `release`: 版本发布

**示例：**

```bash
# 使用交互式提交助手（推荐）
pnpm commit

# 或手动编写
git commit -m "feat(user): add user registration endpoint"
git commit -m "fix(auth): resolve token expiration issue"
git commit -m "docs(readme): update installation guide"
```

### 版本管理流程

```mermaid
sequenceDiagram
    participant Dev as 开发者
    participant RB as 发布分支
    participant Main as 主分支
    participant GH as GitHub Actions
    participant Tag as Git 标签

    Dev->>RB: 创建 release-0.3
    Dev->>RB: 提交变更
    Dev->>RB: 推送带 [snapshot] 标记
    RB->>GH: 触发 release-snapshot
    GH->>Tag: 创建 v0.3.0-snapshot-20251221-abc1234

    Dev->>Main: 创建 PR (release-0.3 → main)
    Dev->>Main: 合并 PR
    Main->>GH: 触发 auto-tag-release
    GH->>GH: 查找最新 v0.3.x 标签
    GH->>GH: 计算下一个补丁版本 (v0.3.1 → v0.3.2)
    GH->>Main: 更新 package.json
    GH->>Tag: 创建 v0.3.2
    Tag->>GH: 触发 ci-cd-prod
    GH->>GH: 部署到生产环境
```

### ⚠️ 重要：配置 Personal Access Token

**为什么需要 PAT？**

GitHub Actions 的安全限制：使用默认 `GITHUB_TOKEN` 推送的标签、代码或创建的 PR **不会触发**其他工作流。这是为了防止无限递归执行。

本项目的 `auto-tag-release.yaml` 需要推送标签来触发 `cd-prod.yaml` 进行生产部署，因此需要配置 Personal Access Token。

**快速配置（3 分钟）：**

1. **创建 Fine-grained Personal Access Token**
    - 访问：[GitHub Settings → Tokens](https://github.com/settings/tokens?type=beta)
    - 点击 "Generate new token"
    - Repository access: 选择你的项目仓库
    - Permissions: `Contents` = `Read and write`

2. **添加到仓库 Secrets**
    - 访问：仓库 → Settings → Secrets and variables → Actions
    - 点击 "New repository secret"
    - Name: `PAT`
    - Secret: 粘贴你的 token

3. **验证配置**
    - 合并 release 分支到 main
    - 检查 Actions 页面：应该看到 `auto-tag-release` 和 `cd-prod` 依次执行

**详细配置指南**: 查看 [`docs/github-pat-setup.md`](docs/github-pat-setup.md)

**未配置 PAT 的影响**:

- ✅ 标签仍会被创建和推送
- ❌ 生产部署工作流不会自动触发（需要手动运行）

## 🐳 Docker 部署

### 构建镜像

```bash
docker build -t nestjs-demo-basic:latest .
```

### 运行容器

```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  nestjs-demo-basic:latest
```

### Docker Compose

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
    app:
        build: .
        ports:
            - '3000:3000'
        environment:
            - NODE_ENV=production
            - DATABASE_URL=postgresql://postgres:password@db:5432/mydb
        depends_on:
            - db

    db:
        image: postgres:15-alpine
        environment:
            - POSTGRES_DB=mydb
            - POSTGRES_USER=postgres
            - POSTGRES_PASSWORD=password
        volumes:
            - postgres_data:/var/lib/postgresql/data

volumes:
    postgres_data:
```

运行：

```bash
docker-compose up -d
```

## 贡献指南

### 开发流程

```mermaid
flowchart LR
    A[Fork 仓库] --> B[创建特性分支]
    B --> C[修改代码]
    C --> D[运行测试]
    D --> E{测试通过?}
    E -->|否| C
    E -->|是| F[提交变更]
    F --> G[推送到 Fork]
    G --> H[创建 Pull Request]
    H --> I[代码审查]
    I --> J{审批通过?}
    J -->|否| C
    J -->|是| K[合并到主分支]
```

### 分支策略

- `main` - 稳定的生产代码
- `dev` - 日常开发集成
- `feature/*` - 新功能开发
- `bugfix/*` - Bug 修复
- `release-X.Y` - 版本发布

### 提交 PR 前检查

- [ ] 代码通过 lint 检查（`pnpm lint`）
- [ ] 所有测试通过（`pnpm test`）
- [ ] 代码已格式化（`pnpm format`）
- [ ] 提交信息符合规范（使用 `pnpm commit`）
- [ ] 更新相关文档

## 📖 技术栈详解

### 核心技术

| 技术       | 版本 | 用途       |
| ---------- | ---- | ---------- |
| NestJS     | 11.x | 渐进式框架 |
| TypeScript | 5.x  | 类型系统   |
| Prisma     | 7.x  | ORM        |
| PostgreSQL | 15+  | 数据库     |
| pnpm       | 8+   | 包管理器   |

### 开发工具

| 工具      | 用途       |
| --------- | ---------- |
| ESLint    | 代码检查   |
| Prettier  | 代码格式化 |
| Husky     | Git 钩子   |
| Jest      | 测试框架   |
| Supertest | HTTP 测试  |

## 🔧 故障排查

### 常见问题

#### 1. pnpm 命令不存在

```bash
npm install -g pnpm@latest
```

#### 2. Prisma Client 未生成

```bash
pnpm prisma generate
```

#### 3. 数据库连接失败

- 检查 `.env` 中的 `DATABASE_URL` 是否正确
- 确保 PostgreSQL 服务已启动
- 验证数据库凭据和网络连接

#### 4. 端口已被占用

```bash
# 修改 .env 中的 PORT
PORT=4000

# 或查找占用端口的进程
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000
```

#### 5. Commit 被拒绝

提交信息不符合规范，使用交互式助手：

```bash
pnpm commit
```

## 📝 更新日志

查看完整的更新历史：

- [CHANGELOG.md](CHANGELOG.md) - 英文版
- [CHANGELOG_zh-CN.md](CHANGELOG_zh-CN.md) - 中文版

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

## 🙏 致谢

- [NestJS](https://nestjs.com/) - 优秀的 Node.js 框架
- [Prisma](https://www.prisma.io/) - 现代化的 ORM
- [pnpm](https://pnpm.io/) - 高效的包管理器

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐️**

Made with ❤️ by FOV-RGT

</div>
