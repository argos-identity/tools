// logger/express/request-middleware.ts
import { Request, Response, NextFunction } from 'express';
import { logHttpTransaction } from '../core/log-request';

/**
 * HTTP 요청/응답을 로깅하는 미들웨어
 */
export const logRequestMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  // 응답 완료 시 로깅
  res.on('finish', () => {
    logHttpTransaction({
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
      requestId: (req as any).requestId || (req.headers['x-request-id'] as string),
      requestBody: req.body,
      responseBody: undefined, // responseBody 캡처는 생략
    });
  });

  next();
};
