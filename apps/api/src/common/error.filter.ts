import { Catch, HttpException, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';
@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const messages: Record<number, string> = { 400: 'Invalid request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not found', 409: 'Conflict', 422: 'Invalid input', 429: 'Too many requests', 503: 'Service unavailable' };
    response.status(status).json({ error: {
      code: status === 503 ? 'DEPENDENCY_UNAVAILABLE' : `HTTP_${status}`,
      message: messages[status] ?? 'Internal server error', requestId: request.headers['x-request-id'],
    } });
  }
}
