import _package_info from '@root/package.json' with { type: 'json' };

export const PACKAGE_INFO = _package_info;

export const APP_VERSION = process.env.APP_VERSION || PACKAGE_INFO.version || 'unknown';

export const APP_NAME = process.env.APP_NAME || PACKAGE_INFO.name || 'unknown';
