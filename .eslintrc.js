module.exports = {
  root: true,
  // TypeScript 코드를 파싱하기 위한 전용 파서 지정
  parser: '@typescript-eslint/parser',

  // 파서에 대한 추가 옵션 설정
  parserOptions: {
    // TypeScript 설정 파일 경로 지정 (타입 기반 규칙 사용에 필요)
    project: 'tsconfig.json',
    // 코드가 ECMAScript 모듈(import/export)을 사용함을 명시
    sourceType: 'module',
    // 사용할 ECMAScript 버전 지정
    ecmaVersion: 2022,
  },

  // 코드가 실행될 환경 설정
  env: {
    // Node.js 전역 변수와 Node.js 범위 지정
    node: true,
    // Jest 테스트 프레임워크 전역 변수 활성화
    jest: true,
  },

  // 다른 ESLint 설정을 상속
  extends: [
    // TypeScript ESLint에서 권장하는 기본 규칙 모음
    'plugin:@typescript-eslint/recommended',
    // Prettier와 ESLint 통합
    'plugin:prettier/recommended',
  ],

  // 사용할 ESLint 플러그인 목록
  plugins: ['@typescript-eslint', 'prettier'],

  // 개별 린트 규칙 설정
  rules: {
    '@typescript-eslint/unbound-method': 'off',
    // console.log() 등의 사용 시 경고 표시
    'no-console': 'warn',
    // 모든 제어문에 중괄호 사용 강제
    curly: ['error', 'all'],
    // 사용하지 않는 변수에 오류 표시, 단 _ 로 시작하는 변수는 제외 (TypeScript 버전)
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // 함수의 반환 타입을 명시적으로 선언하지 않으면 경고
    '@typescript-eslint/explicit-function-return-type': 'warn',
    // any 타입 사용 시 경고
    '@typescript-eslint/no-explicit-any': 'off',
    // any 타입 값을 다른 변수에 할당할 때 경고
    '@typescript-eslint/no-unsafe-assignment': 'off',
    // any 타입 객체의 속성에 접근할 때 경고
    '@typescript-eslint/no-unsafe-member-access': 'off',
    // any 타입 함수를 호출할 때 경고
    '@typescript-eslint/no-unsafe-call': 'off',
    // any 타입 값을 반환할 때 경고
    '@typescript-eslint/no-unsafe-return': 'off',
    // 동일한 모듈에서 중복 import 방지
    'no-duplicate-imports': 'error',
    // var 대신 let이나 const 사용 강제
    'no-var': 'error',
    // 재할당되지 않는 변수는 let 대신 const 사용 강제
    'prefer-const': 'error',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    // Prettier 규칙 위반 시 오류 표시
    'prettier/prettier': 'off',
  },

  // ESLint가 무시할 파일 패턴 지정
  ignorePatterns: ['node_modules/', 'dist/', 'build/', 'coverage/'],
};
