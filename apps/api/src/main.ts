import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { loadRootEnv, readEnvironment, log } from '@whats-new/config';
import { AppModule } from './app.module.js';
import { ApiErrorFilter } from './common/error.filter.js';

loadRootEnv();
const env = readEnvironment();
if (env.AUTH_MODE !== 'dev') throw new Error('Session authentication is not implemented in M0');
const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
app.setGlobalPrefix('api/v1');
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
app.useGlobalFilters(new ApiErrorFilter());
app.use((request: Request, response: Response, next: NextFunction) => {
  const requestId = randomUUID();
  request.headers['x-request-id'] = requestId;
  response.setHeader('x-request-id', requestId);
  const start = performance.now();
  response.on('finish', () => log('http.completed', { requestId, method: request.method, status: response.statusCode, durationMs: Math.round(performance.now() - start) }));
  const origin = request.headers.origin;
  if (origin && origin !== env.WEB_ORIGIN) {
    response.status(403).json({ error: { code: 'ORIGIN_FORBIDDEN', message: 'Forbidden origin', requestId } });
    return;
  }
  next();
});
app.enableCors({ origin: env.WEB_ORIGIN, credentials: true });
app.enableShutdownHooks();
await app.listen(env.API_PORT, '127.0.0.1');
log('api.started', { port: env.API_PORT });
