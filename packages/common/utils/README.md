# @argos-identity/utils

공통으로 사용되는 유틸리티 함수들을 제공하는 패키지입니다.

## 목차

- [사용 방법](#사용-방법)
  - [retry - 비동기 함수 재시도 유틸리티](#retry---비동기-함수-재시도-유틸리티)
- [각 패키지 설치 예시](#각-패키지-설치-예시)
  - [Github Packages 설정](#github-packages-설정)
- [패키지 관리 방법](#패키지-관리-방법)
  - [버전 업데이트](#버전-업데이트)
  - [테스트 실행](#테스트-실행)
  - [테스트 추가](#테스트-추가)

## 사용 방법

### retry - 비동기 함수 재시도 유틸리티

비동기 작업이 실패했을 때 자동으로 재시도하는 기능을 제공합니다.

```typescript
import { retry } from '@argos-identity/utils';

// 기본 사용법
const result = await retry(async () => {
  const response = await fetch('https://api.example.com/data');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
});

// 상세 옵션 사용
const result = await retry(
  async () => {
    return await checkJobStatus(jobId);
  },
  {
    maxRetries: 5, // 최대 재시도 횟수 (총 6번 시도)
    delayMs: 200, // 재시도 간 지연 시간(ms)
    exponentialBackoff: true, // 지수 백오프 사용 (지연 시간 점진적 증가)
    isSuccess: (result) => result.status === 'completed', // 성공 조건
    onRetry: (retryCount, error) => {
      console.log(`재시도 ${retryCount}회 시도 중...`, error);
    },
    shouldAbort: (error) => error.message.includes('권한 없음'), // 즉시 중단 조건
  },
);
```

## 각 패키지 설치 예시

### Github Packages 설정

1. github 개인 액세스 토큰(PAT) 발급

   - 위치 : profile > settings > developer settings > personal access tokens
   - 권한 선택 : 패키지 관련 작업을 위해서는 최소한 다음 권한이 필요합니다:

     - read:packages: 패키지 다운로드 권한
     - write:packages: 패키지 업로드 권한
     - delete:packages: 패키지 삭제 권한 (선택적)
     - repo: private 저장소 접근 권한

2. 환경 변수로 설정

   macOS/Linux:

   ```bash
   # 현재 터미널 세션에만 적용
    export GITHUB_TOKEN=your_token_here

    # 영구적으로 적용 (Bash)
    echo 'export GITHUB_TOKEN=your_token_here' >> ~/.bashrc
    source ~/.bashrc

    # 영구적으로 적용 (Zsh)
    echo 'export GITHUB_TOKEN=your_token_here' >> ~/.zshrc
    source ~/.zshrc
   ```

   Windows (PowerShell):

   ```bash
     # 현재 세션에만 적용

     $env:GITHUB_TOKEN = "your_token_here"

     # 영구적으로 적용 (사용자 환경 변수)

     [Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "your_token_here", "User")
   ```

3. 프로젝트 root에 .npmrc 생성

   ```bash
   //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
   @argos-identity:registry=https://npm.pkg.github.com
   ```

4. 필요한 패키지 설치

   ```bash
   # common/utils 패키지 설치
   npm install @argos-identity/utils

   # common/crypto 패키지 설치
   npm install @argos-identity/crypto
   ```

## 패키지 관리 방법

### 버전 업데이트

패키지를 수정한 후 버전을 업데이트하고 배포하는 과정:

```bash
# 버전 업데이트 (patch, minor, major 중 선택)
npm version patch

# 배포 (CI/CD에서 자동으로 실행됨)
```

### 테스트 실행

패키지의 기능을 테스트하는 방법:

```bash
# 모든 테스트 실행
npm test

# 특정 테스트만 실행
npm test -- -t "함수명"

# 코드 커버리지 확인
npm test -- --coverage
```

### 테스트 추가

새로운 기능을 추가할 때는 테스트 코드를 함께 작성해야 합니다:

```typescript
// src/파일명.spec.ts
import { 테스트 할 함수 } from './파일명';

describe('테스트 그룹명', () => {
  it('테스트할 동작을 설명', () => {
    // 테스트 코드 작성
  });
});
```

테스트를 위한 모의(mock) 객체나 함수를 활용하면 외부 의존성 없이 독립적인 테스트가 가능합니다.
