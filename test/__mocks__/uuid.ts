import { randomUUID } from 'crypto';

// Jest CJS shim for the 'uuid' pure-ESM package.
// Unit tests only need the function to return a valid string;
// the actual UUID version doesn't matter here.
export const v7 = (): string => randomUUID();
