/**
 * generate-snapshot-info.cjs
 * 生成 release snapshot 版本信息
 *
 * 功能：生成快照版本的各种标识信息
 * 用途：用于 release-snapshot.yaml 工作流
 *
 * 环境变量：
 * - GITHUB_SHA: Git 提交哈希
 * - GITHUB_OUTPUT: GitHub Actions 输出文件路径
 *
 * 输出：
 * - version: package.json 中的版本号
 * - sha7: Git 提交哈希的前 7 位
 * - timestamp: 时间戳（格式：YYYYMMDD）
 * - snapshot_tag: 快照 Git 标签（格式：vX.Y.Z-snapshot-YYYYMMDD-hash）
 * - docker_image_snapshot_tag: Docker 镜像标签（格式：X.Y.Z-snapshot-YYYYMMDD-hash）
 *
 * 退出码：
 * - 0: 成功
 * - 1: 失败
 */

const fs = require('fs');
const path = require('path');
const { setGitHubOutput } = require('./version-utils.cjs');

// 获取 package.json 中的版本号
function getPackageVersion() {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageJson.version;
}

/**
 * 生成并输出用于 GitHub Actions 的快照版本信息，并将相关字段写入 GITHUB_OUTPUT。
 *
 * 从环境变量和本地 package.json 中提取版本与提交信息，构建短 SHA、日期戳、快照标签和镜像标签，
 * 将这些值打印到控制台并通过 setGitHubOutput 写入 GitHub Actions 输出文件；在成功时以退出码 0 结束，
 * 在发生错误（例如缺少 GITHUB_SHA 或读取 package.json 失败）时记录错误并以退出码 1 结束。
 */
function main() {
    try {
        // 获取环境变量
        const githubSha = process.env.GITHUB_SHA;
        if (!githubSha) {
            throw new Error('GITHUB_SHA environment variable is not set');
        }

        console.log('========================================');
        console.log('📦 生成快照版本信息');
        console.log('========================================');

        // 提取信息
        const version = getPackageVersion();
        const sha7 = githubSha.substring(0, 7);
        const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const snapshotTag = `v${version}-snapshot-${timestamp}-${sha7}`;
        const dockerImageSnapshotTag = `${version}-snapshot-${timestamp}-${sha7}`;

        console.log(`Application Version: ${version}`);
        console.log(`Git Commit SHA (short): ${sha7}`);
        console.log(`Build Timestamp: ${timestamp}`);
        console.log(`Snapshot Tag: ${snapshotTag}`);
        console.log(`---`);
        console.log(`Docker Image Tags:`);
        console.log(`  - ${dockerImageSnapshotTag}`);

        // 设置输出
        setGitHubOutput('version', version);
        setGitHubOutput('sha7', sha7);
        setGitHubOutput('timestamp', timestamp);
        setGitHubOutput('snapshot_tag', snapshotTag);
        setGitHubOutput('docker_image_snapshot_tag', dockerImageSnapshotTag);

        console.log('========================================');
        process.exit(0);
    } catch (error) {
        console.error('❌ 错误:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };
