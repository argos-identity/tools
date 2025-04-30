# Argos Identity 유틸리티 모노레포

이 저장소는 Argos Identity 서비스에서 사용되는 공통 유틸리티 패키지들을 관리하는 모노레포입니다. 각 패키지는 독립적으로 배포되며, 다양한 서비스에서 재사용할 수 있는 표준화된 유틸리티 기능을 제공합니다.

## 목차

- [저장소 구성](#저장소-구성)
- [패키지 개요](#패키지-개요)
  - [공통 패키지](#공통-패키지)
  - [백엔드 패키지](#백엔드-패키지)
  - [프론트엔드 패키지](#프론트엔드-패키지)
- [패키지 배포](#패키지-배포)
- [패키지 설치 및 사용](#패키지-설치-및-사용)
- [개발 가이드](#개발-가이드)

## 저장소 구성

이 저장소는 모노레포 구조로 관리되며, packages 디렉토리 내에서 다음과 같이 조직되어 있습니다:

```bash
tools/
├── packages/
│   ├── common/              # 공통 유틸리티 패키지
│   │   ├── utils/           # 공통 유틸리티 함수 패키지
│   │   │   ├── src/
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   │
│   │   └── crypto/          # 암복호화 관련 유틸리티 패키지
│   │       ├── src/
│   │       ├── package.json
│   │       └── tsconfig.json
│   │
│   ├── frontend/            # 프론트엔드 전용 유틸리티 패키지
│   │   └── ...              # 현재 개발 중
│   │
│   └── backend/             # 백엔드 전용 유틸리티 패키지
│       └── logger/          # 백엔드 로깅 유틸리티 패키지
│           ├── src/
│           ├── package.json
│           └── tsconfig.json
│
├── package.json             # 루트 패키지 설정
└── lerna.json               # Lerna 구성
```

각 카테고리에는 독립적으로 버전 관리 및 배포되는 여러 패키지가 포함되어 있습니다.

## 패키지 개요

### 공통 패키지

#### @argos-identity/utils

[![npm version](https://img.shields.io/npm/v/@argos-identity/utils.svg)](https://www.npmjs.com/package/@argos-identity/utils)

공통으로 사용되는 유틸리티 함수들을 제공하는 패키지입니다. 주요 기능:

- **retry**: 비동기 함수 재시도 유틸리티
- 그 외 다양한 유틸리티 함수

[자세한 문서 보기](./packages/common/utils/README.md)

#### @argos-identity/crypto

[![npm version](https://img.shields.io/npm/v/@argos-identity/crypto.svg)](https://www.npmjs.com/package/@argos-identity/crypto)

암호화 및 복호화 관련 유틸리티를 제공하는 패키지입니다. 주요 기능:

- **S3ImageCrypto**: AWS KMS를 사용한 이미지 암복호화 및 S3 저장/조회
- 그 외 암호화 관련 유틸리티

[자세한 문서 보기](./packages/common/crypto/README.md)

### 백엔드 패키지

#### @argos-identity/logger

[![npm version](https://img.shields.io/npm/v/@argos-identity/logger.svg)](https://www.npmjs.com/package/@argos-identity/logger)

백엔드 애플리케이션을 위한 공통 로깅 패키지입니다. 주요 기능:

- Express 및 AWS Lambda 환경 지원
- 요청 추적, 에러 로깅, 성능 측정
- 구조화된 로깅 및 형식 지원

[자세한 문서 보기](./packages/backend/logger/README.md)

### 프론트엔드 패키지

현재 개발 중인 패키지들입니다. 향후 추가될 예정입니다.

## 패키지 배포

메인 브랜치에 변경사항이 푸시되면 GitHub Actions를 통해 자동으로 패키지가 배포됩니다.
수동으로 배포하려면:

```bash
npm run release
```

## 패키지 설치 및 사용

각 패키지는 npm 레지스트리를 통해 설치할 수 있습니다:

```bash
# 공통 유틸리티 함수 패키지 설치
npm install @argos-identity/utils

# 암복호화 유틸리티 패키지 설치
npm install @argos-identity/crypto

# 백엔드 로깅 패키지 설치
npm install @argos-identity/logger
```

각 패키지의 상세한 사용법은 해당 패키지의 README.md 파일을 참조하세요.

## 개발 가이드

새로운 패키지를 개발하거나 기존 패키지를 수정할 때 참고해야 할 가이드라인:

1. **폴더 구조**: 패키지의 카테고리(common, frontend, backend)에 맞게 배치합니다.
2. **패키지 네이밍**: `@argos-identity/{패키지명}` 형식을 준수합니다.
3. **문서화**: 각 패키지는 상세한 README.md를 포함해야 합니다.
4. **테스트**: 모든 기능에 대한 단위 테스트를 작성합니다.
5. **버전 관리**: 의미론적 버전 관리(Semantic Versioning)를 준수합니다.

새로운 패키지를 추가하거나 기존 패키지를 수정한 후에는 버전을 업데이트하고 CI/CD를 통해 배포하세요.

---

© 2025 Argos Identity. All rights reserved.
이 코드는 Argos Identity의 독점 소프트웨어이며, 명시적인 허가 없이 외부에 공유할 수 없습니다.
