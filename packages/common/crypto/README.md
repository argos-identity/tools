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
// 이미지 버퍼 준비 (예: 파일에서 읽기)
import * as fs from 'fs/promises';
const imageBuffer = await fs.readFile('./image.jpg');

// 암호화 및 업로드
const s3Key = 'images/profile.jpg';
const uploadedKey = await imageCrypto.encryptAndUpload(imageBuffer, s3Key);

console.log(`이미지가 암호화되어 ${uploadedKey}에 업로드되었습니다`);
```

### 다운로드 및 복호화

S3에서 암호화된 이미지를 다운로드하고 복호화합니다:

```typescript
// 다운로드 및 복호화
const s3Key = 'images/profile.jpg';
const decryptedImage = await imageCrypto.downloadAndDecrypt(s3Key);

// 복호화된 이미지 저장
await fs.writeFile('./decrypted-image.jpg', decryptedImage);
```
