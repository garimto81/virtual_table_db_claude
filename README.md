# Virtual Table DB Claude

Supabase를 활용한 가상 테이블 토너먼트 시스템

## 프로젝트 소개

온라인 포커 토너먼트를 관리하기 위한 백엔드 시스템입니다. Supabase를 데이터베이스로 사용하며 TypeScript로 구현되었습니다.

## 주요 기능

- 토너먼트 생성 및 관리
- 테이블 관리
- 플레이어 인증 및 관리
- 핸드 기록 및 추적

## Supabase Integration

### Setup

1. 저장소 클론
```bash
git clone https://github.com/garimto81/virtual_table_db_claude.git
cd virtual_table_db_claude
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일을 열어 Supabase 인증 정보 입력
```

4. 데이터베이스 마이그레이션 실행
```bash
npm run db:migrate
```

## 테스트 실행

### 유닛 테스트

유닛 테스트는 외부 의존성 없이 실행됩니다:

```bash
npm run test:unit
```

### 통합 테스트

통합 테스트를 실행하려면 Supabase 설정이 필요합니다:

1. Supabase 프로젝트에서 RLS(Row Level Security) 정책 설정
2. 테스트용 사용자 계정 생성
3. `.env` 파일에 서비스 키 추가

```bash
npm run test:integration
```

**참고**: 현재 통합 테스트는 RLS 정책 설정이 필요하여 스킵되어 있습니다.

### 모든 테스트 실행

```bash
npm test
```

### Watch 모드

```bash
npm run test:watch
```

### 코드 커버리지

```bash
npm run test:coverage
```

## 프로젝트 구조

```
src/
├── config/         # 설정 파일 (Supabase 클라이언트 등)
├── services/       # 비즈니스 로직 및 서비스 레이어
├── tests/          # 테스트 파일
│   ├── integration/  # 통합 테스트
│   └── unit/        # 유닛 테스트
└── types/          # TypeScript 타입 정의
```

## 사용 가능한 스크립트

- `npm run dev` - 개발 서버 실행
- `npm run build` - TypeScript 컴파일
- `npm test` - 테스트 실행
- `npm run lint` - 코드 린팅

## API 서비스

### Tournament Service
- `createTournament()` - 새 토너먼트 생성
- `getTournament()` - 토너먼트 정보 조회
- `createTable()` - 테이블 생성
- `getTables()` - 토너먼트 테이블 목록 조회

### Auth Service
- `signIn()` - 사용자 로그인
- `signUp()` - 새 사용자 등록
- `signOut()` - 로그아웃
- `getCurrentUser()` - 현재 사용자 정보 조회

### Hand Service
- `createHand()` - 새 핸드 생성
- `getHand()` - 핸드 정보 조회
- `getHandsByTable()` - 테이블별 핸드 목록 조회
- `updateHand()` - 핸드 정보 업데이트

## 환경 변수

`.env` 파일에 다음 환경 변수를 설정해야 합니다:

- `SUPABASE_URL` - Supabase 프로젝트 URL
- `SUPABASE_ANON_KEY` - Supabase Anonymous Key
- `SUPABASE_SERVICE_KEY` - Supabase Service Key (테스트용)

## CI/CD

GitHub Actions를 통한 자동 테스트가 구성되어 있습니다. main 또는 develop 브랜치에 푸시하거나 main 브랜치로 PR을 생성하면 자동으로 테스트가 실행됩니다.

## 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 라이선스

ISC

## 문의

Issues 탭을 통해 문의해 주세요.