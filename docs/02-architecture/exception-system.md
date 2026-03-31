---
title: 异常系统设计
inherits: docs/02-architecture/STANDARD.md
status: active
version: "0.5.3"
last-updated: 2026-03-31
category: architecture
related:
  - docs/02-architecture/STANDARD.md
  - docs/02-architecture/project-architecture-overview.md
  - docs/02-architecture/request-pipeline.md
  - docs/02-architecture/database.md
---

# 异常系统设计

本文档描述异常系统的完整设计，涵盖异常类层级、错误码体系、`Result<T, E>` 类型契约、装饰器注册机制，以及服务层到控制层的错误传递流程。

---

## 1. 设计动机

当前实现存在以下问题，本次重设计全部解决：

| 问题 | 具体表现 |
|------|---------|
| 目录需手动维护 | `ERROR_CATALOG` 对象与实际抛出的错误码严重脱节（如 `AUTH_DUPLICATE_USER` 不在目录中）|
| 错误码类型不安全 | `BusinessException(msg, code, status)` 的 `code` 为裸 `string`，编译期无法约束 |
| 服务层直接 throw | 异常穿透控制层直达 Filter，控制层无法参与错误后续处理 |
| Filter 职责过重 | 包含 Prisma 错误码解析（`P2002`）、日志级别硬编码、死代码分支 |
| 基础设施错误码游离 | `TOO_MANY_REQUESTS`、`SERIALIZATION_ERROR` 等由 Filter 硬编码，不在注册表中 |
| 原始错误丢失 | 异常被包装后 `cause` 链断裂，排查时无法追溯底层错误 |

---

## 2. 异常类层级

### 2.1 继承链

```
AppException                          extends HttpException（NestJS 基类）
├── ClientException   (4xx)           调用方的问题，客户端应修正
│   ├── ValidationException  (400)    输入不合法，含 fields[]
│   ├── AuthException        (401/403) 认证/授权失败
│   └── ResourceException    (404/409) 资源状态问题
│
├── InfraException    (5xx)           基础设施问题，运维关注
│   ├── DatabaseException             包装 Prisma 错误，在 DatabaseService 转换
│   ├── StorageException              文件/对象存储失败
│   └── ExternalServiceException      外部 HTTP 调用失败
│
└── SystemException   (5xx, fatal)    未预期的 bug，开发者关注
```

### 2.2 `AppException` 基类结构

```typescript
interface ExceptionMeta {
    code: AppExceptionCode;      // 来自注册表的合法错误码
    statusCode: number;          // HTTP 状态码
    message: string;             // 面向用户的简短描述（可国际化）
    description: string;         // 面向开发者的详细说明
    retryable: boolean;          // 客户端是否可以重试
    logLevel: 'info' | 'warn' | 'error' | 'fatal';  // 建议日志级别
    docsPath?: string;           // 覆盖默认文档 URL（可选）
}

class AppException extends HttpException {
    readonly code: AppExceptionCode;
    readonly logLevel: ExceptionMeta['logLevel'];
    readonly retryable: boolean;
    readonly details?: unknown;
    // cause 通过 Error options 传递：new AppException({ cause: originalError })
}
```

`logLevel` 字段消除了 `AllExceptionsFilter` 中硬编码的日志级别判断逻辑（含死代码分支），改由异常类自身声明。

### 2.3 各基类的职责约束

| 基类 | 默认 logLevel | 默认 statusCode | 典型场景 |
|------|--------------|----------------|---------|
| `ClientException` | `info` | 4xx | 参数错误、权限不足、资源不存在 |
| `InfraException` | `error` | 5xx | 数据库超时、外部服务不可用 |
| `SystemException` | `fatal` | 500 | 未捕获异常、逻辑断言失败 |

---

## 3. 错误码体系

### 3.1 分层聚合结构

错误码的层级与异常类层级完全镜像：

```typescript
// 第一层：领域级（就近定义，const 对象）
// src/modules/auth/auth.exceptions.ts
export const AuthCode = {
    USER_DUPLICATE:       'AUTH_USER_DUPLICATE',
    CREDENTIALS_INVALID:  'AUTH_CREDENTIALS_INVALID',
    TOKEN_INVALID:        'AUTH_TOKEN_INVALID',
} as const;

// src/infra/database/database.exceptions.ts
export const DatabaseCode = {
    UNIQUE_VIOLATION:  'DB_UNIQUE_VIOLATION',
    RECORD_NOT_FOUND:  'DB_RECORD_NOT_FOUND',
    QUERY_FAILED:      'DB_QUERY_FAILED',
} as const;

// 第二层：责任归属级（common/ 或 infra/ 中间层聚合）
export type ClientCode =
    | typeof AuthCode[keyof typeof AuthCode]
    | typeof ValidationCode[keyof typeof ValidationCode]
    | typeof ResourceCode[keyof typeof ResourceCode];

export type InfraCode =
    | typeof DatabaseCode[keyof typeof DatabaseCode]
    | typeof StorageCode[keyof typeof StorageCode]
    | typeof ExternalServiceCode[keyof typeof ExternalServiceCode];

// 第三层：全局顶层（供 Filter / 注册表类型约束使用）
export type AppExceptionCode = ClientCode | InfraCode | SystemCode;
```

### 3.2 命名约定

格式：`{DOMAIN}_{NOUN}_{CONDITION}`

```
AUTH_USER_DUPLICATE        ✓  主语一致（USER 是名词主语）
AUTH_TOKEN_INVALID         ✓
DB_QUERY_UNIQUE_VIOLATION  ✓
VALIDATION_FIELD_REQUIRED  ✓

AUTH_DUPLICATE_USER        ✗  主语不一致，避免
```

- `DOMAIN`：领域前缀（`AUTH`、`DB`、`STORAGE`、`VALIDATION`、`RESOURCE`、`SYS`）
- `NOUN`：受影响的实体（`USER`、`TOKEN`、`QUERY`、`FIELD`）
- `CONDITION`：错误条件（`DUPLICATE`、`INVALID`、`NOT_FOUND`、`FAILED`）

---

## 4. `Result<T, E>` 类型契约

### 4.1 类型定义

```typescript
// src/common/exceptions/result.type.ts
export type Result<T, E extends AppException = AppException> =
    | { ok: true;  data: T }
    | { ok: false; error: E };

export const ok   = <T>(data: T): Result<T, never> => ({ ok: true, data });
export const fail = <E extends AppException>(error: E): Result<never, E> => ({ ok: false, error });
```

### 4.2 使用规范

**Service 层**：返回 `Result<T, E>`，不再直接 `throw`。

```typescript
// src/modules/auth/services/auth.service.ts
async register(dto: RegisterDto): Promise<Result<AuthResult, ResourceException>> {
    const [err, user] = await to(this.db.user.findFirst(...));  // to() 包装 IO 调用
    if (err) return fail(new DatabaseException(DatabaseCode.QUERY_FAILED, { cause: err }));
    if (user) return fail(new ResourceException(AuthCode.USER_DUPLICATE));

    // ... 业务逻辑
    return ok({ accessToken, refreshToken, user });
}
```

**Controller 层**：解包 `Result`，决定后续步骤。

```typescript
// src/modules/auth/auth.controller.ts
async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    if (!result.ok) throw result.error;  // 转为异常，交给 Filter 格式化响应
    return result.data;
}
```

`E` 的泛型约束确保 `result.error` 在 Controller 中类型已知，无需断言：

```typescript
// E = ResourceException 时，result.error 确认有 code / statusCode / logLevel
if (!result.ok) {
    logger.warn(result.error.code);  // TS 知道 code 存在，无 any
    throw result.error;
}
```

### 4.3 `to()` 与 `Result<T, E>` 的分工

| 工具 | 用于 | 返回 |
|------|------|------|
| `to(promise)` | 包装底层 IO（数据库、HTTP、文件）| `[err, null] \| [null, T]` |
| `Result<T, E>` | Service 对外暴露的业务契约 | `{ ok, data } \| { ok, error }` |

`to()` 捕获的原始错误应就地包装为对应的 `InfraException` 子类后，再通过 `fail()` 包装进 `Result`。

---

## 5. 装饰器注册机制

### 5.1 注册流程

```
类定义时 @RegisterException(meta) 执行
    → 写入 ErrorRegistry（全局 Map<code, meta>）
    → AllExceptionsFilter 运行时查询 Registry 获取 logLevel / docsPath
```

### 5.2 注册保证

装饰器在文件被 `import` 时执行。各领域 `*.exceptions.ts` 必须在对应模块的 `*.module.ts` 顶部 import，确保应用启动时完整注册：

```typescript
// src/modules/auth/auth.module.ts
import './auth.exceptions.js';  // 触发装饰器注册，无需使用导出值
```

基础设施异常（`database.exceptions.ts`、`storage.exceptions.ts`）在其对应的 infra 模块导入时触发。`SystemException` 在 `AppModule` 启动时注册。

### 5.3 重复注册保护

`ErrorRegistry` 在写入时检查 code 唯一性，重复注册同一 code 抛出 `Error`（启动阶段快速失败，而非运行时静默覆盖）。

---

## 6. 目录结构

```
src/
├── common/
│   └── exceptions/
│       ├── app.exception.ts          ← AppException 基类 + ExceptionMeta 接口
│       ├── client.exception.ts       ← ClientException / ValidationException /
│       │                                AuthException / ResourceException
│       ├── system.exception.ts       ← SystemException（fatal 基类）
│       ├── error-registry.ts         ← ErrorRegistry 单例 + @RegisterException 装饰器
│       ├── result.type.ts            ← Result<T,E> + ok() + fail()
│       └── index.ts
│
├── infra/
│   ├── infra.exception.ts            ← InfraException 基类（只在 infra 层使用）
│   ├── database/
│   │   ├── database.service.ts       ← try/catch 捕获 PrismaClientKnownRequestError，
│   │   │                                就地包装为 DatabaseException（不依赖 Filter）
│   │   └── database.exceptions.ts   ← DatabaseException + DatabaseCode（@RegisterException 标注）
│   └── storage/
│       └── storage.exceptions.ts    ← StorageException + StorageCode
│
├── modules/
│   └── auth/
│       ├── auth.exceptions.ts        ← DuplicateUserException / InvalidCredentialsException
│       │                                （extends ResourceException / AuthException）
│       ├── auth.module.ts            ← import './auth.exceptions.js'
│       └── services/
│           └── auth.service.ts       ← 返回 Result<AuthResult, ResourceException>
│
└── app.filter.ts                     ← 包含三个 Filter 类（单文件）
                                         AllExceptionsFilter：兜底，处理 AppException + 未知异常
                                         ZodExceptionFilter：@Catch(ZodValidationException, ZodSerializationException)
                                         ThrottlerExceptionFilter：@Catch(ThrottlerException)
```

**归属判断原则**：第三层基类若可能被跨模块引用（如 `AuthException` 被全局 Guard 使用），放在 `common/exceptions/`；若仅在 infra 层内部使用，放在 `infra/`。

---

## 7. Filter 分层架构

### 7.1 Filter 的作用域说明

NestJS Filter 无论绑定在全局、Controller 还是单个路由，**捕获点都是 HTTP 管道入口**，即异常已从抛出位置冒泡到 Controller 层之后才被拦截。因此 Filter 无法在 `DatabaseService` 内部拦截 Prisma 错误——异常必然已穿透所有中间层。

Prisma 错误的正确包装位置是 `DatabaseService` 内部的 **try/catch 块**，在数据库调用失败时就地转换为 `DatabaseException`，不依赖 Filter 的后置拦截。

### 7.2 多 Filter 注册

`ZodValidationException`、`ThrottlerException` 等框架异常无法在业务层预包装，需要在 Filter 层处理。将其拆分为独立的专用 Filter，而非全部堆在 `AllExceptionsFilter` 中，符合 OCP——新增框架依赖时不修改已有 Filter。

NestJS 多 Filter 按**注册顺序反向执行**（越后注册越先捕获），精确匹配的 Filter 优先于兜底 Filter：

```
注册顺序（AppModule）：
  1. AllExceptionsFilter      ← 最先注册，最后捕获（兜底）
  2. ZodExceptionFilter       ← 专处理 ZodValidationException / ZodSerializationException
  3. ThrottlerExceptionFilter ← 专处理 ThrottlerException

执行顺序（运行时）：
  ThrottlerExceptionFilter  →（未匹配）→  ZodExceptionFilter  →（未匹配）→  AllExceptionsFilter
```

各框架 Filter 通过 `ErrorRegistry` 查询对应错误码的元数据（`logLevel`、`docsPath`），不硬编码字符串。

### 7.3 `AllExceptionsFilter` 简化后的职责

| 职责 | 说明 |
|------|------|
| 格式化响应 | 将 `AppException` 转为统一 JSON 响应结构 |
| 日志分发 | 从 `exception.logLevel` 读取级别，无 if-else 链 |
| 兜底未知异常 | 非 `AppException` 的异常包装为 `SystemException` 后走相同流程 |

`AllExceptionsFilter` 不再感知 Prisma、Zod、Throttler 等任何具体框架类型。

---

## 引用

- [项目架构全览](project-architecture-overview.md)
- [请求生命周期](request-pipeline.md)
- [数据库层设计](database.md)
