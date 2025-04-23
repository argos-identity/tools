import { Request, Response, NextFunction } from 'express';
import { logErrorMiddleware } from '../../src/express/error-middleware';
import { logError } from '../../src/core/log-error';

// log-error 모듈 모킹
jest.mock('../../src/core/log-error', () => ({
  logError: jest.fn(),
}));

// RequestId 확장 인터페이스 정의
interface RequestWithId extends Request {
  requestId?: string;
}

describe('error-middleware', () => {
  let mockRequest: Partial<RequestWithId>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let mockError: Error;

  beforeEach(() => {
    // Request, Response, NextFunction 목 객체 생성
    mockRequest = {
      method: 'GET',
      originalUrl: '/api/test',
      headers: {
        'x-request-id': 'req-123',
      },
      requestId: 'req-123',
    };

    mockResponse = {};

    nextFunction = jest.fn();

    mockError = new Error('테스트 에러');

    // 모든 mock 초기화
    jest.clearAllMocks();
  });

  describe('logErrorMiddleware', () => {
    it('에러를 로깅해야 함', () => {
      logErrorMiddleware(mockError, mockRequest as Request, mockResponse as Response, nextFunction);

      // logError 함수가 올바른 인자로 호출되었는지 확인
      expect(logError).toHaveBeenCalledWith(
        expect.objectContaining({
          error: mockError,
          context: expect.objectContaining({
            xRequestId: 'req-123',
          }),
          request: expect.objectContaining({
            method: 'GET',
            url: '/api/test',
          }),
        }),
      );
    });

    it('next 함수에 에러를 전달해야 함', () => {
      logErrorMiddleware(mockError, mockRequest as Request, mockResponse as Response, nextFunction);

      // 에러가 next 함수로 전달되었는지 확인
      expect(nextFunction).toHaveBeenCalledWith(mockError);
    });

    it('요청 객체가 없어도 동작해야 함', () => {
      const nullRequest = null;

      logErrorMiddleware(
        mockError,
        nullRequest as unknown as Request,
        mockResponse as Response,
        nextFunction,
      );

      // 요청 객체 없이 logError 함수가 호출되었는지 확인
      expect(logError).toHaveBeenCalledWith({
        error: mockError,
        request: null,
      });

      expect(nextFunction).toHaveBeenCalledWith(mockError);
    });

    it('x-request-id가 없고 requestId는 있는 경우를 처리해야 함', () => {
      // x-request-id 없는 요청 객체
      const requestWithoutHeader = {
        method: 'GET',
        originalUrl: '/api/test',
        headers: {},
        requestId: 'custom-req-id',
      };

      logErrorMiddleware(
        mockError,
        requestWithoutHeader as unknown as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(logError).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            xRequestId: 'custom-req-id',
          }),
        }),
      );
    });

    it('x-request-id와 requestId가 모두 없는 경우를 처리해야 함', () => {
      // 식별자 없는 요청 객체
      const requestWithoutIds = {
        method: 'GET',
        originalUrl: '/api/test',
        headers: {},
      };

      logErrorMiddleware(
        mockError,
        requestWithoutIds as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(logError).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            xRequestId: undefined,
          }),
        }),
      );
    });
  });
});
