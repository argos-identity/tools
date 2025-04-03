# @argos-identity/crypto

공통으로 사용되는 암복호화 함수들을 제공하는 패키지입니다.

## 목차

- [설치 방법](#설치-방법)
- [S3ImageCrypto](#s3imagecrypto)
  - [기본 사용법](#기본-사용법)
  - [암호화 및 업로드](#암호화-및-업로드)
  - [다운로드 및 복호화](#다운로드-및-복호화)

## 설치 방법

```bash
# 패키지 설치
npm install @argos-identity/crypto
```

## S3ImageCrypto

`S3ImageCrypto` 클래스는 AWS KMS를 사용하여 이미지를 안전하게 암호화하고 S3에 저장하는 기능을 제공합니다.

### 기본 사용법

```typescript
import { S3ImageCrypto } from '@argos-identity/crypto';

// 인스턴스 생성
const imageCrypto = new S3ImageCrypto({
  region: 'ap-northeast-2', // AWS 리전
  bucketName: 'my-bucket', // S3 버킷 이름
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

### 암호화 및 업로드

이미지를 암호화하여 S3에 업로드합니다:

```typescript
import { S3ImageCrypto } from '@argos-identity/crypto';
import * as fs from 'fs/promises';

// 인스턴스 생성
const imageCrypto = new S3ImageCrypto({
  region: 'ap-northeast-2',
  bucketName: 'my-bucket',
  kmsKeyId: 'your-kms-key-id',
});

const uploadWithAsync = async () => {
  // 이미지 버퍼 준비 (예: 파일에서 읽기)
  const imageBuffer = await fs.readFile('./image.jpg');

  // 암호화 및 업로드
  const s3Key = 'images/profile.jpg';
  const uploadedKey = await imageCrypto.encryptAndUpload(imageBuffer, s3Key);

  console.log(`이미지가 암호화되어 ${uploadedKey}에 업로드되었습니다`);
};
```

### 다운로드 및 복호화

S3에서 암호화된 이미지를 다운로드하고 복호화합니다:

```typescript
import { S3ImageCrypto } from '@argos-identity/crypto';
import * as fs from 'fs/promises';

// 인스턴스 생성
const imageCrypto = new S3ImageCrypto({
  region: 'ap-northeast-2',
  bucketName: 'my-bucket',
  kmsKeyId: 'your-kms-key-id',
});

const downloadWithAsync = async () => {
  const s3Key = 'images/profile.jpg';
  const imageData = await imageCrypto.downloadAndDecrypt(s3Key);
  // 암호화 여부와 상관없이 이미지 데이터를 받을 수 있음
  await fs.writeFile('./downloaded-image.jpg', imageData);
};
```

> **참고**: `downloadAndDecrypt` 메서드는 암호화된 이미지뿐만 아니라 암호화되지 않은 일반 이미지도 처리할 수 있습니다. 파일에 암호화 메타데이터가 없으면 원본 데이터를 그대로 반환합니다.
