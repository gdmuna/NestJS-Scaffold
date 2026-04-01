/**
 * validate-release-version.cjs
 * 验证 release 分支的 package.json 版本号
 *
 * 功能：检查 package.json 中的版本号 major.minor 是否与当前 release 分支名称匹配
 * 用途：用于 ci-release.yaml 的版本检查 job
 *
 * 环境变量：
 * - GITHUB_REF: Git 引用（如 refs/heads/release-0.3）
 * - GITHUB_OUTPUT: GitHub Actions 输出文件路径
 *
 * 输出：
 * - is_valid: true/false（版本是否有效）
 * - expected_version_prefix: 期望的版本前缀（如 0.3）
 * - actual_version: 实际的版本号（如 0.3.1）
 * - message_cn: 中文提示信息
 * - message_en: 英文提示信息
 *
 * 退出码：
 * - 0: 验证成功
 * - 1: 验证失败
 */

const fs = require('fs');
const path = require('path');
const { setGitHubOutput } = require('./version-utils.cjs');

// 从 release 分支名称提取版本前缀（major.minor）
function extractExpectedVersionPrefix(ref) {
    // 期望格式：refs/heads/release-X.Y
    const match = ref.match(/^refs\/heads\/release-(\d+\.\d+)$/);
    if (!match) {
        throw new Error(`Invalid release branch format: ${ref}. Expected: refs/heads/release-X.Y`);
    }
    return match[1];
}

// 获取 package.json 中的版本号
function getPackageVersion() {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageJson.version;
}

// 提取版本号的 major.minor 部分
function extractMajorMinor(version) {
    const match = version.match(/^(\d+\.\d+)\.\d+$/);
    if (!match) {
        throw new Error(`Invalid version format: ${version}. Expected: X.Y.Z`);
    }
    return match[1];
}

/**
 * 执行 release 分支与 package.json 版本前缀的校验。
 *
 * 读取环境变量 `GITHUB_REF` 和工作目录下 `package.json` 的 `version`，比较 release 分支名中的期望前缀（X.Y）与实际版本的 major.minor。
 * 将校验结果和说明（`is_valid`、`expected_version_prefix`、`actual_version`、`message_cn`、`message_en`）写入 GitHub Actions 输出（通过 `GITHUB_OUTPUT`），
 * 并根据校验结果以退出码 0（通过）或 1（失败或发生错误）结束进程。
 */
function main() {
    try {
        // 获取环境变量
        const githubRef = process.env.GITHUB_REF;
        if (!githubRef) {
            throw new Error('GITHUB_REF environment variable is not set');
        }

        console.log('========================================');
        console.log('📋 Release 版本验证');
        console.log('========================================');
        console.log(`分支引用: ${githubRef}`);

        // 提取期望的版本前缀
        const expectedVersionPrefix = extractExpectedVersionPrefix(githubRef);
        console.log(`期望版本前缀: ${expectedVersionPrefix}.x`);

        // 获取实际版本
        const actualVersion = getPackageVersion();
        console.log(`实际版本号: ${actualVersion}`);

        // 提取实际版本的 major.minor
        const actualVersionPrefix = extractMajorMinor(actualVersion);
        console.log(`实际版本前缀: ${actualVersionPrefix}.x`);

        // 验证
        const isValid = expectedVersionPrefix === actualVersionPrefix;

        if (isValid) {
            console.log('✅ 版本验证通过');
            const messageCn = `版本号 ${actualVersion} 与 release 分支 ${expectedVersionPrefix} 匹配`;
            const messageEn = `Version ${actualVersion} matches release branch ${expectedVersionPrefix}`;

            setGitHubOutput('is_valid', 'true');
            setGitHubOutput('expected_version_prefix', expectedVersionPrefix);
            setGitHubOutput('actual_version', actualVersion);
            setGitHubOutput('message_cn', messageCn);
            setGitHubOutput('message_en', messageEn);

            console.log('========================================');
            process.exit(0);
        } else {
            console.log('❌ 版本验证失败');
            const messageCn = `版本号 ${actualVersion} 与 release 分支 ${expectedVersionPrefix} 不匹配，期望版本应为 ${expectedVersionPrefix}.x`;
            const messageEn = `Version ${actualVersion} does not match release branch ${expectedVersionPrefix}. Expected version: ${expectedVersionPrefix}.x`;

            setGitHubOutput('is_valid', 'false');
            setGitHubOutput('expected_version_prefix', expectedVersionPrefix);
            setGitHubOutput('actual_version', actualVersion);
            setGitHubOutput('message_cn', messageCn);
            setGitHubOutput('message_en', messageEn);

            console.error(messageCn);
            console.log('========================================');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ 错误:', error.message);
        setGitHubOutput('is_valid', 'false');
        setGitHubOutput('message_cn', `验证过程出错: ${error.message}`);
        setGitHubOutput('message_en', `Validation error: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };
