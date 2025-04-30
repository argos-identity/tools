# @argos-identity/utils

공통으로 사용되는 유틸리티 함수들을 제공하는 패키지입니다.

## 목차

- [설치 방법](#설치-방법)
- [제공 기능](#제공-기능)
  - [retry - 비동기 함수 재시도 유틸리티](#retry---비동기-함수-재시도-유틸리티)
- [개발 가이드](#개발-가이드)
  - [버전 업데이트](#버전-업데이트)
  - [테스트 작성](#테스트-작성)
  - [패키지 빌드](#패키지-빌드)

## 설치 방법

```bash
# npm으로 설치
npm install @argos-identity/utils

# yarn으로 설치
yarn add @argos-identity/utils

# pnpm으로 설치
pnpm add @argos-identity/utils
```

## 제공 기능

### retry - 비동기 함수 재시도 유틸리티

비동기 작업이 실패했을 때 자동으로 재시도하는 기능을 제공합니다. 네트워크 요청, API 호출, 외부 서비스 연동 등 일시적 장애가 발생할 수 있는 환경에서 유용합니다.

#### 기본 사용법

```typescript
import { retry } from '@argos-identity/utils';

// 기본 설정으로 사용
const result = await retry(async () => {
  const response = await fetch('https://api.example.com/data');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
});
```

#### 고급 설정

```typescript
import { retry } from '@argos-identity/utils';

// 고급 옵션 설정
const result = await retry(
  async () => {
    return await checkJobStatus(jobId);
  },
  {
    maxRetries: 5, // 최대 재시도 횟수 (총 6번 시도)
    delayMs: 200, // 재시도 간 지연 시간(ms)
    exponentialBackoff: true, // 지수 백오프 사용 (지연 시간 점진적 증가)
    isSuccess: result => result.status === 'completed', // 성공 조건
    onRetry: (retryCount, error) => {
      console.log(`재시도 ${retryCount}회 시도 중...`, error);
    },
    shouldAbort: error => error.message.includes('권한 없음'), // 즉시 중단 조건
  },
);
```

#### 옵션 설명

| 옵션                 | 타입     | 기본값 | 설명                            |
| -------------------- | -------- | ------ | ------------------------------- |
| `maxRetries`         | number   | 5      | 최대 재시도 횟수 (첫 시도 제외) |
| `delayMs`            | number   | 200    | 재시도 간 지연 시간(밀리초)     |
| `exponentialBackoff` | boolean  | true   | 지수 백오프 사용 여부           |
| `isSuccess`          | function | -      | 결과 평가 함수(성공 여부 판단)  |
| `onRetry`            | function | -      | 재시도 시 호출될 콜백 함수      |
| `shouldAbort`        | function | -      | 재시도 중단 조건 함수           |

## 개발 가이드

### 버전 업데이트

패키지를 수정한 후 버전을 업데이트하고 배포하는 과정:

```bash
# 루트 디렉토리에서 실행
# 패치 버전 업데이트 (버그 수정)
npm version patch

# 마이너 버전 업데이트 (기능 추가)
npm version minor

# 메이저 버전 업데이트 (호환성이 깨지는 변경)
npm version major
```

### 테스트 작성

새로운 유틸리티 함수를 추가하거나 기존 함수를 수정할 때는 반드시 테스트 코드를 작성해야 합니다:

```typescript
// __tests__/retry/retry.spec.ts 예시
import { retry } from '../../src/retry/retry';

describe('retry', () => {
  it('성공 시 결과를 반환합니다', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const result = await retry(mockFn);
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('실패 후 재시도하여 성공하면 결과를 반환합니다', async () => {
    const mockFn = jest.fn().mockRejectedValueOnce(new Error('실패')).mockResolvedValue('success');

    const result = await retry(mockFn);
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});
```

테스트 실행 방법:

```bash
# 모든 테스트 실행
npm test

# 특정 테스트만 실행
npm test -- -t "함수명"

# 코드 커버리지 확인
npm test -- --coverage
```

### 패키지 빌드

개발 완료 후 배포 전에 패키지를 빌드하여 검증합니다:

```bash
# 패키지 빌드
npm run build

# 린트 검사 실행
npm run lint
```

---

© 2025 Argos Identity. All rights reserved.
이 코드는 Argos Identity의 독점 소프트웨어이며, 명시적인 허가 없이 외부에 공유할 수 없습니다.
