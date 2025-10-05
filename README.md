# Virtual Table DB v13.5.11

**포커 핸드 실시간 모니터링 및 AI 분석 시스템**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-13.5.11-green.svg)](https://github.com/garimto81/virtual_table_db_claude/releases)
[![Status](https://img.shields.io/badge/status-production-success.svg)](https://garimto81.github.io/virtual_table_db_claude/)

---

## 📖 목차

- [주요 기능](#-주요-기능)
- [빠른 시작](#-빠른-시작)
- [프로젝트 구조](#-프로젝트-구조)
- [문서](#-문서)
- [기술 스택](#-기술-스택)
- [변경 이력](#-변경-이력)
- [기여](#-기여)
- [라이선스](#-라이선스)

---

## 🚀 주요 기능

### 핵심 기능
- ⚡ **실시간 핸드 감지**: SSE를 통한 자동 새 핸드 감지 및 브라우저 알림
- 🤖 **AI 핸드 분석**: Gemini API를 활용한 전략적 핸드 분석 (캐싱 지원)
- 📝 **자막 자동 생성**: 키 플레이어 자막 생성 (CURRENT STACK 형식)
- 🔄 **Google Sheets 연동**: 실시간 양방향 데이터 동기화
- 📁 **자동 파일명 생성**: 플레이어 정보 기반 일관된 파일명 생성

### 부가 기능
- 🎨 다크 테마 UI
- 💾 로컬 캐싱 (5분 TTL)
- 🔔 토스트 알림 시스템
- ✅ 상태 관리 (미완료/복사완료)
- 🗑️ 중복 플레이어 제거 (G열 체크박스)

---

## ⚡ 빠른 시작

### 1. 설정

#### Google Sheets 준비
```bash
1. Virtual Sheet: 테이블 및 핸드 기본 정보
2. Hand Sheet: 핸드 상세 정보
3. CSV 형식으로 웹에 게시 (공개 링크 생성)
```

#### Apps Script 배포
```bash
1. scripts/appScripts.gs 파일 복사
2. Google Apps Script 에디터에 붙여넣기
3. 배포 → 웹 앱으로 배포
4. 액세스 권한: "모든 사용자" 설정
5. 배포 URL 복사
```

#### Gemini API 키 발급
```bash
1. https://makersuite.google.com/app/apikey 접속
2. API 키 생성
3. 애플리케이션 설정 패널에서 API 키 입력
```

### 2. 실행

#### 로컬 개발
```bash
# HTTP 서버 실행
npm run dev
# 또는
python -m http.server 8000

# 브라우저 접속
open http://localhost:8000
```

#### 프로덕션
```bash
# GitHub Pages에서 자동 배포
https://garimto81.github.io/virtual_table_db_claude/
```

---

## 📂 프로젝트 구조

```
virtual_table_db_claude/
├── 📄 index.html                    # 메인 애플리케이션 (357KB)
├── 📄 g-column-checkbox-handler.js  # G열 체크박스 핸들러
├── 📄 package.json                  # NPM 설정
├── 📄 README.md                     # 프로젝트 소개 (현재 파일)
│
├── 📂 scripts/
│   └── appScripts.gs                # Google Apps Script (23KB)
│
├── 📂 src/js/
│   ├── duplicate-remover.js         # 중복 제거 유틸
│   └── modal-auto-close.js          # 모달 자동 닫기
│
├── 📂 utils/
│   ├── fix_template_literals.py     # 구문 수정 스크립트
│   └── ... (기타 유틸리티)
│
├── 📂 docs/
│   ├── PRD_virtual_table_db.md      # 제품 요구사항 문서 ✨
│   ├── LLD_virtual_table_db.md      # 기술 설계 문서 ✨
│   ├── PLAN_virtual_table_db.md     # 실행 계획 문서 ✨
│   └── CLAUDE_TASK_TOOL_GUIDE.md    # Claude 작업 가이드
│
├── 📂 archive/
│   ├── PROJECT_MASTER_v3.6.0.md     # 구버전 문서 (아카이브)
│   ├── MULTI_AGENT_SYSTEM_v3.6.0.md
│   └── PHASE0_VALIDATION_v3.6.0.md
│
└── 📂 .github/
    └── workflows/                   # GitHub Actions (예정)
```

---

## 📚 문서

### 핵심 문서 (v13.5.11 기준)
| 문서 | 설명 | 링크 |
|------|------|------|
| **PRD** | 제품 요구사항 정의 | [PRD_virtual_table_db.md](./PRD_virtual_table_db.md) |
| **LLD** | 기술 설계 및 아키텍처 | [LLD_virtual_table_db.md](./LLD_virtual_table_db.md) |
| **PLAN** | v13.5.11 → v14.0.0 실행 계획 | [PLAN_virtual_table_db.md](./PLAN_virtual_table_db.md) |
| **CLAUDE** | Claude AI 작업 가이드 | [CLAUDE.md](./CLAUDE.md) |

### 아카이브 문서 (구버전)
- [PROJECT_MASTER v3.6.0](./archive/PROJECT_MASTER_v3.6.0.md) - 초기 개발 계획
- [MULTI_AGENT_SYSTEM v3.6.0](./archive/MULTI_AGENT_SYSTEM_v3.6.0.md) - 멀티 에이전트 설계

---

## 🛠️ 기술 스택

### Frontend
```yaml
Core:
  - HTML5 (Semantic)
  - CSS3 (Grid, Flexbox)
  - JavaScript ES6+

Libraries:
  - Papa Parse v5.4.1 (CSV 파싱)
  - No Framework (순수 JS)

Planned (v14.0.0):
  - DOMPurify (XSS 방어)
  - CryptoJS (암호화)
  - Vite (빌드 도구)
```

### Backend
```yaml
Platform:
  - Google Apps Script
  - Google Sheets API v4

APIs:
  - Gemini AI API (핸드 분석)
  - Server-Sent Events (실시간 감지)
```

### Infrastructure
```yaml
Hosting:
  - GitHub Pages (프론트엔드)
  - Google Cloud (Apps Script)

Storage:
  - Google Sheets (주 데이터베이스)
  - localStorage (클라이언트 캐시)
```

---

## 🔧 변경 이력

### v13.5.11 (2025-10-05) - 현재 버전
- 🔥 **대량 구문 오류 근본 해결**: Python 스크립트로 20+ 개 일괄 수정
  - 'Unexpected token' 오류 완전 해결 (1734, 1638, 4099, 6833번 줄)
  - 모든 'Fixed: template literal' 오류 일괄 수정
  - 깨진 alert() 및 throw Error() 문 복구
  - orphaned 매개변수 및 빈 블록 완전 제거
  - 브라우저 로드 성공 및 구문 오류 완전 해결

### v13.5.x 시리즈 (2025-09)
- **v13.5.8**: 114개 구문 오류 완전 해결
- **v13.5.7**: 39개 구문 오류 자동 검출 및 수정
- **v13.5.6**: generateCustomFilename 함수 구문 오류 수정
- **v13.5.5**: 609개 디버그 로그 완전 제거 및 최적화
- **v13.5.4**: 디버그 시스템 전체 제거 및 순환 참조 해결
- **v13.5.3**: Maximum call stack size exceeded 버그 수정
- **v13.5.2**: TailwindCSS 경고 및 404 에러 제거
- **v13.5.1**: DEFAULT_CONFIG 스코프 오류 해결

### 향후 계획 (v14.0.0) - 2025년 11월 예정
- 🔒 보안 강화 (API 키 암호화, XSS 방어)
- ⚡ 성능 최적화 (번들 크기 50% 감소)
- ✅ 테스트 커버리지 80% 달성
- 📦 모듈화 리팩토링

전체 변경 이력은 [CHANGELOG.md](./CHANGELOG.md) 참조 (예정)

---

## 🤝 기여

### 개발 환경 설정
```bash
# 저장소 클론
git clone https://github.com/garimto81/virtual_table_db_claude.git
cd virtual_table_db_claude

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 기여 프로세스
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 커밋 컨벤션
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 리팩토링
test: 테스트 추가/수정
chore: 빌드, 패키지 설정
```

---

## 📊 프로젝트 상태

### 현재 지표
| 메트릭 | 현재 | 목표 (v14.0.0) |
|--------|------|----------------|
| 번들 크기 | 357KB | 180KB |
| 테스트 커버리지 | 0% | 80% |
| Lighthouse 점수 | 60 | 90+ |
| 보안 취약점 | 12개 | 0개 |

### 로드맵
- [x] v13.5.11: 구문 오류 완전 해결 ✅
- [ ] v13.6.0: 보안 강화 (2025-10-18)
- [ ] v13.7.0: 성능 최적화 (2025-11-01)
- [ ] v14.0.0: 테스트 완료 (2025-11-30)

---

## 📞 지원

### 문서
- [PRD](./PRD_virtual_table_db.md) - 제품 요구사항
- [LLD](./LLD_virtual_table_db.md) - 기술 설계
- [PLAN](./PLAN_virtual_table_db.md) - 실행 계획

### 이슈 보고
- GitHub Issues: [Create Issue](https://github.com/garimto81/virtual_table_db_claude/issues/new)

### 데모
- Live Demo: [GitHub Pages](https://garimto81.github.io/virtual_table_db_claude/)

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 🙏 감사의 말

- Google Gemini API
- Google Apps Script
- Papa Parse
- GitHub Pages

---

**Made with ❤️ by Claude AI & Development Team**

**Last Updated**: 2025-10-05