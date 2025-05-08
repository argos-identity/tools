# @argos-identity/logger

[![npm version](https://img.shields.io/npm/v/@argos-identity/logger.svg)](https://www.npmjs.com/package/@argos-identity/logger)

백엔드 애플리케이션을 위한 공통 로깅 패키지입니다. Express와 AWS Lambda 환경을 모두 지원하며, 요청 추적, 에러 로깅, 성능 측정 등 다양한 기능을 제공합니다.

## 목차

- [설치 방법](#설치-방법)
- [패키지 개요](#패키지-개요)
  - [주요 기능](#주요-기능)
  - [구조](#구조)
- [기본 사용법](#기본-사용법)
  - [로거 직접 사용](#로거-직접-사용)
  - [에러 로깅 유틸리티](#에러-로깅-유틸리티)
- [Express 통합](#express-통합)
  - [요청 ID 미들웨어](#요청-id-미들웨어)
  - [요청 로깅 미들웨어](#요청-로깅-미들웨어)
  - [에러 로깅 미들웨어](#에러-로깅-미들웨어)
  - [전체 미들웨어 설정 예시](#전체-미들웨어-설정-예시)
- [AWS Lambda 통합](#aws-lambda-통합)
  - [Lambda 래퍼 사용법](#lambda-래퍼-사용법)
  - [로깅 컨텍스트 활용](#로깅-컨텍스트-활용)
- [고급 설정](#고급-설정)
  - [커스텀 로거 인스턴스](#커스텀-로거-인스턴스)
  - [로거 형식 변경](#로거-형식-변경)
- [환경 변수 설정](#환경-변수-설정)
- [트러블슈팅](#트러블슈팅)
- [개발 가이드](#개발-가이드)

## 설치 방법

```bash
# npm으로 설치
npm install @argos-identity/logger

# yarn으로 설치
yarn add @argos-identity/logger

# pnpm으로 설치
pnpm add @argos-identity/logger
```

## 패키지 개요

### 주요 기능

이 패키지는 다음과 같은 주요 기능을 제공합니다:

- **통합 로깅 인터페이스**: Winston 기반의 일관된 로깅 인터페이스
- **요청 추적**: 고유한 request-id를 통한 분산 시스템에서의 요청 추적
- **자동 요청/응답 로깅**: HTTP 트랜잭션의 자동 로깅
- **구조화된 에러 로깅**: 컨텍스트와 함께 에러를 구조화하여 로깅
- **환경별 로깅 형식**: 개발 환경과 프로덕션 환경에 맞는 로깅 형식
- **Express 및 Lambda 통합**: 주요 백엔드 환경과의 원활한 통합

### 구조

패키지는 다음과 같은 모듈로 구성되어 있습니다:

- **core**: 기본 로깅 기능(로거 인스턴스, 에러 로깅, 요청 로깅)
- **express**: Express 통합 모듈(미들웨어)
- **lambda**: AWS Lambda 통합 모듈(래퍼 함수)

각 모듈은 하위 경로로 직접 임포트할 수 있습니다:

```typescript
// 기본 로거(전체 API)
import { logger } from '@argos-identity/logger';

// 특정 모듈만 임포트
import { createLoggerInstance } from '@argos-identity/logger/core';
import { requestId } from '@argos-identity/logger/express';
import { withLogger } from '@argos-identity/logger/lambda';
```

## 기본 사용법

### 로거 직접 사용

기본 로거 인스턴스를 직접 사용하여 다양한 레벨의 로깅을 수행할 수 있습니다:

```javascript
const { logger } = require('@argos-identity/logger');

// 다양한 로그 레벨 사용
logger.debug('디버그 로그 메시지'); // 개발 환경에서만 출력됨
logger.info('정보 로그 메시지'); // 일반적인 정보 로깅
logger.warn('경고 로그 메시지'); // 경고 상황 로깅
logger.error('에러 로그 메시지'); // 에러 상황 로깅

// 메타데이터와 함께 로깅 (구조화된 로깅)
logger.info('사용자 로그인', {
  userId: 'user-123',
  loginAt: new Date().toISOString(),
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
});

// 에러 객체 및 스택 트레이스 로깅
try {
  throw new Error('처리 중 오류 발생');
} catch (error) {
  logger.error('요청 처리 실패', { error });
}
```

TypeScript를 사용하는 경우:

```typescript
import { logger } from '@argos-identity/logger';

interface UserData {
  id: string;
  name: string;
  role: string;
}

// 타입 안전한 로깅
const userData: UserData = { id: '123', name: '홍길동', role: 'admin' };
logger.info('사용자 정보', { user: userData });
```

### 에러 로깅 유틸리티

표준화된 형식으로 에러를 로깅할 수 있는 유틸리티를 제공합니다:

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

`logError` 함수는 에러를 구조화된 형식으로 로깅하며, 다음과 같은 정보를 포함합니다:

- 에러 메시지 및 스택 트레이스
- 에러 발생 시간
- 요청 ID(요청 객체가 제공된 경우)
- HTTP 메서드 및 URL(요청 객체가 제공된 경우)
- 사용자 지정 컨텍스트 정보

## Express 통합

### 요청 ID 미들웨어

모든 요청에 고유한 요청 ID를 추가하여 요청 추적을 용이하게 합니다:

```javascript
const express = require('express');
const { requestId } = require('@argos-identity/logger');

const app = express();

// 요청 ID 미들웨어 적용
app.use(requestId);
```

이 미들웨어는 다음과 같은 작업을 수행합니다:

1. 클라이언트가 `x-request-id` 헤더를 제공한 경우 해당 값을 사용
2. 헤더가 없는 경우 UUID v4를 생성하여 새로운 요청 ID 할당
3. 요청 객체에 `requestId` 속성 추가
4. 응답 헤더에 `x-request-id` 추가

### 요청 로깅 미들웨어

HTTP 요청과 응답을 자동으로 로깅하는 미들웨어:

```javascript
const express = require('express');
const { logRequestMiddleware } = require('@argos-identity/logger');

const app = express();

// 기본 미들웨어 설정
app.use(express.json());
app.use(logRequestMiddleware);
```

이 미들웨어는 다음 정보를 로깅합니다:

- 요청 시작 시: HTTP 메서드, URL, 요청 헤더, 요청 본문
- 요청 완료 시: 상태 코드, 응답 시간, 응답 본문(선택적)

로그 예시:

```
[2025-03-05T12:34:56.789Z] INFO: 요청 시작 - GET /api/users/123 (requestId: abc-123)
[2025-03-05T12:34:56.901Z] INFO: 요청 완료 - GET /api/users/123 - 200 OK (113ms) (requestId: abc-123)
```

### 에러 로깅 미들웨어

애플리케이션에서 발생하는 예외를 자동으로 로깅하는 미들웨어:

```javascript
const express = require('express');
const { logErrorMiddleware } = require('@argos-identity/logger');

const app = express();

// 다른 미들웨어 설정...

// 에러 로깅 미들웨어는 라우터 뒤에 설정
app.use('/api', apiRouter);
app.use(logErrorMiddleware);

// 에러 처리 미들웨어
app.use((err, req, res, next) => {
  res.status(500).json({ error: '서버 오류가 발생했습니다.' });
});
```

### 전체 미들웨어 설정 예시

Express 애플리케이션에서 모든 로깅 미들웨어를 함께 사용하는 방법:

```javascript
const express = require('express');
const { requestId, logRequestMiddleware, logErrorMiddleware } = require('@argos-identity/logger');

const app = express();

// 1. 요청 ID 미들웨어 (가장 먼저 적용)
app.use(requestId);

// 2. 기본 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. 요청 로깅 미들웨어
app.use(logRequestMiddleware);

// 4. 라우터 설정
app.use('/api', apiRouter);

// 5. 에러 로깅 미들웨어
app.use(logErrorMiddleware);

// 6. 에러 처리 미들웨어
app.use((err, req, res, next) => {
  res.status(500).json({ error: '서버 오류가 발생했습니다.' });
});

app.listen(3000, () => {
  console.log('서버가 시작되었습니다.');
});
```

## AWS Lambda 통합

### Lambda 래퍼 사용법

Lambda 핸들러를 감싸서 로깅 기능을 자동으로 추가할 수 있습니다:

```javascript
const { withLogger } = require('@argos-identity/logger');

// 일반적인 Lambda 핸들러
const handler = async (event, context) => {
  // Lambda 로직 수행
  const userId = event.requestContext?.authorizer?.claims?.sub;

  // 로거 사용 (context.logger로 접근)
  context.logger.info('사용자 요청 처리 중', { userId });

  try {
    const result = await processRequest(event);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: '성공', data: result }),
    };
  } catch (error) {
    context.logger.error('요청 처리 실패', { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ message: '서버 오류가 발생했습니다.' }),
    };
  }
};

// 로깅을 추가한 핸들러로 내보내기
exports.lambdaHandler = withLogger(handler);
```

`withLogger` 래퍼는 다음과 같은 작업을 수행합니다:

1. Lambda 컨텍스트에 로거 인스턴스 추가
2. API Gateway 이벤트 자동 감지 및 요청 ID 처리
3. 요청 시작 및 완료 시 자동 로깅
4. 에러 발생 시 자동 로깅

### 로깅 컨텍스트 활용

Lambda 컨텍스트의 로거를 활용한 추가 컨텍스트 로깅:

```javascript
const { withLogger } = require('@argos-identity/logger');

const handler = async (event, context) => {
  // 로거에 요청 컨텍스트 추가
  const requestContext = {
    userId: event.requestContext?.authorizer?.claims?.sub,
    source: event.requestContext?.identity?.sourceIp,
    userAgent: event.requestContext?.identity?.userAgent,
  };

  // 컨텍스트와 함께 로깅
  context.logger.info('요청 처리 시작', requestContext);

  // 비즈니스 로직 수행
  // ...

  return {
    statusCode: 200,
    body: JSON.stringify({ message: '성공' }),
  };
};

exports.handler = withLogger(handler);
```

## 고급 설정

### 커스텀 로거 인스턴스

특정 요구사항에 맞는 로거 인스턴스를 생성할 수 있습니다:

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

### 로거 형식 변경

개발 환경과 프로덕션 환경에서 다른 로그 형식을 사용하도록 설정할 수 있습니다:

```javascript
const { createLoggerInstance } = require('@argos-identity/logger');

// 환경에 따른 로깅 형식 설정
const isDevelopment = process.env.NODE_ENV === 'development';
const logger = createLoggerInstance({
  level: isDevelopment ? 'debug' : 'info',
  format: isDevelopment ? 'simple' : 'json',
});

module.exports = logger;
```

## 환경 변수 설정

다음 환경 변수를 통해 로거 동작을 제어할 수 있습니다:

| 환경 변수    | 설명                                                    | 기본값        |
| ------------ | ------------------------------------------------------- | ------------- |
| `LOG_LEVEL`  | 로그 레벨 (`error`, `warn`, `info`, `debug`)            | `info`        |
| `LOG_FORMAT` | 로그 형식 (`json` 또는 `simple`)                        | `json`        |
| `NODE_ENV`   | 애플리케이션 환경 (`development`, `production`, `test`) | `development` |

### 로그 레벨

로그 레벨은 출력할 로그의 상세 수준을 결정합니다:

- `error`: 오류 메시지만 로깅 (최소한의 로깅)
- `warn`: 경고 및 오류 메시지 로깅
- `info`: 정보, 경고, 오류 메시지 로깅 (기본값)
- `debug`: 디버그, 정보, 경고, 오류 메시지 로깅 (매우 상세한 로깅)

### 로그 형식

로그 형식은 로그의 출력 형식을 결정합니다:

- `json`: JSON 형식으로 로깅 (프로덕션 환경에 적합, 로그 수집 시스템과 통합 시 권장)
- `simple`: 가독성 높은 텍스트 형식으로 로깅 (개발 환경에 적합)

## 트러블슈팅

### 로그가 출력되지 않는 경우

1. `LOG_LEVEL` 환경 변수를 확인하세요. 로그 레벨이 `error`로 설정되어 있다면 `info` 로그는 출력되지 않습니다.
2. `silent` 옵션이 활성화되어 있지 않은지 확인하세요.
3. 커스텀 로거를 사용하는 경우 올바르게 구성되었는지 확인하세요.

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

## 개발 가이드

패키지 개발에 기여하려면 다음 가이드를 참고하세요:

1. **패키지 설치**:

```bash
git clone <저장소 URL>
cd tools
npm install
```

2. **테스트 실행**:

```bash
cd packages/backend/logger
npm test
```

3. **빌드 실행**:

```bash
npm run build
```

4. **PR 제출 전**:

```bash
npm run lint
npm test
```

---
