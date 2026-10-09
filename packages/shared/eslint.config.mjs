import base from '@whats-new/eslint-config';
export default [...base, { files: ['src/**/*.ts'], rules: { 'no-restricted-imports': ['error', { patterns: ['node:*', '@whats-new/config', '@whats-new/database', '@whats-new/ai', '@whats-new/source-providers', '@prisma/*'] }] } }];
