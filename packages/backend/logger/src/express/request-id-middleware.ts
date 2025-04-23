import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * x-request-id 미들웨어
 * 클라이언트 요청에 x-request-id 헤더가 있으면 사용
 * 없는 경우 UUID를 생성하여 새로운 x-request-id 생성
 * 응답에도 동일한 x-request-id를 포함시킴
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const headerKey = Object.keys(req.headers).find(key => key.toLowerCase() === 'x-request-id');
  const requestId = headerKey ? (req.headers[headerKey] as string) : uuidv4();
  (req as any).requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};
