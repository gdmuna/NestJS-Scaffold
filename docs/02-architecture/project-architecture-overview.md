---
title: 项目架构全览
inherits: docs/02-architecture/STANDARD.md
status: active
version: "0.5.3"
last-updated: 2026-03-26
category: architecture
related:
  - docs/02-architecture/STANDARD.md
  - docs/02-architecture/request-pipeline.md
  - docs/02-architecture/auth-module.md
  - docs/02-architecture/database.md
  - docs/02-architecture/observability.md
  - docs/02-architecture/cicd-deployment.md
---

# 项目架构全览

> NestJS 生产级后端基线模板 v0.5.3。架构约束与文档规范见 [STANDARD.md](STANDARD.md)。

---

## 1. 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 运行时 | Node.js | ≥20.0.0 |
| 语言 | TypeScript（strict, ESM, nodenext）| 5.9.3 |
| 框架 | NestJS | 11.1.17 |
| ORM | Prisma + `@prisma/adapter-pg` | 7.5.0 |
| 数据库 | PostgreSQL | ≥15 |
| 认证 | JWT RS256 + bcryptjs（10 rounds）| — |
| 验证 | Zod 4 + nestjs-zod | 4.3.6 |
| 日志 | Pino + nestjs-pino | 10.3.1 |
| 安全 | Helmet + @nestjs/throttler + CORS | — |
| 测试 | Jest 30 + Supertest | 30.3.0 |
| 容器 | Docker 多阶段（node:22-slim）| — |
| 包管理 | pnpm | ≥8.0.0 |

---

## 2. 系统分层结构

```mermaid
flowchart TD
    Client(["HTTP Client"])

    subgraph EL["Express 层"]
        direction LR
        H["Helmet"] --> Comp["Compression ≥1KB"] --> CP["CookieParser"]
    end

    subgraph CM["自定义中间件（顺序执行）"]
        direction LR
        RP["① RequestPreprocessing\nULID req.id + version"] --> RS["② RequestScope\nAsyncLocalStorage"] --> CORS["③ CORS Whitelist"]
    end

    subgraph GD["全局守卫"]
        direction LR
        TG["ThrottlerGuard\n3 级限流"] --> AG["AuthGuard\nJWT RS256"]
    end

    ZVP["ZodValidationPipe（全局）"]

    subgraph BL["业务层"]
        direction LR
        AC["AppController\n/health /test/*"] --- ATC["AuthController\n/auth/*"] --- EC["ErrorCatalogController\n/errors"]
    end

    subgraph SL["Service 层"]
        direction LR
        AS["AppService"] --- AUS["AuthService + TokenService"] --- RCS["RequestContextService"]
    end

    subgraph IL["Infrastructure 层"]
        direction LR
        DB["DatabaseService\nPrisma + PG Adapter"] --- ST["StorageService（预留）"]
    end

    subgraph GW["全局包装（拦截器 + 过滤器）"]
        direction LR
        PI["PerformanceInterceptor"] --- RFI["ResponseFormatInterceptor"] --- TI["TimeoutInterceptor 30s"] --- ZSI["ZodSerializerInterceptor"]
        AEF["AllExceptionsFilter"]
    end

    Client --> EL --> CM --> GD --> ZVP --> BL --> SL --> IL
    GW -.包裹业务层.-> BL
    AEF -.兜底捕获.-> BL
```

---

## 3. 模块职责

| 模块 | 路径 | 职责 |
|------|------|------|
| App | `src/app.*` | 全局中间件、拦截器、过滤器装配；健康检查 |
| Auth | `src/modules/auth/` | 注册/登录/刷新令牌；JWT 签发与验证 |
| ErrorCatalog | `src/modules/error-catalog/` | `GET /errors`：错误码自文档化 API |
| Common | `src/common/` | 工具函数库、装饰器、`BusinessException`、`RequestContextService` |
| Constants | `src/constants/` | 所有常量的唯一定义来源 |
| Infra | `src/infra/` | `DatabaseService`（Prisma + PG）、存储抽象 |

---

## 4. 子文档导航

| 文档 | 核心问题 |
|------|---------|
| [request-pipeline.md](request-pipeline.md) | HTTP 请求经历哪些阶段？各阶段详细逻辑？ |
| [auth-module.md](auth-module.md) | 双令牌策略如何工作？JWT 如何签发与验证？ |
| [database.md](database.md) | 连接池如何配置？查询如何监控与脱敏？ |
| [observability.md](observability.md) | 日志、追踪、告警如何串联？ |
| [cicd-deployment.md](cicd-deployment.md) | 代码如何从提交走到生产容器？ |

---

## 5. 关键设计决策摘要

下列决策对架构有全局影响：

| 决策 | 选择 | 核心理由 |
|------|------|---------|
| 认证算法 | JWT RS256（非对称）| 公钥可分发，支持密钥分离；HS256 无法安全分发验证密钥 |
| 主键类型 | ULID | 时间有序（优于 UUID v4），适合数据库索引 |
| 日志库 | Pino | 性能最优，原生 JSON，nestjs-pino 官方集成 |
| 请求上下文 | AsyncLocalStorage | 无需手动传参，任意层级可访问请求 ID |
| 验证库 | Zod 4 | TypeScript-first，运行时验证与类型推断统一 |

---

## 引用

- [架构设计规范](STANDARD.md)
- [请求处理链路](request-pipeline.md)
- [认证模块](auth-module.md)
- [数据库](database.md)
- [可观测性](observability.md)
- [CI/CD 部署](cicd-deployment.md)
