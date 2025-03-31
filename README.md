## 저장소 구성

이 저장소는 모노레포 구조로 관리되며, packages 디렉토리 내에서 다음과 같이 조직되어 있습니다:

## 목차

- [저장소 구성](#저장소-구성)
- [패키지 배포](#패키지-배포)
- [패키지 설치 예시](#패키지-설치-예시)
  - [Github Packages 설정](#github-packages-설정)
  - [필요한 패키지 설치](#필요한-패키지-설치)

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

## 패키지 배포

메인 브랜치에 변경사항이 푸시되면 GitHub Actions를 통해 자동으로 패키지가 배포됩니다.
수동으로 배포하려면:

```bash
npm run release
```

## 패키지 설치 예시

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

### 필요한 패키지 설치

```bash
# common/utils 패키지 설치
npm install @argos-identity/utils

# common/crypto 패키지 설치
npm install @argos-identity/crypto
```
