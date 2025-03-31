## 저장소 구성

이 저장소는 모노레포 구조로 관리되며, packages 디렉토리 내에서 다음과 같이 조직되어 있습니다:

```bash
tools/
├── packages/
│   ├── common/
│   │   ├── utils/     # 공통 유틸리티 함수 패키지
│   │   │   ├── src/
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   │
│   │   ├── utility-types/     # 공통 유틸리티 타입 패키지
│   │   │   ├── src/
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   │
│   │   └── crypto/    # 암복호화 관련 유틸리티 패키지
│   │       ├── src/
│   │       ├── package.json
│   │       └── tsconfig.json
│   │
│   ├── frontend/      # 프론트엔드 전용 유틸리티 패키지
│   │   └── ...
│   │
│   └── backend/       # 백엔드 전용 유틸리티 패키지
│       └── ...
│
├── package.json       # 루트 패키지 설정
└── lerna.json         # Lerna 구성
```

각 카테고리에는 독립적으로 버전 관리 및 배포되는 여러 패키지가 포함되어 있습니다.

## 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/argos-identity/tools.git
cd tools

# 의존성 설치
npm install

# 모든 패키지 빌드
npm run build
```

## 패키지 배포

메인 브랜치에 변경사항이 푸시되면 GitHub Actions를 통해 자동으로 패키지가 배포됩니다.
수동으로 배포하려면:

```bash
npm run release
```

## 각 패키지 설치 예시

```bash
# common/utils 패키지 설치
npm install @argos-identity/utils

# common/crypto 패키지 설치
npm install @argos-identity/crypto
```
