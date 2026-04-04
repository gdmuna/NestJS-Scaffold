import { appConfig, AppConfig } from './app.constant.js';
import { databaseConfig, DatabaseConfig } from './database.constant.js';
import { authConfig, AuthConfig } from './auth.constant.js';
import { observabilityConfig, ObservabilityConfig } from './observability.constant.js';

// 导出所有配置

export type AllConfig = {
    app: AppConfig;
    database: DatabaseConfig;
    auth: AuthConfig;
    observability: ObservabilityConfig;
};

export const allConfig = {
    appConfig,
    databaseConfig,
    authConfig,
    observabilityConfig,
};

export default [...Object.values(allConfig)];

export * from './app.constant.js';
export * from './auth.constant.js';
export * from './database.constant.js';
export * from './observability.constant.js';
export * from './error.constant.js';
