import { Request, Response, NextFunction } from 'express';
import { logError } from '../core/log-error';

/**
 * Express 에러 로깅 미들웨어
 * app.use(express.json())와 같은 미들웨어 다음, 라우터 이전에 등록해야 합니다.
 * @example
 * app.use(express.json());
 * app.use(logErrorMiddleware);
 * app.use('/api', apiRouter);
 */
export const logErrorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // 요청 객체가 없을 경우 처리
  if (!req) {
    logError({
      error: err,
      request: null,
    });
    next(err);
    return;
  }

  logError({
    error: err,
    context: {
      xRequestId: (req?.headers?.['x-request-id'] as string) || (req as any)?.requestId,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
    },
  });

  next(err);
};
