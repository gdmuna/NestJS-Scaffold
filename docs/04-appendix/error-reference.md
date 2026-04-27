---
title: 错误码参考
# 此文件由 scripts/generate-error-reference.ts 自动生成，请勿手动修改
# 重新生成：pnpm docs:gen-reference
---
# 错误码参考

所有错误响应均包含 `code` 字段，可在本页按错误码查阅完整说明。

每个错误码标题均可作为锚点直接访问，例如 [`AUTH_TOKEN_INVALID`](#auth-token-invalid)。

`retryable: true` 表示该错误由临时性故障引起，客户端可在等待后重试。

## 400 — 参数验证 / 请求格式错误

### `CLIENT_PARAMS_VALIDATION_FAILED`

**HTTP 400** · 不可重试

**请求参数验证失败**

请求参数不符合 Schema 约束，details 字段包含各字段的具体错误信息

**排查建议**

参考响应中 `details` 字段的字段级错误列表，逐项修正参数后重试

### `FILE_INVALID_DOMAIN`

**HTTP 400** · 不可重试

**无效的文件领域**

提供的文件领域（domain）不在系统支持的范围内

**常见触发原因**

- domain 参数不在 avatar / video / document 取值范围内

**排查建议**

使用合法的 domain 值：avatar、video 或 document

### `STORAGE_INVALID_BUCKET`

**HTTP 400** · 不可重试

**无效的存储桶类型**

请求的存储桶类型不在允许范围内，必须为 public 或 private

## 401 — 认证失败

### `AUTH_CREDENTIALS_INVALID`

**HTTP 401** · 不可重试

**用户名或密码错误**

提供的账号或密码不匹配任何已知账户，请检查后重试

**排查建议**

检查用户名/邮箱拼写及大小写是否正确，并确认密码与注册时一致

### `AUTH_TOKEN_INVALID`

**HTTP 401** · 不可重试

**Token 无效或已过期**

提供的 Token 格式不正确、签名验证失败或已过期，请重新登录

**常见触发原因**

- Token 已超过有效期
- Token 签名与服务器密钥不匹配
- Token 格式不符合 JWT 规范

**排查建议**

调用 `POST /auth/refresh-token` 使用刷新令牌换取新的访问令牌，或重新登录

### `AUTH_TOKEN_MISSING`

**HTTP 401** · 不可重试

**缺少访问令牌**

请求头中未提供有效的 Bearer Token，请先登录

**排查建议**

在请求头中添加 `Authorization: Bearer <accessToken>`，令牌可通过 `POST /auth/login` 或 `POST /auth/register` 获取

## 404 — 资源不存在

### `DB_RECORD_NOT_FOUND`

**HTTP 404** · 不可重试

**记录不存在**

数据库查询目标记录不存在或已被删除

### `EXCEPTION_CATALOG_CODE_NOT_FOUND`

**HTTP 404** · 不可重试

**该错误码不存在**

请求的错误代码在目录中不存在，请检查后重试

### `STORAGE_OBJECT_NOT_FOUND`

**HTTP 404** · 不可重试

**文件不存在**

目标 S3 对象不存在或已被删除

**常见触发原因**

- 对象 Key 错误
- 文件已被删除
- 存储桶名称错误

**排查建议**

确认文件 Key 和存储桶名称正确，检查文件是否已上传成功

## 409 — 资源冲突

### `AUTH_USER_DUPLICATE`

**HTTP 409** · 不可重试

**用户已存在**

该邮箱或用户名已被注册，请更换后重试

**常见触发原因**

- 该用户名已被其他账户使用
- 该邮箱已被其他账户注册

**排查建议**

使用不同的用户名和邮箱重新注册，或通过登录接口找回已有账户

### `DB_UNIQUE_VIOLATION`

**HTTP 409** · 不可重试

**数据唯一性约束冲突**

数据库写入/更新失败：唯一性约束（如主键、唯一索引）已被违反

## 422 — 业务逻辑错误

### `FILE_INVALID_TYPE`

**HTTP 422** · 不可重试

**不支持的文件类型**

上传文件的 MIME 类型与所选领域（domain）不匹配，请确认文件类型后重新上传

**常见触发原因**

- 文件 MIME 类型不在该领域的允许列表内

**排查建议**

查看该领域（domain）支持的文件类型列表，更换符合要求的文件后重试

## 429 — 请求频率限制

### `CLIENT_REQUEST_RATE_LIMIT_EXCEEDED`

**HTTP 429** · ✅ 可重试

**请求过于频繁，请稍后重试**

客户端请求频率超过服务端设定的速率限制，请遵循响应头 Retry-After 等待后重试

**常见触发原因**

- 短时间内发送了超过服务端限流阈值的请求

**排查建议**

遵循响应头 `Retry-After` 字段指示的等待时间后重试

## 500 — 服务器内部错误

### `DB_QUERY_FAILED`

**HTTP 500** · ✅ 可重试

**数据库查询失败**

数据库查询执行失败，可能由连接超时、语法错误或事务冲突引起

### `STORAGE_DELETE_FAILED`

**HTTP 500** · ✅ 可重试

**文件删除失败**

S3 对象删除操作失败，可能由网络超时、凭证失效或权限不足引起

**常见触发原因**

- S3 服务不可达
- 访问密钥无删除权限
- 存储桶策略拒绝删除操作

**排查建议**

检查 IAM 策略或存储桶策略是否授予了 s3:DeleteObject 权限

### `STORAGE_DOWNLOAD_FAILED`

**HTTP 500** · ✅ 可重试

**文件下载失败**

S3 对象下载操作失败，可能由网络超时、凭证失效或对象不存在引起

**常见触发原因**

- S3 服务不可达
- 访问密钥过期或无效
- 对象 Key 不存在

**排查建议**

确认对象 Key 正确，检查 S3 端点配置及读取权限

### `STORAGE_MULTIPART_ABORT_FAILED`

**HTTP 500** · ✅ 可重试

**分片上传取消失败**

S3 AbortMultipartUpload 操作失败，临时分片可能未被清理

**排查建议**

稍后重试或手动在 S3 控制台清理未完成的 Multipart Upload

### `STORAGE_MULTIPART_COMPLETE_FAILED`

**HTTP 500** · 不可重试

**分片上传合并失败**

S3 CompleteMultipartUpload 操作失败，可能由分片 ETag 不匹配或 UploadId 失效引起

**常见触发原因**

- 部分分片未成功上传
- ETag 与服务端记录不匹配
- UploadId 已过期或不存在

**排查建议**

检查所有分片是否已上传成功，确认 ETag 列表与实际上传结果一致

### `STORAGE_MULTIPART_INIT_FAILED`

**HTTP 500** · ✅ 可重试

**分片上传初始化失败**

S3 Multipart Upload 初始化失败，无法获取 UploadId

**常见触发原因**

- S3 服务不可达
- 存储桶权限不足
- 存储桶不存在

**排查建议**

检查存储桶是否存在，确认凭证具有 s3:CreateMultipartUpload 权限

### `STORAGE_UPLOAD_FAILED`

**HTTP 500** · ✅ 可重试

**文件上传失败**

S3 对象上传操作失败，可能由网络超时、凭证失效或存储桶配置错误引起

**常见触发原因**

- S3 服务不可达
- 访问密钥过期或无效
- 存储桶权限配置错误

**排查建议**

检查 S3 端点配置及访问凭证是否有效，确认目标存储桶存在且有写入权限

### `SYS_HTTP_UNEXPECTED_ERROR`

**HTTP 500** · 不可重试

**未预期的 HTTP 异常**

包装未预期的 HTTP 异常，提供对 NestJS 框架抛出的内置 HttpException 异常类型的统一包装，状态码与日志级别由运行时决定

### `SYS_SERIALIZATION_ERROR`

**HTTP 500** · 不可重试

**响应序列化失败**

服务器在序列化响应数据时失败，通常是 Response DTO 定义与 Service 返回值不一致

### `SYS_UNEXPECTED_ERROR`

**HTTP 500** · 不可重试

**未预期的服务器内部异常**

服务器遭遇未预期的异常，该异常不由客户端行为引起，请联系开发团队
