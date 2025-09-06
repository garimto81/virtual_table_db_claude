# Virtual Table DB Claude

Supabase를 활용한 가상 테이블 토너먼트 시스템

## 프로젝트 소개

온라인 포커 토너먼트를 관리하기 위한 백엔드 시스템입니다. Supabase를 데이터베이스로 사용하며 TypeScript로 구현되었습니다.

## 주요 기능

- 토너먼트 생성 및 관리
- 테이블 관리
- 플레이어 인증 및 관리
- 핸드 기록 및 추적
- **포커 핸드 모니터링 시스템 (v8.6.0)**
  - 실시간 포커 핸드 모니터링
  - Virtual 시트 연동 및 시간 기반 매칭
  - 키 플레이어 중심 분석
  - AI 기반 핸드 요약 및 분석
  - **Google Sheets URL 실시간 유효성 검증**

## 최신 업데이트 (v8.6.0 - 2025-09-06)

### 🔗 Google Sheets URL 실시간 유효성 검증 시스템
- **실시간 검증**: URL 입력 시 즉시 유효성 검증 및 시각적 피드백
- **스마트 URL 분석**: 웹 게시 CSV, 일반 웹 게시, 편집 URL 자동 감지
- **시각적 피드백**: 색상 테두리로 URL 상태 표시
  - 🟢 초록: 완벽한 웹 게시 CSV URL (권장)
  - 🟡 노랑: 웹 게시 URL (자동 변환됨)
  - 🟠 주황: 편집 URL (권한 문제 가능)
  - 🔴 빨강: 지원되지 않는 형식
- **완료 전 검증**: 핸드 분석 시작 전 URL 유효성 재확인
- **향상된 사용자 가이드**: 도움말 버튼 및 상세한 URL 형식 안내

### 📋 이전 업데이트 (v8.5.0)
- **초 단위 정확도**: 기존 분 단위에서 초 단위 매칭으로 정밀도 대폭 향상
- **Seoul 시간대 지원**: UTC+9 시간대 자동 변환으로 정확한 로컬 시간 매칭
- **다양한 시간 형식**: HH:MM:SS, HH:MM, 한국어 시간 표기 지원
- **스마트 매칭 시스템**: 
  - 🎯 정확 매칭 (5초 이내)
  - ✅ 근사 매칭 (30초 이내)  
  - ⚠️ 대략적 매칭 (그 이상)
- **향상된 UI**: 매칭 정확도 시각화 및 상세 시간 차이 표시

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