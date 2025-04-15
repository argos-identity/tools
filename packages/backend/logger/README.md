# @argos-identity/logger

백엔드 애플리케이션을 위한 공통 로깅 패키지입니다. Express와 AWS Lambda 환경을 모두 지원하며, 요청 추적, 에러 로깅, 성능 측정 등 다양한 기능을 제공합니다.

## 목차

- [설치 방법](#설치-방법)
- [기능 개요](#기능-개요)
- [기본 사용법](#기본-사용법)
- [Express 미들웨어](#express-미들웨어)
- [AWS Lambda 래퍼](#aws-lambda-래퍼)
- [고급 구성](#고급-구성)
- [환경 변수 설정](#환경-변수-설정)
- [타입스크립트 지원](#타입스크립트-지원)
- [트러블슈팅](#트러블슈팅)

## 설치 방법

```bash
# npm으로 설치
npm install @argos-identity/logger

# yarn으로 설치
yarn add @argos-identity/logger

# pnpm으로 설치
pnpm add @argos-identity/logger
```

## 기능 개요

- **통합 로깅 인터페이스**: winston 기반의 일관된 로깅 인터페이스 제공
- **요청 추적**: 고유한 request-id를 통한 분산 시스템에서의 요청 추적
- **자동 요청/응답 로깅**: HTTP 트랜잭션의 자동 로깅
- **구조화된 에러 로깅**: 컨텍스트와 함께 에러를 구조화하여 로깅
- **환경별 로깅 형식**: 개발 환경과 프로덕션 환경에 맞는 로깅 형식 제공
- **Express 및 Lambda 통합**: 주요 백엔드 환경과의 원활한 통합

## 기본 사용법

### 로거 직접 사용하기

로거는 [winston](https://github.com/winstonjs/winston) 기반으로 구현되어 있으며, 다양한 로그 레벨을 지원합니다.

```javascript
const { logger } = require('@argos-identity/logger');

// 다양한 로그 레벨 사용
logger.debug('디버그 로그 메시지'); // 개발 환경에서만 출력됨
logger.info('정보 로그 메시지'); // 일반적인 정보 로깅
logger.warn('경고 로그 메시지'); // 경고 상황 로깅
logger.error('에러 로그 메시지', { error: new Error('에러 발생') }); // 에러 상황 로깅

// 메타데이터와 함께 로깅 (구조화된 로깅)
logger.info('사용자 로그인', {
  userId: 'user-123',
  loginAt: new Date().toISOString(),
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
});
```

### 에러 로깅 유틸리티

표준화된 형식으로 에러를 로깅할 수 있는 유틸리티를 제공합니다.

```javascript
const { logError } = require('@argos-identity/logger');

try {
  // 에러가 발생할 수 있는 코드
} catch (error) {
  logError({
    error, // 에러 객체
    context: {
      // 추가 컨텍스트 정보
      userId: 'user-123',
      operation: 'processPayment',
      parameters: { amount: 1000 },
    },
    request: req, // (선택사항) Express 요청 객체
  });
}
```

## Express 미들웨어

### 요청 ID 미들웨어

모든 요청에 고유한 x-request-id를 추가하여 요청 추적을 용이하게 합니다. 클라이언트에서 x-request-id를 제공하면 해당 ID를 사용하고, 그렇지 않으면 새로운 UUID를 생성합니다.

```javascript
const express = require('express');
const { requestId, logRequestMiddleware } = require('@argos-identity/logger');

const app = express();

// 요청 ID 미들웨어를 가장 먼저 적용
app.use(requestId);

// 기본 미들웨어 설정
app.use(express.json());
app.use(logRequestMiddleware);

// 라우터 설정
app.use('/api', apiRouter);
```

### 요청 로깅 미들웨어

모든 HTTP 요청과 응답을 자동으로 로깅합니다. 요청 메서드, URL, 상태 코드, 응답 시간, 요청/응답 본문 등의 정보를 포함합니다.

```javascript
const express = require('express');
const { logRequestMiddleware } = require('@argos-identity/logger');

const app = express();

// 요청 본문 파싱 후에 미들웨어 적용
app.use(express.json());
app.use(logRequestMiddleware);

// 라우터 설정
app.use('/api', apiRouter);
```

### 에러 로깅 미들웨어

애플리케이션에서 발생하는 에러를 자동으로 로깅합니다. 에러 스택 트레이스와 요청 정보를 함께 로깅하여 디버깅을 용이하게 합니다.

```javascript
const express = require('express');
const { logRequestMiddleware, logErrorMiddleware } = require('@argos-identity/logger');

const app = express();

// 기본 미들웨어 설정
app.use(express.json());
app.use(logRequestMiddleware);

// 라우터 설정
app.use('/api', apiRouter);

// 에러 로깅 미들웨어는 다른 라우터 뒤에 설정
app.use(logErrorMiddleware);

// 에러 처리 미들웨어
app.use((err, req, res, next) => {
  res.status(500).json({ error: '서버 오류가 발생했습니다.' });
});
```

## AWS Lambda 래퍼

Lambda 핸들러를 래핑하여 요청과 응답을 자동으로 로깅합니다. API Gateway 이벤트를 감지하여 HTTP 트랜잭션 정보를 로깅하고, 요청 ID를 처리합니다.

```javascript
const { withLogger } = require('@argos-identity/logger');

// 일반적인 Lambda 핸들러
const handler = async (event, context) => {
  // 핸들러 로직
  context.logger.info('사용자 요청 처리 중', {
    userId: event.requestContext?.authorizer?.claims?.sub,
  });

  // 비즈니스 로직 수행
  const result = await processRequest(event);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: '성공', data: result }),
  };
};

// 로깅을 추가한 핸들러로 내보내기
exports.lambdaHandler = withLogger(handler);
```

### Lambda에서 로거 사용하기

Lambda 컨텍스트에서 로거 인스턴스에 접근할 수 있습니다:

```javascript
const myHandler = async (event, context) => {
  // context.logger를 통해 로거에 접근
  context.logger.info('Lambda 함수 실행 중', { event });

  // 비즈니스 로직

  return { statusCode: 200 };
};

exports.handler = withLogger(myHandler);
```

## 고급 구성

### 커스텀 로거 인스턴스 생성

특정 요구사항에 맞춘 로거 인스턴스를 생성할 수 있습니다:

```javascript
const { createLoggerInstance } = require('@argos-identity/logger');

// 커스텀 로거 생성
const customLogger = createLoggerInstance({
  level: 'debug', // 로그 레벨 설정
  format: 'simple', // 형식 설정 ('json' 또는 'simple')
  silent: process.env.NODE_ENV === 'test', // 테스트 환경에서 로깅 비활성화
});

// 커스텀 로거 사용
customLogger.info('커스텀 로거 메시지');
```

## 환경 변수 설정

다음 환경 변수를 통해 로거 동작을 제어할 수 있습니다:

| 환경 변수    | 설명                                                    | 기본값        |
| ------------ | ------------------------------------------------------- | ------------- |
| `LOG_LEVEL`  | 로그 레벨 (`error`, `warn`, `info`, `debug`)            | `info`        |
| `LOG_FORMAT` | 로그 형식 (`json` 또는 `simple`)                        | `json`        |
| `NODE_ENV`   | 애플리케이션 환경 (`development`, `production`, `test`) | `development` |

### 로그 레벨

- `error`: 오류 메시지만 로깅 (최소한의 로깅)
- `warn`: 경고 및 오류 메시지 로깅
- `info`: 정보, 경고, 오류 메시지 로깅 (기본값)
- `debug`: 디버그, 정보, 경고, 오류 메시지 로깅 (매우 상세한 로깅)

### 로그 형식

- `json`: JSON 형식으로 로깅 (프로덕션 환경에 적합, 로그 수집 시스템과 통합 시 권장)
- `simple`: 가독성 높은 텍스트 형식으로 로깅 (개발 환경에 적합)

## 타입스크립트 지원

이 패키지는 TypeScript로 작성되었으며 타입 정의를 함께 제공합니다.

```typescript
import {
  logger,
  logError,
  requestId,
  logRequestMiddleware,
  withLogger,
} from '@argos-identity/logger';

// TypeScript에서 타입 안전하게 사용 가능
interface UserContext {
  userId: string;
  role: string;
}

logger.info('사용자 정보', { user: { id: '123', name: 'John' } as UserContext });
```

## 트러블슈팅

### 로그가 출력되지 않는 경우

1. `LOG_LEVEL` 환경 변수를 확인하세요. 로그 레벨이 `error`로 설정되어 있다면 `info` 로그는 출력되지 않습니다.
2. `silent` 옵션이 활성화되어 있지 않은지 확인하세요.

### AWS Lambda에서 로그가 중복되는 경우

AWS Lambda는 기본적으로 `console.log`를 CloudWatch에 출력합니다. 이 패키지의 로깅과 중복될 수 있습니다.
필요한 경우 환경 변수로 로그 레벨을 조정하세요.

### Express에서 요청 ID가 생성되지 않는 경우

요청 ID 미들웨어가 다른 미들웨어보다 먼저 적용되어야 합니다:

```javascript
app.use(requestId); // 가장 먼저 적용
app.use(express.json());
app.use(logRequestMiddleware);
```
