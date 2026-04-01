---
title: 默认模块
language_tabs:
  - shell: Shell
  - http: HTTP
  - javascript: JavaScript
  - ruby: Ruby
  - python: Python
  - php: PHP
  - java: Java
  - go: Go
toc_footers: []
includes: []
search: true
code_clipboard: true
highlight_theme: darkula
headingLevel: 2
generator: "@tarslib/widdershins v4.0.30"

---

# 默认模块

The API description

Base URLs:

# Authentication

- HTTP Authentication, scheme: bearer

# app

<a id="opIdAppController_getHealth"></a>

## GET AppController_getHealth

GET /health

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|None|

<a id="opIdAppController_changeLoggerLevel"></a>

## POST AppController_changeLoggerLevel

POST /change-logging-level

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|none|None|

# test

<a id="opIdTestController_getHello"></a>

## GET TestController_getHello

GET /test/hello-world

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|None|

<a id="opIdTestController_simulateError"></a>

## GET TestController_simulateError

GET /test/simulate-error

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|None|

<a id="opIdTestController_slowRequest"></a>

## GET TestController_slowRequest

GET /test/slow-request

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|None|

<a id="opIdTestController_verySlowRequest"></a>

## GET TestController_verySlowRequest

GET /test/very-slow-request

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|None|

# ErrorCatalog

<a id="opIdErrorCatalogController_getAllErrors"></a>

## GET ErrorCatalogController_getAllErrors

GET /errors

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|None|

<a id="opIdErrorCatalogController_getErrorDetail"></a>

## GET ErrorCatalogController_getErrorDetail

GET /errors/{errorCode}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|errorCode|path|string| 是 |none|

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|None|

# Auth

<a id="opIdAuthController_register"></a>

## POST AuthController_register

POST /auth/register

> Body 请求参数

```yaml
username: ""
email: ""
password: ""

```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 是 |none|
|» username|body|string| 否 |none|
|» email|body|string| 否 |none|
|» password|body|string| 否 |none|

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|none|None|

<a id="opIdAuthController_login"></a>

## POST AuthController_login

POST /auth/login

> Body 请求参数

```yaml
account: user0
password: password

```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 是 |none|
|» account|body|string| 否 |none|
|» password|body|string| 否 |none|

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|none|None|

<a id="opIdAuthController_refreshToken"></a>

## POST AuthController_refreshToken

POST /auth/refresh-token

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|none|None|

<a id="opIdAuthController_logout"></a>

## GET AuthController_logout

GET /auth/clear-cookie

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|None|

# 数据模型

<h2 id="tocS_RegisterDto">RegisterDto</h2>

<a id="schemaregisterdto"></a>
<a id="schema_RegisterDto"></a>
<a id="tocSregisterdto"></a>
<a id="tocsregisterdto"></a>

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "P@ssw0rd!"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|username|string|true|none||用户名|
|email|string(email)|true|none||邮箱|
|password|string|true|none||密码|

<h2 id="tocS_LoginDto">LoginDto</h2>

<a id="schemalogindto"></a>
<a id="schema_LoginDto"></a>
<a id="tocSlogindto"></a>
<a id="tocslogindto"></a>

```json
{
  "account": "john_doe",
  "password": "P@ssw0rd!"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|account|string|true|none||用户名或邮箱|
|password|string|true|none||密码|

