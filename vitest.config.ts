import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [swc.vite()],
    resolve: {
        tsconfigPaths: true,
    },
    esbuild: false,
    oxc: false,
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
            exclude: ['src/**/*.spec.ts', 'src/**/*.e2e-spec.ts', 'src/main.ts'],
        },
    },
});
