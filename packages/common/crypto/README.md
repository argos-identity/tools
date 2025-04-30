# @argos-identity/crypto

공통으로 사용되는 암복호화 함수들을 제공하는 패키지입니다.

## 목차

- [설치 방법](#설치-방법)
- [제공 기능](#제공-기능)
  - [S3ImageCrypto](#s3imagecrypto)
    - [기본 사용법](#기본-사용법)
    - [암호화 및 업로드](#암호화-및-업로드)
    - [다운로드 및 복호화](#다운로드-및-복호화)
- [보안 고려사항](#보안-고려사항)
- [개발 가이드](#개발-가이드)
  - [컨트리뷰션 가이드라인](#컨트리뷰션-가이드라인)
  - [테스트 작성](#테스트-작성)
  - [패키지 업데이트](#패키지-업데이트)

## 설치 방법

```bash
# npm으로 설치
npm install @argos-identity/crypto

# yarn으로 설치
yarn add @argos-identity/crypto

# pnpm으로 설치
pnpm add @argos-identity/crypto
```

## 제공 기능

### S3ImageCrypto

`S3ImageCrypto` 클래스는 AWS KMS를 사용하여 이미지를 안전하게 암호화하고 S3에 저장하는 기능을 제공합니다. 이 클래스는 다음과 같은 주요 기능을 제공합니다:

- AWS KMS를 사용한 데이터 키 생성 및 관리
- 이미지 암호화 및 S3 업로드
- S3에서 암호화된 이미지 다운로드 및 복호화
- 암호화 메타데이터 관리 (암호화 알고리즘, 키 ID 등)

#### 기본 사용법

```typescript
import { S3ImageCrypto } from '@argos-identity/crypto';

// 인스턴스 생성
const imageCrypto = new S3ImageCrypto({
  region: 'ap-northeast-2', // AWS 리전
  bucketName: 'my-secure-bucket', // S3 버킷 이름
  kmsKeyId: 'your-kms-key-id', // KMS 키 ID 또는 ARN
  // 선택적 설정
  algorithm: 'aes-256-cbc', // 암호화 알고리즘 (기본값: aes-256-cbc)
  credentials: {
    // AWS 자격 증명 (선택 사항)
    accessKeyId: 'YOUR_ACCESS_KEY',
    secretAccessKey: 'YOUR_SECRET_KEY',
  },
});
```

#### 암호화 및 업로드

이미지를 암호화하여 S3에 업로드하는 방법입니다. 이 과정에서 다음과 같은 작업이 수행됩니다:

1. AWS KMS를 사용하여 데이터 암호화 키(DEK) 생성
2. 생성된 DEK를 사용하여 이미지 데이터 암호화
3. 암호화된 이미지와 메타데이터를 S3에 업로드

```typescript
import { S3ImageCrypto } from '@argos-identity/crypto';
import * as fs from 'fs/promises';

// 인스턴스 생성
const imageCrypto = new S3ImageCrypto({
  region: 'ap-northeast-2',
  bucketName: 'my-secure-bucket',
  kmsKeyId: 'your-kms-key-id',
});

async function uploadImage() {
  try {
    // 이미지 버퍼 준비 (예: 파일에서 읽기)
    const imageBuffer = await fs.readFile('./image.jpg');

    // 암호화 및 업로드
    const s3Key = 'images/user-123/profile.jpg';
    const uploadedKey = await imageCrypto.encryptAndUpload(imageBuffer, s3Key);

    console.log(`이미지가 암호화되어 ${uploadedKey}에 업로드되었습니다`);
    return uploadedKey;
  } catch (error) {
    console.error('이미지 업로드 중 오류 발생:', error);
    throw error;
  }
}
```

#### 다운로드 및 복호화

S3에서 암호화된 이미지를 다운로드하고 복호화하는 방법입니다. 이 과정에서 다음과 같은 작업이 수행됩니다:

1. S3에서 암호화된 이미지와 메타데이터 다운로드
2. AWS KMS를 사용하여 암호화된 DEK 복호화
3. 복호화된 DEK를 사용하여 이미지 데이터 복호화

```typescript
import { S3ImageCrypto } from '@argos-identity/crypto';
import * as fs from 'fs/promises';

// 인스턴스 생성
const imageCrypto = new S3ImageCrypto({
  region: 'ap-northeast-2',
  bucketName: 'my-secure-bucket',
  kmsKeyId: 'your-kms-key-id',
});

async function downloadImage(s3Key: string, outputPath: string) {
  try {
    // S3에서 다운로드 및 복호화
    const imageData = await imageCrypto.downloadAndDecrypt(s3Key);

    // 파일로 저장
    await fs.writeFile(outputPath, imageData);

    console.log(`이미지가 복호화되어 ${outputPath}에 저장되었습니다`);
    return imageData;
  } catch (error) {
    console.error('이미지 다운로드 중 오류 발생:', error);
    throw error;
  }
}
```

> **참고**: `downloadAndDecrypt` 메서드는 암호화된 이미지뿐만 아니라 암호화되지 않은 일반 이미지도 처리할 수 있습니다. 파일에 암호화 메타데이터가 없으면 원본 데이터를 그대로 반환합니다.

## 보안 고려사항

이 패키지를 사용할 때 고려해야 할 주요 보안 사항:

1. **KMS 키 관리**: KMS 키에 대한 접근 권한을 엄격하게 관리하세요. 키가 노출되면 암호화된 모든 데이터가 위험에 노출될 수 있습니다.

2. **IAM 권한**: 애플리케이션에 최소한의 권한만 부여하세요. S3 버킷과 KMS 키에 대한 필요한 작업만 허용하는 IAM 정책을 사용하세요.

3. **전송 보안**: AWS SDK는 기본적으로 HTTPS를 사용하지만, 클라이언트 측 구현에서 항상 보안 연결을 사용하는지 확인하세요.

4. **로깅 및 감사**: 암호화 작업과 키 사용에 대한 로그를 활성화하고 모니터링하세요. AWS CloudTrail을 통해 KMS 작업을 추적할 수 있습니다.

## 개발 가이드

### 컨트리뷰션 가이드라인

새로운 암호화 기능을 추가하거나 기존 기능을 수정할 때 따라야 할 가이드라인:

1. **보안 먼저**: 모든 암호화 구현은 보안 전문가의 리뷰를 받아야 합니다.

2. **표준 준수**: 업계 표준 암호화 알고리즘과 라이브러리만 사용하세요.

3. **단위 테스트**: 모든 기능에 대한 종합적인 테스트를 작성하세요.

4. **문서화**: 모든 API에 대한 자세한 문서와 사용 예제를 제공하세요.

### 테스트 작성

암호화 관련 기능의 테스트 작성 방법:

```typescript
// __tests__/s3/s3-image-crypto.spec.ts 예시
import { S3ImageCrypto } from '../../src/s3/s3-image-crypto';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { KMSClient } from '@aws-sdk/client-kms';

// S3 및 KMS 클라이언트 모킹
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-kms');

describe('S3ImageCrypto', () => {
  let imageCrypto: S3ImageCrypto;

  beforeEach(() => {
    // 테스트용 인스턴스 생성
    imageCrypto = new S3ImageCrypto({
      region: 'us-east-1',
      bucketName: 'test-bucket',
      kmsKeyId: 'test-key-id',
    });
  });

  it('이미지를 암호화하고 업로드합니다', async () => {
    // 모의 구현 및 테스트 로직
  });

  it('암호화된 이미지를 다운로드하고 복호화합니다', async () => {
    // 모의 구현 및 테스트 로직
  });
});
```

### 패키지 업데이트

패키지 의존성 및 버전 업데이트 방법:

```bash
# 패키지 버전 업데이트
npm version patch   # 패치 업데이트 (버그 수정)
npm version minor   # 마이너 업데이트 (기능 추가)
npm version major   # 메이저 업데이트 (호환성이 깨지는 변경)

# 패키지 빌드
npm run build

# 테스트 실행
npm test
```

---

© 2025 Argos Identity. All rights reserved.
이 코드는 Argos Identity의 독점 소프트웨어이며, 명시적인 허가 없이 외부에 공유할 수 없습니다.
