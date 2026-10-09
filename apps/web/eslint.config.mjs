import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
export default defineConfig([...nextVitals, ...nextTs, { files: ['src/**/*.{ts,tsx}'], rules: { 'no-restricted-imports': ['error', { patterns: ['@whats-new/database', '@whats-new/database/*', '@whats-new/ai', '@whats-new/ai/*', '@whats-new/source-providers', '@whats-new/source-providers/*', '@whats-new/config', 'openai', 'bullmq', 'ioredis', 'pg', '@prisma/*'] }] } }, globalIgnores(['.next/**', 'next-env.d.ts'])]);
