---
title: 文档索引
status: active
version: "0.5.3"
last-updated: 2026-03-26
category: index
---

# 文档索引

本文件是 `docs/` 目录的入口导航，列出所有文档的位置、状态和用途。AI 助手和人类开发者均可通过此文件快速定位所需文档。

> 所有文档遵循 [STANDARD.md](STANDARD.md) 设计规范。项目级 AI 操作手册见 [根 AGENTS.md](../AGENTS.md)。

## 文档清单

### 顶层元文档

| 文档 | 状态 | 说明 |
|------|------|------|
| [README.md](README.md) | active | 本文件：文档索引与导航入口 |
| [AGENTS.md](AGENTS.md) | active | AI 文档操作手册：文档变更工作流、漂移防护、版本同步 |
| [STANDARD.md](STANDARD.md) | active | 文档设计规范：写作标准、frontmatter 规范、继承机制 |

### 01-guides/ — 指南

| 文档 | 状态 | 说明 |
|------|------|------|
| [STANDARD.md](01-guides/STANDARD.md) | active | 指南写作规范 |
| [contributing.md](01-guides/contributing.md) | active | 分支策略、提交规范（Conventional Commits）、Commitizen 使用、发布流程 |

### 02-architecture/ — 架构

| 文档 | 状态 | 说明 |
|------|------|------|
| [STANDARD.md](02-architecture/STANDARD.md) | active | 架构设计规范：分层约束、模块依赖规则、子文档格式标准 |
| [project-architecture-overview.md](02-architecture/project-architecture-overview.md) | active | 主节点：技术栈、系统分层图、模块职责、子文档导航 |
| [request-pipeline.md](02-architecture/request-pipeline.md) | active | 请求生命周期：中间件→守卫→管道→拦截器→异常过滤器全链路 |
| [auth-module.md](02-architecture/auth-module.md) | active | 认证模块：JWT RS256 双令牌、Cookie 配置、令牌轮换流程 |
| [database.md](02-architecture/database.md) | active | 数据库层：连接池、慢查询监控、参数脱敏、Prisma 错误映射 |
| [observability.md](02-architecture/observability.md) | active | 可观测性：Pino 日志、AsyncLocalStorage 链路追踪、告警阈值 |
| [cicd-deployment.md](02-architecture/cicd-deployment.md) | active | CI/CD 与部署：Workflow 矩阵、自动打标、Docker 多阶段构建 |

### 03-reference/ — 参考

| 文档 | 状态 | 说明 |
|------|------|------|
| [STANDARD.md](03-reference/STANDARD.md) | active | 参考文档规范 |
| [api-reference.md](03-reference/api-reference.md) | active | API 参考文档 |

### 04-planning/ — 规划

| 文档 | 状态 | 说明 |
|------|------|------|
| [STANDARD.md](04-planning/STANDARD.md) | active | 规划文档规范 |
| [roadmap.md](04-planning/roadmap.md) | active | 版本路线图：v0.1.0~v0.5.3 历史（分组细节）、v0.6.0 进行中（严格追踪）、规划中条目 |

### 05-audits/ — 审计

| 文档 | 状态 | 说明 |
|------|------|------|
| [STANDARD.md](05-audits/STANDARD.md) | active | 审计文档规范 |

暂无业务文档。

---

## 快速定位

| 我想知道… | 去哪看 |
|-----------|--------|
| 项目怎么跑起来 | 根目录 [README.md](../README.md) |
| 系统架构全貌 | [project-architecture-overview.md](02-architecture/project-architecture-overview.md) |
| 一个 HTTP 请求经历了哪些阶段 | [request-pipeline.md](02-architecture/request-pipeline.md) |
| JWT 双令牌如何工作 | [auth-module.md](02-architecture/auth-module.md) |
| 数据库连接池 / 慢查询监控 | [database.md](02-architecture/database.md) |
| 日志和请求追踪如何串联 | [observability.md](02-architecture/observability.md) |
| CI/CD 流水线和 Docker 部署 | [cicd-deployment.md](02-architecture/cicd-deployment.md) |
| AI 如何有效协助开发 | 根目录 [AGENTS.md](../AGENTS.md) |
| AI 文档操作流程 | [AGENTS.md](AGENTS.md) |
| 文档应该怎么写 | [STANDARD.md](STANDARD.md) |

---

## 维护规则

见 [STANDARD.md](STANDARD.md)。文档变更工作流见 [AGENTS.md](AGENTS.md)。

---

## 引用

- [AI 协助者操作手册](../AGENTS.md)
- [Docs 设计规范与约束](STANDARD.md)
