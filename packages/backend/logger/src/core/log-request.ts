import logger from './logger-instance';
/**
 * HTTP 트랜잭션 로깅을 위한 인터페이스
 */
export interface HttpTransactionLogData {
  method: string;
  url: string;
  statusCode: number;
  durationMs: number;
  ip?: string;
  userAgent?: string;
  requestBody?: any;
  responseBody?: any;
  traceId?: string;
  userId?: string;
  [key: string]: any;
}

/**
 * HTTP 요청과 응답을 로깅하는 함수
 * @param data 로깅할 HTTP 트랜잭션 데이터
 */
export const logHttpTransaction = (data: HttpTransactionLogData): void => {
  const statusCode = data.statusCode;
  const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

  const logData = {
    timestamp: new Date().toISOString(),
    ...data,
  };

  // 로그 기록
  if (logLevel === 'error') {
    logger.error('HTTP Transaction', logData);
  } else if (logLevel === 'warn') {
    logger.warn('HTTP Transaction', logData);
  } else {
    logger.info('HTTP Transaction', logData);
  }
};
