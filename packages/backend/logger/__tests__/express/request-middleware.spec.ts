import { Request, Response, NextFunction } from 'express';
import { logRequestMiddleware } from '../../src/express/request-middleware';
import * as logRequest from '../../src/core/log-request';

// log-request 모듈 모킹
jest.mock('../../src/core/log-request', () => ({
  logHttpTransaction: jest.fn(),
}));

// RequestId 확장 인터페이스 정의
interface RequestWithId extends Request {
  requestId?: string;
}

describe('request-middleware', () => {
  let mockRequest: Partial<RequestWithId>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let responseStatusCode: number;

  // 콜백 저장 변수
  let finishCallback: (...args: any[]) => void;

  beforeEach(() => {
    // Date.now 모킹
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);

    // Request, Response, NextFunction 목 객체 생성
    responseStatusCode = 200;
    mockRequest = {
      method: 'GET',
      originalUrl: '/api/test',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
      },
      body: { test: 'data' },
      requestId: 'req-123',
    };

    // on 메서드 모킹
    mockResponse = {
      statusCode: responseStatusCode,
      on: jest.fn().mockImplementation((event: string, cb: any) => {
        if (event === 'finish') {
          finishCallback = cb;
        }
        return mockResponse;
      }),
    };

    nextFunction = jest.fn();

    // 모든 mock 초기화
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('logRequestMiddleware', () => {
    it('미들웨어가 next()를 호출해야 함', () => {
      logRequestMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('finish 이벤트에서 HTTP 트랜잭션 로깅', () => {
      // Date.now가 두 번째 호출시 다른 값 반환하도록 설정
      (Date.now as jest.Mock).mockReturnValueOnce(1000).mockReturnValueOnce(1100);

      // 미들웨어 실행
      logRequestMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // finish 이벤트 리스너가 등록되었는지 확인
      expect(mockResponse.on).toHaveBeenCalledWith('finish', expect.any(Function));

      // finish 콜백 호출
      finishCallback();

      // logHttpTransaction이 올바른 인자로 호출되었는지 확인
      expect(logRequest.logHttpTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/api/test',
          statusCode: 200,
          durationMs: 100,
          requestId: 'req-123',
        }),
      );
    });

    it('요청 ID 헤더가 있고 requestId 속성이 없는 경우를 처리해야 함', () => {
      // requestId 속성 제거, 헤더로 대체
      delete mockRequest.requestId;
      if (mockRequest.headers) {
        mockRequest.headers['x-request-id'] = 'header-req-id';
      }

      // Date.now 모킹
      (Date.now as jest.Mock).mockReturnValueOnce(1000).mockReturnValueOnce(1100);

      // 미들웨어 실행
      logRequestMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // finish 콜백 호출
      finishCallback();

      // x-request-id 헤더가 사용되었는지 확인
      expect(logRequest.logHttpTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'header-req-id',
        }),
      );
    });

    it('요청 ID가 전혀 없는 경우를 처리해야 함', () => {
      // 모든 요청 ID 제거
      delete mockRequest.requestId;
      if (mockRequest.headers) {
        delete mockRequest.headers['x-request-id'];
      }

      // Date.now 모킹
      (Date.now as jest.Mock).mockReturnValueOnce(1000).mockReturnValueOnce(1100);

      // 미들웨어 실행
      logRequestMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // finish 콜백 호출
      finishCallback();

      // requestId가 undefined인지 확인
      expect(logRequest.logHttpTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: undefined,
        }),
      );
    });
  });
});
