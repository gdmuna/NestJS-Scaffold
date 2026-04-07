import { defineConfig } from 'vitepress';

export default defineConfig({
    title: 'NestJS Demo Basic',
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

    // README.md 作为根目录入口
    rewrites: {
        'README.md': 'index.md',
    },

    themeConfig: {
        nav: [
            { text: '文档', link: '/' },
            {
                text: 'API Reference',
                // 本地开发默认指向 backend dev server；Dockerfile 构建时通过 ARG VITE_API_REFERENCE_URL 覆盖
                link: process.env.VITE_API_REFERENCE_URL ?? 'http://localhost:3000/reference',
                target: '_blank',
            },
            {
                text: 'GitHub',
                link: 'https://github.com/gdmuna/nestjs-demo-basic',
            },
        ],

        sidebar: [
            {
                text: '指南',
                items: [{ text: '贡献指南', link: '/01-guides/contributing' }],
            },
            {
                text: '架构设计',
                items: [
                    {
                        text: '项目架构全览',
                        link: '/02-architecture/project-architecture-overview',
                    },
                    { text: '认证模块', link: '/02-architecture/auth-module' },
                    { text: '请求管道', link: '/02-architecture/request-pipeline' },
                    { text: '数据库', link: '/02-architecture/database' },
                    { text: '异常系统', link: '/02-architecture/exception-system' },
                    { text: '可观测性', link: '/02-architecture/observability' },
                    { text: 'OpenAPI 增强', link: '/02-architecture/openapi-enrichment' },
                    { text: '路由装饰器', link: '/02-architecture/route-decorator' },
                    { text: 'CI/CD 部署', link: '/02-architecture/cicd-deployment' },
                ],
            },
            {
                text: '参考',
                items: [
                    { text: 'API Reference', link: '/03-reference/api-reference' },
                    { text: '错误码参考', link: '/03-reference/error-reference' },
                ],
            },
            {
                text: '规划',
                items: [
                    { text: 'PR 0.7.0', link: '/04-planning/pr-0.7.0.md' },
                    { text: 'PR 0.7.1', link: '/04-planning/pr-0.7.1.md' },
                    { text: 'PR 0.7.2', link: '/04-planning/pr-0.7.2.md' },
                    { text: 'PR 0.7.3', link: '/04-planning/pr-0.7.3.md' },
                    { text: '路线图', link: '/04-planning/roadmap' },
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
            message: 'Released under the MIT License.',
            copyright: `Copyright © ${new Date().getFullYear()} NestJS Demo Basic`,
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
});
