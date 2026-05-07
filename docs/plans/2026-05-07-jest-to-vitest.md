# Jest → Vitest 迁移计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将整个测试套件从 Jest + ts-jest 迁移至 Vitest，消除 ESM 兼容 workaround，同时保持所有测试用例完整通过。

**Architecture:** Vitest 原生支持 ESM，与 Jest API 高度兼容（`describe/it/expect` 不变，`jest.*` → `vi.*`），通过 `vite-tsconfig-paths` 插件复用现有 `tsconfig.json` 的路径别名，无需额外的 shim 或 `moduleNameMapper` 配置。

**Tech Stack:** Vitest 3.x · @vitest/coverage-v8 · vite-tsconfig-paths · @nestjs/testing（不变）· supertest（不变）

---

## 背景与注意事项

### 为什么迁移

- `uuid` v14 纯 ESM，当前方案依赖 `test/__mocks__/uuid.ts` shim + `moduleNameMapper` 绕过 Jest CJS 限制
- Jest 的 ESM 支持需要 `--experimental-vm-modules`，配置复杂
- Vitest 原生 ESM，上述问题消失

### 变更清单总览

| 动作 | 文件 |
|------|------|
| 删除 | `jest.config.js`、`test/__mocks__/uuid.ts` |
| 新建 | `vitest.config.ts`、`tsconfig.test.json` |
| 修改 | `package.json`（scripts + devDependencies） |
| 修改 | 9 个测试文件（`jest.*` → `vi.*`，类型注解） |

### API 对照表

| Jest | Vitest |
|------|--------|
| `jest.fn()` | `vi.fn()` |
| `jest.clearAllMocks()` | `vi.clearAllMocks()` |
| `jest.Mocked<T>` (type) | `Mocked<T>`（需 `import type { Mocked } from 'vitest'`） |
| `jest.spyOn()` | `vi.spyOn()` |

`describe / it / expect / beforeEach / beforeAll / afterAll` 保持不变（Vitest globals 模式）。

---

## Task 1: 创建 Feature 分支

**Files:**
- 无文件变更，仅 Git 操作

**Step 1: 从 dev 切出 feature 分支**

```bash
git checkout dev
git checkout -b feature/jest-to-vitest
```

预期输出：`Switched to a new branch 'feature/jest-to-vitest'`

**Step 2: 验证分支**

```bash
git branch --show-current
```

预期：`feature/jest-to-vitest`

---

## Task 2: 替换依赖包

**Files:**
- Modify: `package.json`（由 pnpm 自动写入）
- Modify: `pnpm-lock.yaml`（自动）

**Step 1: 移除 Jest 相关包**

```bash
pnpm remove jest @types/jest ts-jest
```

预期：`Removed 3 packages`（不含依赖）

**Step 2: 安装 Vitest 相关包**

```bash
pnpm add -D vitest @vitest/coverage-v8 vite-tsconfig-paths
```

预期：`Added 3 packages`

**Step 3: 验证 package.json devDependencies 包含以下（无 jest/ts-jest/\@types/jest）**

```bash
node -e "const p=JSON.parse(require('fs').readFileSync('package.json','utf8')); const d=p.devDependencies; console.log('vitest:', d.vitest, '@vitest/coverage-v8:', d['@vitest/coverage-v8'], 'vite-tsconfig-paths:', d['vite-tsconfig-paths']); if(d.jest||d['ts-jest']||d['@types/jest']) throw new Error('jest packages still present');"
```

预期：打印版本号，无报错。

---

## Task 3: 创建 vitest.config.ts

**Files:**
- Create: `vitest.config.ts`

**Step 1: 创建配置文件**

```typescript
// vitest.config.ts
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        globals: true,                     // describe/it/expect/vi 全局可用，无需 import
        environment: 'node',
        include: ['src/**/*.spec.ts', 'test/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
        testTimeout: 30_000,               // E2E 测试需要更长超时
        coverage: {
            provider: 'v8',
            reporter: process.env['CI'] === 'true' ? ['lcov', 'text'] : ['text'],
            include: ['src/**/*.{ts,js}'],
            exclude: [
                'src/**/*.spec.ts',
                'src/**/*.e2e-spec.ts',
                'src/main.ts',
            ],
        },
    },
});
```

> **注意：** 不要加 `"type":"module"` 兼容配置，当前项目的 `package.json` 已有 `"type":"module"`，Vitest 自动以 ESM 模式运行。

---

## Task 4: 创建 tsconfig.test.json

**Files:**
- Create: `tsconfig.test.json`

**Step 1: 创建测试专用 tsconfig**

`globals: true` 开启后，Vitest 将 `describe/it/vi` 等注入全局，但 TypeScript 类型检查不知道这些全局符号。`tsconfig.test.json` 通过扩展基础配置并追加 `vitest/globals` 类型来解决此问题，**不污染生产构建的 `tsconfig.json`**。

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["vitest/globals"]
  },
  "include": ["src", "test"]
}
```

**Step 2: 在 vitest.config.ts 中引用此 tsconfig**

在 Task 3 的 `defineConfig` 中，`test` 块内追加：

```typescript
        // 让 Vitest 使用测试专用 tsconfig（含 vitest/globals 类型）
        typecheck: {
            tsconfig: './tsconfig.test.json',
        },
```

完整的 `vitest.config.ts`（更新后）：

```typescript
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.spec.ts', 'test/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
        testTimeout: 30_000,
        typecheck: {
            tsconfig: './tsconfig.test.json',
        },
        coverage: {
            provider: 'v8',
            reporter: process.env['CI'] === 'true' ? ['lcov', 'text'] : ['text'],
            include: ['src/**/*.{ts,js}'],
            exclude: [
                'src/**/*.spec.ts',
                'src/**/*.e2e-spec.ts',
                'src/main.ts',
            ],
        },
    },
});
```

---

## Task 5: 更新 package.json 脚本

**Files:**
- Modify: `package.json` — `scripts` 中的 `test` 和 `test:watch`

**Step 1: 修改 test 脚本**

将：
```json
"test": "dotenvx run -f .env.test -- jest",
"test:watch": "dotenvx run -f .env.test -- jest --watch",
```

改为：
```json
"test": "dotenvx run -f .env.test -- vitest run",
"test:watch": "dotenvx run -f .env.test -- vitest",
```

> `vitest run` = 单次运行（CI 模式）；`vitest`（无参数）= watch 模式。

---

## Task 6: 验证"红灯"状态（可选但推荐）

在修改测试文件之前，先确认迁移到 Vitest 后测试确实失败（因为 `jest` 全局变量不存在），而不是静默通过。

**Step 1: 尝试运行测试，预期失败**

```bash
pnpm test 2>&1 | head -30
```

预期看到类似 `ReferenceError: jest is not defined` 的报错。

如果此步直接通过（说明有全局垫片），请检查 `globals: true` 是否正确配置——Vitest globals 模式中只有 `vi`，不会注入 `jest`。

---

## Task 7: 批量替换 jest.* → vi.*（全部测试文件）

**Files:**
- Modify: `test/unit/app.controller.spec.ts`
- Modify: `test/unit/app.service.spec.ts`
- Modify: `test/unit/auth.controller.spec.ts`
- Modify: `test/unit/auth.guard.spec.ts`
- Modify: `test/unit/auth.service.spec.ts`
- Modify: `test/unit/file.controller.spec.ts`
- Modify: `test/unit/file.service.spec.ts`
- Modify: `test/e2e/app.e2e-spec.ts`
- Modify: `test/e2e/auth.e2e-spec.ts`

**Step 1: 批量替换 `jest.fn()` → `vi.fn()` 和 `jest.clearAllMocks()` → `vi.clearAllMocks()`**

在 PowerShell 中执行（项目根目录）：

```powershell
Get-ChildItem -Path test -Recurse -Filter "*.ts" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $updated = $content -replace 'jest\.fn\(\)', 'vi.fn()' `
                        -replace 'jest\.clearAllMocks\(\)', 'vi.clearAllMocks()'
    if ($content -ne $updated) {
        Set-Content $_.FullName $updated -NoNewline
        Write-Host "Updated: $($_.Name)"
    }
}
```

预期输出（每个含 `jest.fn` 的文件打印一行）：
```
Updated: app.controller.spec.ts
Updated: app.service.spec.ts
Updated: auth.controller.spec.ts
Updated: auth.guard.spec.ts
Updated: auth.service.spec.ts
Updated: file.controller.spec.ts
Updated: file.service.spec.ts
```

**Step 2: 验证替换结果——不应再有 `jest.fn` 或 `jest.clearAllMocks`**

```bash
grep -r "jest\.fn\|jest\.clearAllMocks" test/ && echo "FOUND - needs fix" || echo "OK - all replaced"
```

预期：`OK - all replaced`

---

## Task 8: 修复 jest.Mocked<T> 类型注解

`jest.Mocked<T>` 是 `@types/jest` 提供的类型，已被移除。需替换为 Vitest 的等价类型。

受影响的文件（共 3 个）：
- `test/unit/file.service.spec.ts`（2 处）
- `test/unit/file.controller.spec.ts`（1 处）
- `test/unit/auth.service.spec.ts`（1 处）

**Step 1: file.service.spec.ts — 添加 Vitest 类型导入，替换类型注解**

在文件顶部，`import { FileService } ...` 之前，添加一行：

```typescript
import type { Mocked } from 'vitest';
```

然后将文件中两处 `jest.Mocked<` 改为 `Mocked<`：

```typescript
// 第 17 行（改前）
const mockStorageService: jest.Mocked<
// 改后
const mockStorageService: Mocked<

// 第 65 行（改前）
const mockFileRepo: jest.Mocked<
// 改后
const mockFileRepo: Mocked<
```

**Step 2: file.controller.spec.ts — 添加导入，替换类型注解**

文件顶部第一行之前添加：

```typescript
import type { Mocked } from 'vitest';
```

第 8 行：

```typescript
// 改前
const mockFileService: jest.Mocked<
// 改后
const mockFileService: Mocked<
```

**Step 3: auth.service.spec.ts — 添加导入，替换类型注解**

文件顶部第一行之前添加：

```typescript
import type { Mocked } from 'vitest';
```

第 20 行：

```typescript
// 改前
const mockTokenService: jest.Mocked<Pick<TokenService, 'issueTokenPair' | 'verifyToken'>> = {
// 改后
const mockTokenService: Mocked<Pick<TokenService, 'issueTokenPair' | 'verifyToken'>> = {
```

**Step 4: 验证不再有 `jest.Mocked`**

```bash
grep -r "jest\.Mocked" test/ && echo "FOUND - needs fix" || echo "OK"
```

预期：`OK`

---

## Task 9: 删除冗余文件

**Files:**
- Delete: `jest.config.js`
- Delete: `test/__mocks__/uuid.ts`

**Step 1: 删除文件**

```bash
rm jest.config.js
rm test/__mocks__/uuid.ts
rmdir test/__mocks__   # 若目录已空
```

**Step 2: 验证删除**

```bash
Test-Path jest.config.js; Test-Path test/__mocks__/uuid.ts
```

两者均应输出 `False`。

---

## Task 10: 运行完整验证序列

**Step 1: 格式化**

```bash
pnpm format
```

预期：无报错，文件可能被格式化（`vitest.config.ts`、`tsconfig.test.json`）。

**Step 2: Lint**

```bash
pnpm lint
```

预期：0 errors，0 warnings。

若报 `no-restricted-globals` 或 ESLint 抱怨 `vi`/`describe` 等全局变量未定义，需在 `eslint.config.js` 中添加 Vitest 全局：

```javascript
// eslint.config.js 中，在 languageOptions.globals 里追加
import vitestGlobals from 'vitest/eslint-plugin'
// 或直接添加：
globals: {
  ...vitestGlobals.environments.env.globals,
}
```

**Step 3: 构建**

```bash
pnpm build
```

预期：编译通过（`dist/` 更新）。`vitest.config.ts` 和测试文件不参与生产构建。

**Step 4: 运行测试**

```bash
pnpm test
```

预期：
- 单元测试：全部 PASS（含 4 个 skip 的 file.controller 端点）
- E2E 测试：全部 PASS（需数据库连接，确保 `.env.test` 中 `DATABASE_URL` 有效）
- 覆盖率报告正常输出

若 E2E 失败并提示连接超时：检查 `.env.test` 配置，或跳过 E2E 单独跑单元测试：

```bash
dotenvx run -f .env.test -- vitest run test/unit
```

---

## Task 11: 提交并合并

**Step 1: 提交所有变更**

```bash
git add -A
git commit -m "chore(test): migrate test runner from Jest to Vitest

- Remove jest, @types/jest, ts-jest
- Add vitest, @vitest/coverage-v8, vite-tsconfig-paths
- Add vitest.config.ts with vite-tsconfig-paths plugin
- Add tsconfig.test.json for vitest/globals type support
- Delete jest.config.js and test/__mocks__/uuid.ts ESM shim
- Replace jest.fn()/clearAllMocks()/Mocked<T> → vi equivalents
  across all 9 test files (7 unit + 2 e2e)"
```

**Step 2: 合并回 dev（无需 PR，feature 分支直接 fast-forward）**

```bash
git checkout dev
git merge --ff-only feature/jest-to-vitest
git branch -d feature/jest-to-vitest
```

**Step 3: 推送**

```bash
git push
```

---

## 快速参考：遇到问题时

| 症状 | 原因 | 解决 |
|------|------|------|
| `Cannot find module 'vitest/config'` | vitest 未安装 | `pnpm add -D vitest` |
| `vi is not defined` | `globals: true` 未生效 | 检查 vitest.config.ts 的 `test.globals` |
| 类型错误 `Cannot find name 'vi'` | tsconfig.test.json 未配置 | 确认 `"types": ["vitest/globals"]` |
| 路径别名解析失败 `@/...` | vite-tsconfig-paths 未加载 | 确认 `plugins: [tsconfigPaths()]` |
| E2E 超时 | 默认超时 5s 不够 | vitest.config.ts 中已设 `testTimeout: 30_000` |
| `jest` still referenced | 批量替换遗漏 | 重跑 Task 7 Step 2 的 grep 验证 |
