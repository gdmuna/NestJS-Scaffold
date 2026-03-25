import { PrismaClient } from './generated/client.js';

// import { DATABASE_URL } from '@/constants/index.js';

import { parseArgs } from 'node:util';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 12,
    min: 2, // 最小保持 2 个连接
    idleTimeoutMillis: 30000, // 30秒空闲超时
    connectionTimeoutMillis: 2000, // 2秒连接超时
});

const prisma = new PrismaClient({ adapter });

const options = {
    environment: { type: 'string' },
} as const;

async function _seedForDevelopment() {
    const tasks: Promise<any>[] = [];
    for (let i = 0; i < 10; i++) {
        tasks.push(
            prisma.user.create({
                data: {
                    username: `user${i}`,
                    email: `user${i}@example.com`,
                    passwordHash: await bcrypt.hash('password', 10),
                },
            })
        );
    }
    await Promise.all(tasks);
}

async function main() {
    const {
        values: { environment = 'development' },
    } = parseArgs({ options });

    switch (environment) {
        case 'development':
            await _seedForDevelopment();
            break;
        case 'test':
            break;
        default:
            console.warn(`未知环境：${environment}\n跳过数据填充操作`);
            break;
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
