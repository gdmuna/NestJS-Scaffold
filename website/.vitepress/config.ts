import { defineConfig } from 'vitepress';
import { tasklist } from '@mdit/plugin-tasklist';

export default defineConfig({
    title: 'NestJS Scaffold',
    description: 'NestJS 后端开发基线模板',
    lang: 'zh-Hans',

    // 内容来源指向项目根目录的 docs/ 文件夹
    srcDir: '../docs',
    // 构建输出到 website/dist
    outDir: './dist',
    // 缓存目录
    cacheDir: './.vitepress/cache',

    // scope 外的链接（如 ../README.md、../../CHANGELOG.md）忽略
    ignoreDeadLinks: true,

    base: process.env.VITE_BASE_PATH || '/',

    cleanUrls: true,

    themeConfig: {
        nav: [
            { text: '首页', link: '/' },
            { text: '快速开始', link: '/00-getting-started/quick-start' },
            {
                text: 'API Reference',
                // 本地开发默认指向 backend dev server；Dockerfile 构建时通过 ARG VITE_API_REFERENCE_URL 覆盖
                link: process.env.VITE_API_REFERENCE_URL ?? 'http://localhost:3000/reference',
                target: '_blank',
            },
        ],

        sidebar: [
            {
                text: '开始',
                items: [
                    { text: '项目简介', link: '/00-getting-started/introduction' },
                    { text: '核心理念', link: '/00-getting-started/philosophy' },
                    { text: '快速上手', link: '/00-getting-started/quick-start' },
                ],
            },
            {
                text: '指南',
                items: [
                    { text: '环境搭建', link: '/01-guides/environment-setup' },
                    { text: '开发工作流', link: '/01-guides/development-workflow' },
                    { text: '测试指南', link: '/01-guides/testing' },
                    { text: 'Docker 与部署', link: '/01-guides/docker-deployment' },
                    { text: '贡献指南', link: '/01-guides/contributing' },
                ],
            },
            {
                text: 'Harness Engineering',
                items: [
                    { text: '什么是 Harness Engineering', link: '/02-harness/overview' },
                    { text: '前置控制：引导层', link: '/02-harness/feedforward' },
                    { text: '反馈控制：感知层', link: '/02-harness/feedback' },
                ],
            },
            {
                text: '架构设计',
                items: [
                    {
                        text: '项目架构全览',
                        link: '/03-architecture/project-architecture-overview',
                    },
                    { text: '认证模块', link: '/03-architecture/auth-module' },
                    { text: '请求生命周期', link: '/03-architecture/request-pipeline' },
                    { text: '数据库', link: '/03-architecture/database' },
                    { text: '异常系统', link: '/03-architecture/exception-system' },
                    { text: '可观测性', link: '/03-architecture/observability' },
                    { text: 'OpenAPI 增强', link: '/03-architecture/openapi-enrichment' },
                    { text: '路由装饰器', link: '/03-architecture/route-decorator' },
                    { text: 'CI/CD 部署', link: '/03-architecture/cicd-deployment' },
                ],
            },
            {
                text: '参考',
                items: [
                    { text: '参考资源', link: '/04-reference/external-resources' },
                    { text: '错误码参考', link: '/04-reference/error-reference' },
                    { text: '更新日志', link: '/changelog' },
                ],
            },
            {
                text: '发布说明',
                collapsed: true,
                items: [
                    { text: 'v0.7.3', link: '/05-releases/pr-0.7.3' },
                    { text: 'v0.7.2', link: '/05-releases/pr-0.7.2' },
                    { text: 'v0.7.1', link: '/05-releases/pr-0.7.1' },
                    { text: 'v0.7.0', link: '/05-releases/pr-0.7.0' },
                ],
            },
        ],

        // 内置本地全文搜索（替代 @easyops-cn/docusaurus-search-local）
        search: {
            provider: 'local',
            options: {
                locales: {
                    root: {
                        translations: {
                            button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
                            modal: {
                                noResultsText: '无法找到相关结果',
                                resetButtonTitle: '清除查询条件',
                                footer: {
                                    selectText: '选择',
                                    navigateText: '切换',
                                    closeText: '关闭',
                                },
                            },
                        },
                    },
                },
            },
        },

        socialLinks: [{ icon: 'github', link: 'https://github.com/gdmuna/nestjs-demo-basic' }],

        footer: {
            message:
                '基于 <a href="https://github.com/gdmuna/nestjs-demo-basic/blob/main/LICENSE">MIT 许可</a> 发布',
            copyright: `版权所有 © 2026-至今 <a href="https://github.com/gdmuna">GDMU-NA & GDMU-ACM</a>`,
        },

        editLink: {
            pattern: 'https://github.com/gdmuna/nestjs-demo-basic/edit/main/docs/:path',
            text: '在 GitHub 上编辑此页',
        },

        lastUpdated: {
            text: '最后更新于',
        },

        outline: {
            label: '页面导航',
        },

        docFooter: {
            prev: '上一页',
            next: '下一页',
        },

        darkModeSwitchLabel: '主题',
        lightModeSwitchTitle: '切换到浅色模式',
        darkModeSwitchTitle: '切换到深色模式',
        sidebarMenuLabel: '菜单',
        returnToTopLabel: '回到顶部',

        i18nRouting: true,
    },

    vite: {
        server: {
            port: Number(process.env.VITE_API_DOCS_PORT || 5173),
        },
        ssr: {
            // vitepress-mermaid-renderer 包含浏览器 API，SSR 时不打包
            noExternal: ['vitepress-mermaid-renderer'],
        },
    },

    markdown: {
        config: (md) => {
            // 渲染 GitHub 风格的 task list（- [ ] / - [x]）
            md.use(tasklist);
        },
    },
});
