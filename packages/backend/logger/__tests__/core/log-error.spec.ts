import { logError } from '../../src/core/log-error';
import logger from '../../src/core/logger-instance';

// 로거 모킹
jest.mock('../../src/core/logger-instance', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}));

describe('log-error', () => {
  beforeEach(() => {
    // 모든 모킹 초기화
    jest.clearAllMocks();
  });

  describe('logError', () => {
    it('에러를 로깅해야 함', () => {
      // 가상의 에러 객체 생성
      const testError = new Error('테스트 에러');

      // 로그 함수 호출
      logError({
        error: testError,
      });

      // 로거가 올바른 인자로 호출되었는지 확인
      expect(logger.error).toHaveBeenCalledWith(
        'Application Error',
        expect.objectContaining({
          message: '테스트 에러',
          name: 'Error',
          stack: expect.any(String),
        }),
      );
    });

    it('컨텍스트 정보와 함께 에러를 로깅해야 함', () => {
      const testError = new Error('테스트 에러');
      const testContext = {
        userId: 'user-123',
        operation: 'testOperation',
      };

      logError({
        error: testError,
        context: testContext,
      });

      expect(logger.error).toHaveBeenCalledWith(
        'Application Error',
        expect.objectContaining({
          message: '테스트 에러',
          context: testContext,
        }),
      );
    });

    it('요청 정보와 함께 에러를 로깅해야 함', () => {
      const testError = new Error('테스트 에러');
      const testRequest = {
        method: 'GET',
        url: '/test',
      };

      logError({
        error: testError,
        request: testRequest,
      });

      expect(logger.error).toHaveBeenCalledWith(
        'Application Error',
        expect.objectContaining({
          message: '테스트 에러',
          request: testRequest,
        }),
      );
    });
  });
});
