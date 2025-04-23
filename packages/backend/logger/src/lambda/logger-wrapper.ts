// logger/lambda/logger-wrapper.ts
import { Handler, APIGatewayProxyEvent } from 'aws-lambda';
import { logHttpTransaction } from '../core/log-request';
import { v4 as uuidv4 } from 'uuid';

/**
 * Lambda 핸들러를 래핑하여 요청과 응답을 로깅하고 x-request-id를 처리
 * @param handler 원본 Lambda 핸들러
 * @returns 로깅 기능이 추가된 핸들러
 */
export const withLogger = (handler: Handler): Handler => {
  return async (event, context, callback) => {
    const start = Date.now();

    const apiGatewayEvent = event as APIGatewayProxyEvent;
    const headers = apiGatewayEvent.headers || {};

    const requestIdHeaderKey = Object.keys(headers).find(
      key => key.toLowerCase() === 'x-request-id',
    );

    const requestId = requestIdHeaderKey ? headers[requestIdHeaderKey] : uuidv4();

    (context as any).requestId = requestId;

    try {
      let result = await handler(event, context, callback);

      if (result && typeof result === 'object') {
        result = {
          ...result,
          headers: {
            ...(result.headers || {}),
            'x-request-id': requestId,
          },
        };
      }

      logHttpTransaction({
        method: apiGatewayEvent.httpMethod || 'UNKNOWN',
        url: apiGatewayEvent.path || '/',
        statusCode: result?.statusCode ?? 200,
        durationMs: Date.now() - start,
        ip: apiGatewayEvent.requestContext?.identity?.sourceIp,
        userAgent:
          apiGatewayEvent.headers?.['User-Agent'] || apiGatewayEvent.headers?.['user-agent'],
        requestId: requestId,
        requestBody: apiGatewayEvent.body && JSON.parse(apiGatewayEvent.body),
        responseBody: result?.body,
      });

      return result;
    } catch (error) {
      throw error;
    }
  };
};
