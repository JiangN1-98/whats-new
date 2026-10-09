import type { NextConfig } from 'next';
import { loadRootEnv } from '@whats-new/config';
loadRootEnv();
const config: NextConfig = { output: 'standalone', poweredByHeader: false, allowedDevOrigins: ['127.0.0.1'] };
export default config;
