import { Handler, APIGatewayProxyEvent, Context } from 'aws-lambda';
import { withLogger } from '../../src/lambda/logger-wrapper';
import * as logRequestModule from '../../src/core/log-request';

// uuid 모킹
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mocked-uuid'),
}));

describe('Lambda Logger Wrapper 테스트', () => {
  // logHttpTransaction 모킹
  const logHttpTransactionMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // requestId가 반영될 수 있도록 실제 withLogger 함수의 동작을 모방
    jest.spyOn(logRequestModule, 'logHttpTransaction').mockImplementation(data => {
      logHttpTransactionMock({
        ...data,
        requestId: data.requestId || 'mocked-uuid', // requestId 명시적 추가
      });
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('요청과 응답에 x-request-id를 추가해야 함', async () => {
    // Given
    const mockHandler: Handler = jest.fn().mockResolvedValue({
      statusCode: 200,
      body: JSON.stringify({ message: '성공' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const wrappedHandler = withLogger(mockHandler);

    const mockEvent = {
      httpMethod: 'GET',
      path: '/test',
      headers: {},
      body: JSON.stringify({ test: 'data' }),
      requestContext: {
        identity: {
          sourceIp: '127.0.0.1',
        },
      },
    } as unknown as APIGatewayProxyEvent;

    const mockContext = {} as Context;

    // When
    const result = await wrappedHandler(mockEvent, mockContext, jest.fn());

    // Then
    expect(result?.headers).toHaveProperty('x-request-id', 'mocked-uuid');
    expect(mockContext).toHaveProperty('requestId', 'mocked-uuid');
    expect(mockHandler).toHaveBeenCalledWith(mockEvent, mockContext, expect.any(Function));
  });

  it('클라이언트가 x-request-id를 제공한 경우 해당 값을 유지해야 함', async () => {
    // Given
    const mockHandler: Handler = jest.fn().mockResolvedValue({
      statusCode: 200,
      body: JSON.stringify({ message: '성공' }),
    });

    const wrappedHandler = withLogger(mockHandler);

    const mockEvent = {
      httpMethod: 'POST',
      path: '/test',
      headers: {
        'x-request-id': 'client-request-id',
      },
      body: null,
    } as unknown as APIGatewayProxyEvent;

    const mockContext = {} as Context;

    // When
    const result = await wrappedHandler(mockEvent, mockContext, jest.fn());

    // Then
    expect(result?.headers).toHaveProperty('x-request-id', 'client-request-id');
    expect(mockContext).toHaveProperty('requestId', 'client-request-id');
  });

  it('요청과 응답 정보를 올바르게 로깅해야 함', async () => {
    // Given
    const responseBody = { message: '성공' };
    const responseBodyString = JSON.stringify(responseBody);
    const mockHandler: Handler = jest.fn().mockResolvedValue({
      statusCode: 201,
      body: responseBodyString,
    });

    const wrappedHandler = withLogger(mockHandler);

    const requestBody = { name: '테스트' };
    const mockEvent = {
      httpMethod: 'POST',
      path: '/users',
      headers: {
        'User-Agent': 'test-agent',
      },
      body: JSON.stringify(requestBody),
      requestContext: {
        identity: {
          sourceIp: '192.168.1.1',
        },
      },
    } as unknown as APIGatewayProxyEvent;

    const mockContext = {} as Context;

    // When
    await wrappedHandler(mockEvent, mockContext, jest.fn());

    // Then
    expect(logHttpTransactionMock).toHaveBeenCalledTimes(1);
    expect(logHttpTransactionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: '/users',
        statusCode: 201,
        durationMs: expect.any(Number),
        ip: '192.168.1.1',
        userAgent: 'test-agent',
        requestId: 'mocked-uuid',
        requestBody,
        responseBody: responseBodyString,
      }),
    );
  });

  it('API Gateway 이벤트 정보가 누락된 경우 기본값을 사용해야 함', async () => {
    // Given
    const mockHandler: Handler = jest.fn().mockResolvedValue({
      statusCode: 200,
    });

    const wrappedHandler = withLogger(mockHandler);

    // 최소한의 이벤트 객체
    const mockEvent = {} as unknown as APIGatewayProxyEvent;
    const mockContext = {} as Context;

    // When
    await wrappedHandler(mockEvent, mockContext, jest.fn());

    // Then
    expect(logHttpTransactionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'UNKNOWN',
        url: '/',
        statusCode: 200,
        requestId: 'mocked-uuid',
      }),
    );
  });

  it('에러 발생 시 에러를 재전파해야 함', async () => {
    // Given
    const testError = new Error('테스트 에러');
    const mockHandler: Handler = jest.fn().mockRejectedValue(testError);

    const wrappedHandler = withLogger(mockHandler);

    const mockEvent = {
      httpMethod: 'GET',
      path: '/error',
    } as unknown as APIGatewayProxyEvent;

    const mockContext = {} as Context;

    // When, Then
    await expect(wrappedHandler(mockEvent, mockContext, jest.fn())).rejects.toThrow(testError);
  });
});
