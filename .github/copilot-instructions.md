## 项目定位

> ⚠️ 本文件随项目基线模板分发。如果你正在基于此模板开发具体业务项目，请将此节替换为你的项目描述。

NestJS 后端开发基线模板，提供：认证系统、异步上下文、分层架构、CI 自动化、容器化部署、结构化日志、错误目录。

## 文档导航

> 以下文档按需加载。仅在对应场景触发时才去读取，减少不必要的上下文占用。
> 文档通过 `inherits:` frontmatter 字段形成父子继承链；子文档只含增量约束，详见 [AGENTS.md §6](../AGENTS.md)。

| 文档 | 路径 | 何时加载 |
|------|------|--------|
| AI 协助者操作手册 | [AGENTS.md](../AGENTS.md) | 任务开始前补全上下文、建立反馈循环、任务后自我审查时 |
| 文档总索引 | [docs/README.md](../docs/README.md) | 需要查找特定文档、确认文档现状时 |
| 架构设计 | [docs/02-architecture/](../docs/02-architecture/) | 涉及模块职责、请求流程、技术选型时 |
| Docs 设计规范 | [docs/STANDARD.md](../docs/STANDARD.md) | 需要创建或修改文档时 |

## 硬性约束

> 以下是工具链与安全层面的操作底线，由 [AGENTS.md §1](../AGENTS.md) 的设计原则派生而来。设计决策优先遵循原则，操作执行不得越过底线。

- 包管理：只用 `pnpm`，禁止 npm/yarn
- 架构分层：Controller → Service → Repository（Prisma）
- 依赖注入：优先使用构造函数注入与控制反转，除非迫不得已才手动 `new`
- 提交规范：`<type>(<scope>): <subject>`（Conventional Commits）
- 禁止绕过 Git 钩子（`--no-verify`）
- 禁止硬编码敏感信息，不假设 `.env` 文件存在

## 常用命令速查

```bash
pnpm start:dev          # 热重载开发
pnpm build              # 编译 + 类型检查（tsc + tsc-alias）
pnpm test               # 单元测试 + E2E 测试（同一 Jest 进程）
pnpm lint:fix           # ESLint 自动修复
pnpm format             # Prettier 格式化
pnpm db:migrate         # 数据库迁移（prisma migrate dev）
pnpm db:gen-client      # 重新生成 Prisma Client
```
