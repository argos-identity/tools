import { logHttpTransaction } from '../../src/core/log-request';
import logger from '../../src/core/logger-instance';

// 로거 모킹
jest.mock('../../src/core/logger-instance', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('log-request', () => {
  beforeEach(() => {
    // 모든 모킹 초기화
    jest.clearAllMocks();
  });

  describe('logHttpTransaction', () => {
    it('성공적인 요청을 info 레벨로 로깅해야 함', () => {
      const transaction = {
        method: 'GET',
        url: '/api/test',
        statusCode: 200,
        durationMs: 50,
        requestId: 'req-123',
      };

      logHttpTransaction(transaction);

      expect(logger.info).toHaveBeenCalledWith(
        'HTTP Transaction',
        expect.objectContaining({
          method: 'GET',
          url: '/api/test',
          statusCode: 200,
          durationMs: 50,
          requestId: 'req-123',
        }),
      );
    });

    it('4xx 상태 코드를 warn 레벨로 로깅해야 함', () => {
      const transaction = {
        method: 'POST',
        url: '/api/test',
        statusCode: 404,
        durationMs: 30,
        requestId: 'req-123',
      };

      logHttpTransaction(transaction);

      expect(logger.warn).toHaveBeenCalledWith(
        'HTTP Transaction',
        expect.objectContaining({
          method: 'POST',
          url: '/api/test',
          statusCode: 404,
        }),
      );
    });

    it('5xx 상태 코드를 error 레벨로 로깅해야 함', () => {
      const transaction = {
        method: 'PUT',
        url: '/api/test',
        statusCode: 500,
        durationMs: 100,
        requestId: 'req-123',
      };

      logHttpTransaction(transaction);

      expect(logger.error).toHaveBeenCalledWith(
        'HTTP Transaction',
        expect.objectContaining({
          method: 'PUT',
          url: '/api/test',
          statusCode: 500,
        }),
      );
    });

    it('요청/응답 본문을 함께 로깅해야 함', () => {
      const transaction = {
        method: 'POST',
        url: '/api/test',
        statusCode: 201,
        durationMs: 75,
        requestId: 'req-123',
        requestBody: { name: '테스트' },
        responseBody: JSON.stringify({ id: 1, name: '테스트' }),
      };

      logHttpTransaction(transaction);

      expect(logger.info).toHaveBeenCalledWith(
        'HTTP Transaction',
        expect.objectContaining({
          requestBody: { name: '테스트' },
          responseBody: JSON.stringify({ id: 1, name: '테스트' }),
        }),
      );
    });
  });
});
