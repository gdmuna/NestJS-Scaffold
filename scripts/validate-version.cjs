#!/usr/bin/env node

/**
 * Validate Package Version for Release PR
 *
 * 验证 release PR 的 package.json 版本是否符合预期
 * 输出验证结果和中英双语评论内容
 */

const { validatePackageVersion, setGitHubOutput } = require('./version-utils.cjs');

function main() {
    const releaseBranch = process.argv[2];

    if (!releaseBranch) {
        console.error('❌ Error: Release branch name is required');
        console.error('Usage: node scripts/validate-version.cjs <release-branch-name>');
        process.exit(1);
    }

    try {
        const result = validatePackageVersion(releaseBranch);

        // 设置 GitHub Actions 输出
        setGitHubOutput('valid', result.valid.toString());
        setGitHubOutput('expected', result.expected);
        setGitHubOutput('actual', result.actual);

        if (result.valid) {
            console.log(`✅ Version validation passed`);
            console.log(`   Expected: ${result.expected}`);
            console.log(`   Actual: ${result.actual}`);

            // 成功时的中英双语评论
            const commentZh = `✅ **Package 版本检查通过**

- **期望版本**: \`${result.expected}\`
- **实际版本**: \`${result.actual}\`

版本配置正确，可以合并。`;

            const commentEn = `✅ **Package Version Check Passed**

- **Expected Version**: \`${result.expected}\`
- **Actual Version**: \`${result.actual}\`

Version is correctly configured for this release.`;

            const combinedComment = `${commentZh}

---

${commentEn}`;

            setGitHubOutput('comment', combinedComment.replace(/\n/g, '%0A'));
            process.exit(0);
        } else {
            console.log(`❌ Version validation failed`);
            console.log(`   Expected: ${result.expected}`);
            console.log(`   Actual: ${result.actual}`);

            // 失败时的中英双语评论
            const commentZh = `❌ **Package 版本检查失败**

- **期望版本**: \`${result.expected}\`
- **实际版本**: \`${result.actual}\`

请更新 \`package.json\` 中的版本号以匹配期望值。

**修复方法：**
1. 将 \`package.json\` 中的 \`version\` 字段更新为 \`${result.expected}\`
2. 提交并推送更改
3. PR 检查将自动重新运行`;

            const commentEn = `❌ **Package Version Check Failed**

- **Expected Version**: \`${result.expected}\`
- **Actual Version**: \`${result.actual}\`

Please update the version in \`package.json\` to match the expected value.

**How to fix:**
1. Update the \`version\` field in \`package.json\` to \`${result.expected}\`
2. Commit and push the changes
3. The PR checks will run automatically`;

            const combinedComment = `${commentZh}

---

${commentEn}`;

            setGitHubOutput('comment', combinedComment.replace(/\n/g, '%0A'));
            process.exit(1);
        }
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        setGitHubOutput('valid', 'false');
        setGitHubOutput('expected', 'unknown');
        setGitHubOutput('actual', 'unknown');

        const errorComment = `❌ **版本检查出错 / Version Check Error**

${error.message}`;
        setGitHubOutput('comment', errorComment.replace(/\n/g, '%0A'));
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };
