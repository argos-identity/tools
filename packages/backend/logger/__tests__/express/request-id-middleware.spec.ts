import { Request, Response, NextFunction } from 'express';
import { requestIdMiddleware } from '../../src/express/request-id-middleware';
import { v4 as uuidv4 } from 'uuid';

// uuid 모듈 모킹
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid'),
}));

describe('request-id-middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    // Request, Response, NextFunction 목 객체 생성
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      setHeader: jest.fn(),
    };
    nextFunction = jest.fn();

    // 모든 mock 초기화
    jest.clearAllMocks();
  });

  describe('requestId', () => {
    it('요청 헤더에 x-request-id가 없으면 새로운 UUID를 생성해야 함', () => {
      requestIdMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // 새로운 UUID가 생성되었는지 확인
      expect(uuidv4).toHaveBeenCalled();

      // UUID가 응답 헤더와 요청 객체에 설정되었는지 확인
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-request-id', 'test-uuid');
      expect((mockRequest as any).requestId).toBe('test-uuid');

      // next 함수가 호출되었는지 확인
      expect(nextFunction).toHaveBeenCalled();
    });

    it('요청 헤더에 x-request-id가 있으면 해당 ID를 사용해야 함', () => {
      const existingRequestId = 'existing-request-id';
      mockRequest.headers = {
        'x-request-id': existingRequestId,
      };

      requestIdMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // UUID 생성 함수가 호출되지 않아야 함
      expect(uuidv4).not.toHaveBeenCalled();

      // 기존 ID가 응답 헤더와 요청 객체에 설정되었는지 확인
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-request-id', existingRequestId);
      expect((mockRequest as any).requestId).toBe(existingRequestId);

      // next 함수가 호출되었는지 확인
      expect(nextFunction).toHaveBeenCalled();
    });

    it('대소문자 상관없이 x-request-id를 인식해야 함', () => {
      const existingRequestId = 'existing-request-id';
      mockRequest.headers = {
        'X-REQUEST-ID': existingRequestId,
      };

      requestIdMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-request-id', existingRequestId);
      expect((mockRequest as any).requestId).toBe(existingRequestId);
    });
  });
});
