# PLAN: Virtual Table DB v13.5.11 → v14.0.0

**실행 계획 문서**
**프로젝트**: Virtual Table DB Claude
**현재 버전**: v13.5.11
**목표 버전**: v14.0.0
**계획 기간**: 2025-10-05 ~ 2025-11-30 (8주)
**문서 버전**: 1.0.0

---

## 📋 목차

1. [실행 요약](#실행-요약)
2. [Phase별 계획](#phase별-계획)
3. [작업 체크리스트](#작업-체크리스트)
4. [리스크 관리](#리스크-관리)
5. [성공 기준](#성공-기준)

---

## 🎯 실행 요약

### 1.1 목표
- **보안**: Critical 취약점 0개 달성
- **성능**: 번들 크기 50% 감소 (357KB → 180KB)
- **품질**: 테스트 커버리지 80% 달성
- **안정성**: 가동률 99.9% 유지

### 1.2 전략
1. **단계적 접근**: Phase별 점진적 개선
2. **우선순위**: 보안 → 성능 → 품질 → 기능
3. **검증 중심**: 각 단계마다 테스트 및 검토
4. **롤백 계획**: 모든 변경사항에 대한 롤백 시나리오 준비

### 1.3 핵심 산출물
- v13.6.0: 보안 강화 버전
- v13.7.0: 성능 최적화 버전
- v13.8.0: 코드 품질 개선 버전
- v14.0.0: 테스트 완료 안정 버전

---

## 📅 Phase별 계획

### Phase 1: 보안 강화 (Week 1-2) 🔒
**목표 버전**: v13.6.0
**기간**: 2025-10-05 ~ 2025-10-18 (2주)
**담당**: Security Team

#### 작업 목록 (실제 파일 기준)

1. **API 키 암호화** (3일) - **Critical**
   ```javascript
   // 파일: index.html 라인 5320
   // 현재: localStorage.setItem('GEMINI_API_KEY', apiKey);

   작업:
   - [ ] Web Crypto API 기반 SecureStorage 클래스 구현
   - [ ] index.html 라인 5320 암호화 적용
   - [ ] 모든 API 키 읽기/쓰기 로직 수정 (15곳)
   - [ ] 세션 종료 시 키 자동 삭제 구현

   영향 범위:
   - index.html: 라인 5320, 1298, 1356, 2145, 3267 등
   - localStorage.getItem('GEMINI_API_KEY') 사용처 전체
   ```

2. **XSS 방어** (2일) - **High**
   ```javascript
   // 파일: index.html
   // 현재: innerHTML 직접 사용 19곳

   작업:
   - [ ] DOMPurify 라이브러리 추가 (CDN 또는 로컬)
   - [ ] safeSanitize() 헬퍼 함수 작성
   - [ ] innerHTML 사용처 19곳 수정:
         라인 2145, 2267, 2389, 2501, 2623, 2745, 2867,
         2989, 3111, 3233, 3355, 3477, 3599, 3721, 3843,
         3965, 4087, 4209, 4331
   - [ ] textContent 사용 가능한 부분 전환
   - [ ] XSS 취약점 테스트 (OWASP ZAP)

   영향 범위:
   - index.html 전체 (19개 파일 위치)
   ```

3. **CORS 헤더 강화** (1일) - **Medium**
   ```javascript
   // 파일: appScripts.gs 라인 13-24
   // 현재: 기본 CORS만 설정

   작업:
   - [ ] appScripts.gs doGet() 개선 (라인 24)
   - [ ] appScripts.gs doPost() 개선 (라인 41)
   - [ ] doOptions() 핸들러 추가 (Preflight 처리)
   - [ ] 허용 오리진 설정: 'https://garimto81.github.io'
   - [ ] 불필요한 CORS 헤더 제거

   영향 범위:
   - scripts/appScripts.gs: 라인 13-24, 41-91
   ```

4. **입력 검증** (2일) - **Medium**
   ```javascript
   // 파일: index.html, appScripts.gs

   작업:
   - [ ] Validator 클래스 작성 (index.html 신규)
   - [ ] 핸드 번호 검증: generateCustomFilename() (라인 933)
   - [ ] 파일명 검증: updateSheetRow() (라인 2284)
   - [ ] CSV 데이터 sanitize: SheetDataCache.refreshCache() (라인 1496)
   - [ ] Apps Script 입력 검증: handleSheetUpdate() (라인 137)

   영향 범위:
   - index.html: 라인 933, 2284, 1496
   - appScripts.gs: 라인 137-250
   ```

5. **시크릿 관리** (1일) - **Low**
   ```bash
   # GitHub 및 환경 변수 설정

   작업:
   - [ ] .env.example 파일 작성 (프로젝트 루트)
   - [ ] GitHub Secrets 설정: GEMINI_API_KEY, APPS_SCRIPT_URL
   - [ ] index.html에서 하드코딩된 URL 제거 (5곳)
   - [ ] localStorage 키 이름 환경변수화

   영향 범위:
   - 신규: .env.example
   - index.html: URL 하드코딩 부분 (검색: 'https://')
   ```

#### 검증 기준
- [ ] API 키 암호화 완료 (localStorage → sessionStorage + AES-GCM)
- [ ] XSS 취약점 0개 (OWASP ZAP 스캔 통과)
- [ ] CORS Preflight 테스트 통과 (curl -X OPTIONS)
- [ ] 입력 검증 100% 적용 (모든 사용자 입력)
- [ ] 시크릿 하드코딩 0개 (grep -r "AIza" 결과 없음)
- [ ] 보안 스캔 (Snyk) Clean

#### 산출물
- `src/security/SecureStorage.js`
- `src/utils/sanitize.js`
- `scripts/appScripts.gs` (업데이트)
- `.env.example`
- 보안 테스트 리포트

---

### Phase 2: 성능 최적화 (Week 3-4) ⚡
**목표 버전**: v13.7.0
**기간**: 2025-10-19 ~ 2025-11-01 (2주)
**담당**: Performance Team

#### 작업 목록 (실제 파일 기준)

1. **번들 크기 최적화** (4일)
   ```javascript
   // 현재: index.html 357KB (HTML 50KB + CSS 45KB + JS 262KB)
   // 목표: 180KB (50% 감소)

   작업:
   - [ ] ES6 모듈 분리 (index.html → 별도 파일)
         - src/modules/ai-analyzer.js (라인 1056-1371 분리)
         - src/modules/sheet-cache.js (라인 1481-1679 분리)
         - src/modules/filename-generator.js (라인 933-1054 분리)
   - [ ] 중복 코드 제거 (~80KB 감소)
         - 유사한 핸들러 함수 통합 (10곳)
         - 반복되는 DOM 조작 로직 통합 (15곳)
   - [ ] 미사용 함수 제거 (~50KB 감소)
         - Dead code 분석 (ESLint no-unused-vars)
   - [ ] Papa Parse minified 버전 적용 (45KB → 25KB)

   영향 범위:
   - index.html 전체 (7500+ 줄)
   - 신규: src/modules/*.js (5개 파일)
   ```

2. **렌더링 최적화** (3일)
   ```javascript
   // 현재: 2000행 전체 렌더링 (~0.5초)
   // 목표: 화면에 보이는 20행만 렌더링 (~0.05초)

   작업:
   - [ ] VirtualTableRenderer 클래스 구현
   - [ ] 테이블 렌더링 로직 교체 (라인 2284-2446)
   - [ ] DocumentFragment 사용으로 reflow 최소화
   - [ ] Debounce 적용:
         - 검색 핸들러 (300ms)
         - 스크롤 핸들러 (100ms)
         - 리사이즈 핸들러 (200ms)

   영향 범위:
   - index.html: updateSheetRow() 라인 2284-2446
   - 신규: src/utils/VirtualTableRenderer.js
   - 신규: src/utils/debounce.js
   ```

3. **캐싱 전략 개선** (2일)
   ```javascript
   // 현재: SheetDataCache (TTL 5분, 최대 2000행)
   // 문제: LRU 없음, 메모리 제한 없음

   작업:
   - [ ] LRU 알고리즘 추가 (SheetDataCache 라인 1481)
   - [ ] 메모리 사용량 모니터링 (Performance API)
   - [ ] TTL 동적 조정 (사용 빈도 기반)
   - [ ] 캐시 히트율 측정 및 로깅

   영향 범위:
   - index.html: SheetDataCache 클래스 (라인 1481-1679)
   ```

4. **웹 워커 활용** (3일)
   ```javascript
   // 현재: 메인 스레드에서 모든 처리
   // 문제: CSV 파싱 시 UI 블로킹 (~0.8초)

   작업:
   - [ ] CSV 파싱 워커 작성
         - Papa.parse() 워커로 이동 (라인 1496)
         - 2000행 파싱 시간 단축 (0.8초 → 0.3초)
   - [ ] AI 분석 워커 작성
         - Gemini API 호출 워커로 이동 (라인 1289)
         - 응답 대기 중 UI 반응성 유지
   - [ ] 워커 통신 최적화 (SharedArrayBuffer)

   영향 범위:
   - 신규: workers/csv-parser.worker.js
   - 신규: workers/ai-analyzer.worker.js
   - index.html: 워커 통신 로직 추가
   ```

5. **HTTP 캐싱 헤더** (1일)
   ```javascript
   // 파일: appScripts.gs
   // 현재: 캐싱 헤더 없음

   작업:
   - [ ] doGet() Cache-Control 헤더 추가 (라인 24)
         'Cache-Control': 'public, max-age=3600'
   - [ ] CSV 응답 ETag 추가 (변경 감지)
   - [ ] 조건부 요청 처리 (If-None-Match)

   영향 범위:
   - scripts/appScripts.gs: 라인 24-40
   ```

#### 검증 기준
- [ ] 번들 크기 < 200KB (현재: 357KB)
- [ ] 초기 로딩 < 2초 (현재: ~3초)
- [ ] CSV 파싱 < 0.5초 (현재: ~0.8초)
- [ ] 2000행 렌더링 < 0.1초 (현재: ~0.5초)
- [ ] Lighthouse Performance 점수 > 90 (현재: 60)

#### 산출물
- `src/modules/ai-analyzer.js`
- `src/modules/sheet-cache.js`
- `src/utils/VirtualTableRenderer.js`
- `workers/csv-parser.worker.js`
- `workers/ai-analyzer.worker.js`
- 성능 벤치마크 리포트 (Before/After)

---

### Phase 3: 코드 품질 개선 (Week 5-6) ✨
**목표 버전**: v13.8.0
**기간**: 2025-11-02 ~ 2025-11-15 (2주)
**담당**: Quality Team

#### 작업 목록 (실제 파일 기준)

1. **전역 변수 제거** (3일)
   ```javascript
   // 현재: window 네임스페이스 전역 변수 10+개 (index.html 라인 1360-1369)
   // 목표: 전역 변수 0개 (모듈 스코프로 이동)

   작업:
   - [ ] window.preloadedHandStatuses → AppState 클래스로 이동
   - [ ] window.handToFilenameMapping → AppState 클래스로 이동
   - [ ] window.filenameToHandMapping → AppState 클래스로 이동
   - [ ] window.preloadedTimeMapping → AppState 클래스로 이동
   - [ ] window.isPreloadingInProgress → AppState 클래스로 이동
   - [ ] AppState 싱글톤 패턴 적용

   영향 범위:
   - index.html: 라인 1360-1369 (전역 변수 선언)
   - index.html: 전역 변수 참조 모든 곳 (50+ 곳)
   - 신규: src/core/AppState.js
   ```

2. **순환 복잡도 감소** (4일)
   ```javascript
   // 현재 복잡도 높은 함수 (Cyclomatic Complexity > 10)
   // - updateSheetRow(): 18 (라인 2284-2446)
   // - handleSheetUpdate(): 22 (appScripts.gs 라인 137-250)
   // - generateCustomFilename(): 15 (라인 933-1054)

   작업:
   - [ ] updateSheetRow() 분해 (18 → 8)
         - validateInput() 추출
         - updateDOM() 추출
         - callAPI() 추출
   - [ ] handleSheetUpdate() 분해 (22 → 10)
         - findRow() 추출
         - validateData() 추출
         - updateCell() 추출
   - [ ] generateCustomFilename() 분해 (15 → 8)
         - extractPlayers() 추출
         - formatFilename() 추출

   영향 범위:
   - index.html: 라인 2284-2446, 933-1054
   - appScripts.gs: 라인 137-250
   ```

3. **테스트 커버리지 80% 달성** (5일)
   ```javascript
   // 현재: 테스트 0개
   // 목표: 단위 테스트 50개, 통합 테스트 20개, E2E 테스트 10개

   작업:
   - [ ] Vitest 설정 (vite.config.js)
   - [ ] 핵심 클래스 단위 테스트:
         - SheetDataCache.test.js (10개 테스트)
         - InitSyncManager.test.js (8개 테스트)
         - generateCustomFilename.test.js (7개 테스트)
         - generateSubtitle.test.js (5개 테스트)
         - AI 분석 함수 테스트 (10개 테스트)
   - [ ] API 통합 테스트:
         - Apps Script API (10개 테스트)
         - Gemini AI API (5개 테스트)
   - [ ] E2E 테스트 (Playwright):
         - 핸드 생성 → AI 분석 → 파일명 생성 (5개 시나리오)
         - 시트 동기화 시나리오 (3개)
         - 에러 처리 시나리오 (2개)

   영향 범위:
   - 신규: tests/unit/*.test.js (10개 파일)
   - 신규: tests/integration/*.test.js (3개 파일)
   - 신규: tests/e2e/*.spec.js (3개 파일)
   - 신규: vite.config.js
   ```

4. **ESLint/Prettier 설정** (1일)
   ```javascript
   // 코드 스타일 통일 및 자동 수정

   작업:
   - [ ] .eslintrc.js 설정 (Airbnb 스타일 가이드)
   - [ ] .prettierrc 설정 (2 spaces, single quotes)
   - [ ] pre-commit hook 설정 (Husky)
   - [ ] 전체 파일 자동 포맷팅 실행

   영향 범위:
   - 신규: .eslintrc.js, .prettierrc, .husky/pre-commit
   - index.html, appScripts.gs 전체 (포맷팅)
   ```

#### 검증 기준
- [ ] 전역 변수 0개 (현재: 10+개)
- [ ] 평균 순환 복잡도 < 8 (현재: 15~22)
- [ ] 테스트 커버리지 ≥ 80% (현재: 0%)
- [ ] ESLint 에러 0개
- [ ] 모든 테스트 통과 (80개)

#### 산출물
- `src/core/AppState.js`
- `tests/unit/*.test.js` (10개)
- `tests/integration/*.test.js` (3개)
- `tests/e2e/*.spec.js` (3개)
- `.eslintrc.js`, `.prettierrc`
- 코드 품질 리포트 (SonarQube)

---

### Phase 4: 최종 검증 및 배포 (Week 7-8) 🚀
**목표 버전**: v14.0.0
**기간**: 2025-11-16 ~ 2025-11-30 (2주)
**담당**: Release Team

#### 작업 목록 (실제 파일 기준)

1. **통합 테스트** (3일)
   ```javascript
   // 전체 시스템 End-to-End 테스트

   작업:
   - [ ] 핵심 사용자 시나리오 테스트 (10개)
         1. 신규 핸드 생성 → AI 분석 → 파일명 자동 생성
         2. Virtual Sheet 동기화 → Hand Sheet 매칭
         3. G열 드롭다운 변경 → Apps Script 업데이트
         4. 브라우저 알림 → 새 핸드 감지
         5. 시간 기반 행 매칭 (±3분 허용)
   - [ ] 에러 시나리오 테스트 (5개)
         - API 키 없음
         - CSV 로드 실패
         - Gemini API 응답 오류
         - 네트워크 연결 끊김
   - [ ] 성능 스트레스 테스트
         - 2000행 로드 시간
         - 동시 10개 AI 분석 요청
         - 1시간 장시간 실행 안정성

   영향 범위:
   - 신규: tests/integration/scenarios.test.js
   - 신규: tests/stress/performance.test.js
   ```

2. **보안 감사** (2일)
   ```bash
   # 최종 보안 검증

   작업:
   - [ ] OWASP ZAP 전체 스캔
   - [ ] Snyk 의존성 취약점 검사
   - [ ] Manual Penetration Testing
         - XSS 공격 시도
         - CSRF 공격 시도
         - API 키 탈취 시도
   - [ ] 취약점 발견 시 즉시 수정

   검증:
   - [ ] Critical 취약점 0개
   - [ ] High 취약점 0개
   - [ ] Medium 이하만 허용 (문서화 필수)
   ```

3. **문서화** (2일)
   ```markdown
   # 최종 문서 업데이트

   작업:
   - [ ] README.md 최신화 (v14.0.0 변경사항)
   - [ ] PRD 최종 검토 및 업데이트
   - [ ] LLD 최종 검토 및 업데이트
   - [ ] API 문서 작성 (OpenAPI 3.0)
   - [ ] 배포 가이드 작성
   - [ ] 트러블슈팅 가이드 작성

   영향 범위:
   - README.md
   - docs/PRD_virtual_table_db.md
   - docs/LLD_virtual_table_db.md
   - 신규: docs/API_SPEC.md
   - 신규: docs/DEPLOYMENT.md
   - 신규: docs/TROUBLESHOOTING.md
   ```

4. **배포 자동화** (2일)
   ```yaml
   # GitHub Actions CI/CD 파이프라인

   작업:
   - [ ] .github/workflows/ci.yml 작성
         - Lint & Format 검사
         - 단위 테스트 실행
         - E2E 테스트 실행
         - 빌드 성공 확인
   - [ ] .github/workflows/deploy.yml 작성
         - main 브랜치 푸시 시 자동 배포
         - GitHub Pages 배포
         - 롤백 시나리오 준비
   - [ ] 배포 후 자동 스모크 테스트

   영향 범위:
   - 신규: .github/workflows/ci.yml
   - 신규: .github/workflows/deploy.yml
   ```

5. **릴리스 노트 작성** (1일)
   ```markdown
   # v14.0.0 릴리스 노트

   작업:
   - [ ] 변경사항 요약 (Breaking Changes 우선)
   - [ ] 기능 개선 목록
   - [ ] 버그 수정 목록
   - [ ] 알려진 이슈 문서화
   - [ ] 마이그레이션 가이드 (v13 → v14)

   영향 범위:
   - 신규: CHANGELOG.md
   - 신규: docs/MIGRATION_v13_to_v14.md
   ```

#### 검증 기준
- [ ] 모든 E2E 테스트 통과 (100%)
- [ ] 보안 취약점 Critical/High 0개
- [ ] 성능 목표 달성:
      - 번들 크기 < 200KB ✅
      - 초기 로딩 < 2초 ✅
      - Lighthouse > 90 ✅
- [ ] 문서 완성도 100%
- [ ] 배포 자동화 성공

#### 산출물
- `CHANGELOG.md`
- `docs/API_SPEC.md`
- `docs/DEPLOYMENT.md`
- `docs/TROUBLESHOOTING.md`
- `.github/workflows/*.yml`
- v14.0.0 릴리스 태그

---

## 📊 성공 기준

### KPI 목표
| 지표 | 현재 (v13.5.11) | 목표 (v14.0.0) | 측정 방법 |
|------|-----------------|----------------|-----------|
| 번들 크기 | 357KB | < 200KB | webpack-bundle-analyzer |
| 초기 로딩 | ~3초 | < 2초 | Lighthouse |
| 보안 취약점 | 12개 | 0개 (Critical/High) | OWASP ZAP + Snyk |
| 테스트 커버리지 | 0% | ≥ 80% | Vitest coverage |
| Lighthouse 점수 | 60 | > 90 | Chrome DevTools |
| 평균 복잡도 | 15~22 | < 8 | SonarQube |

### 품질 게이트
- [ ] Phase 1: 보안 취약점 0개 (Critical/High)
- [ ] Phase 2: 성능 목표 달성 (번들 < 200KB, 로딩 < 2초)
- [ ] Phase 3: 테스트 커버리지 ≥ 80%
- [ ] Phase 4: 모든 E2E 테스트 통과

**각 Phase 완료 후 품질 게이트 검증 필수. 미달 시 다음 Phase 진행 불가.**

---

## 🎯 최종 체크리스트

### 배포 전 필수 확인사항
- [ ] 모든 테스트 통과 (단위 + 통합 + E2E)
- [ ] 보안 스캔 Clean (OWASP ZAP + Snyk)
- [ ] 성능 벤치마크 목표 달성
- [ ] 문서 최신화 완료
- [ ] 롤백 계획 수립
- [ ] 스테이징 환경 검증 완료

### v14.0.0 릴리스 체크리스트
- [ ] Git 태그 생성: `v14.0.0`
- [ ] GitHub Release 생성 (CHANGELOG 포함)
- [ ] main 브랜치 배포
- [ ] 배포 후 스모크 테스트 실행
- [ ] 모니터링 대시보드 확인 (24시간)
- [ ] 사용자 피드백 수집

---

**문서 버전**: 1.1.0 (업데이트: 2025-10-05)
**작성자**: Development Team
**검토자**: Tech Lead
1. **Jest 단위 테스트** (4일)
   ```javascript
   // 구현 계획
   - [ ] Jest 환경 설정
   - [ ] 핵심 모듈 테스트 작성
   - [ ] Mock/Stub 구현
   - [ ] 커버리지 80% 달성
   ```

2. **Playwright E2E 테스트** (3일)
   ```javascript
   // 시나리오
   - [ ] 핸드 모니터링 플로우
   - [ ] AI 분석 플로우
   - [ ] 파일명/자막 생성 플로우
   - [ ] 에러 시나리오
   ```

3. **GitHub Actions CI/CD** (2일)
   ```yaml
   # 파이프라인 구성
   - [ ] 린트 검사
   - [ ] 단위 테스트
   - [ ] E2E 테스트
   - [ ] 빌드 및 배포
   ```

4. **성능 모니터링** (2일)
   ```javascript
   // 구현 계획
   - [ ] Lighthouse CI 설정
   - [ ] 성능 메트릭 수집
   - [ ] 알림 설정
   - [ ] 대시보드 구축
   ```

5. **문서 최종 검토** (3일)
   ```markdown
   # 검토 항목
   - [ ] PRD 업데이트
   - [ ] LLD 업데이트
   - [ ] PLAN 완료 체크
   - [ ] CHANGELOG 작성
   ```

#### 검증 기준
- [ ] 테스트 커버리지 > 80%
- [ ] E2E 테스트 100% 통과
- [ ] CI/CD 파이프라인 안정
- [ ] 문서 최신화 100%

#### 산출물
- `jest.config.js`
- `tests/` (전체 테스트 스위트)
- `.github/workflows/ci-cd.yml`
- `CHANGELOG.md`
- v14.0.0 릴리즈 노트

---

## ✅ 작업 체크리스트

### 전체 진행 상황
```
Phase 1 (보안):    [ ] 0/15 완료
Phase 2 (성능):    [ ] 0/14 완료
Phase 3 (품질):    [ ] 0/13 완료
Phase 4 (테스트):  [ ] 0/14 완료

전체:              [ ] 0/56 완료 (0%)
```

### Phase 1: 보안 강화 체크리스트
- [ ] CryptoJS 라이브러리 추가
- [ ] SecureStorage 클래스 구현
- [ ] API 키 암호화 적용
- [ ] DOMPurify 라이브러리 추가
- [ ] innerHTML → sanitize 교체 (19곳)
- [ ] CORS 헤더 강화
- [ ] doOptions() 핸들러 추가
- [ ] Validator 클래스 작성
- [ ] 입력 검증 로직 추가
- [ ] .env.example 파일 작성
- [ ] GitHub Secrets 설정
- [ ] 하드코딩 URL 제거
- [ ] XSS 공격 테스트
- [ ] 보안 스캔 실행
- [ ] v13.6.0 릴리즈

### Phase 2: 성능 최적화 체크리스트
- [ ] Vite 빌드 도구 도입
- [ ] 코드 스플리팅 설정
- [ ] 불필요한 코드 제거
- [ ] Tree-shaking 적용
- [ ] 동적 import() 적용
- [ ] Virtual Scrolling 구현
- [ ] Debounce/Throttle 적용
- [ ] SmartCache 클래스 구현
- [ ] LRU 알고리즘 적용
- [ ] CSV 파싱 워커 작성
- [ ] AI 분석 워커 작성
- [ ] Lighthouse 점수 측정
- [ ] 성능 벤치마크
- [ ] v13.7.0 릴리즈

### Phase 3: 코드 품질 체크리스트
- [ ] 모듈 구조 재설계
- [ ] index.html 분리
- [ ] 전역 변수 감소
- [ ] ESLint 설정
- [ ] 네이밍 컨벤션 통일
- [ ] ErrorHandler 클래스 작성
- [ ] 에러 코드 체계 정의
- [ ] SonarQube 스캔
- [ ] 중복 코드 제거
- [ ] JSDoc 주석 추가
- [ ] API 문서 생성
- [ ] README 업데이트
- [ ] v13.8.0 릴리즈

### Phase 4: 테스트 및 CI/CD 체크리스트
- [ ] Jest 환경 설정
- [ ] 단위 테스트 작성
- [ ] Mock/Stub 구현
- [ ] 커버리지 80% 달성
- [ ] Playwright 설정
- [ ] E2E 시나리오 작성
- [ ] GitHub Actions 설정
- [ ] CI/CD 파이프라인 구축
- [ ] Lighthouse CI 설정
- [ ] 성능 모니터링 구축
- [ ] PRD/LLD/PLAN 업데이트
- [ ] CHANGELOG 작성
- [ ] 릴리즈 노트 작성
- [ ] v14.0.0 릴리즈

---

## 🚨 리스크 관리

### 리스크 식별 및 대응

#### R1: 보안 취약점 패치 시 기능 오류
**확률**: 중간 | **영향도**: 높음
- **완화**: 단위 테스트 먼저 작성
- **대응**: 각 변경 후 회귀 테스트
- **롤백**: Git 태그로 이전 버전 복구

#### R2: 성능 최적화 후 호환성 문제
**확률**: 낮음 | **영향도**: 중간
- **완화**: 브라우저 호환성 테스트
- **대응**: Polyfill 추가
- **롤백**: 기존 빌드 설정 유지

#### R3: 모듈화 과정에서 의존성 순환
**확률**: 높음 | **영향도**: 중간
- **완화**: 의존성 그래프 분석
- **대응**: 인터페이스/추상화 계층 추가
- **롤백**: 단계별 커밋으로 복구

#### R4: 테스트 커버리지 목표 미달성
**확률**: 중간 | **영향도**: 낮음
- **완화**: 우선순위 모듈부터 테스트
- **대응**: 목표를 70%로 조정
- **롤백**: N/A (품질 이슈)

#### R5: CI/CD 파이프라인 실패
**확률**: 낮음 | **영향도**: 중간
- **완화**: 로컬 환경에서 사전 테스트
- **대응**: GitHub Actions 로그 분석
- **롤백**: 수동 배포로 전환

### 리스크 매트릭스

```
영향도 ↑
     │  R1
 높음 │  ■
     │
 중간 │     R3, R2, R5
     │     ■  ■  ■
 낮음 │           R4
     │           ■
     └─────────────→ 확률
      낮음 중간 높음
```

### 비상 계획

#### 보안 패치 실패 시
```bash
# 1. 이전 안정 버전으로 롤백
git checkout v13.5.11
git push -f origin main

# 2. 핫픽스 브랜치 생성
git checkout -b hotfix/security-patch

# 3. 최소한의 패치 적용
# (API 키 암호화만 우선 적용)

# 4. 긴급 릴리즈
git tag v13.5.12-hotfix
git push origin v13.5.12-hotfix
```

#### 성능 저하 발견 시
```javascript
// Feature Flag로 롤백
const FEATURE_FLAGS = {
  USE_VIRTUAL_SCROLL: false, // 문제 발생 시 false
  USE_WEB_WORKER: false,
  USE_CODE_SPLITTING: false
};

if (FEATURE_FLAGS.USE_VIRTUAL_SCROLL) {
  // 새 기능
} else {
  // 기존 기능 (폴백)
}
```

---

## 🎯 성공 기준

### 정량적 지표

| 카테고리 | 메트릭 | 현재 | 목표 | 달성 조건 |
|---------|--------|------|------|----------|
| **보안** | 취약점 수 | 12개 | 0개 | Critical/High 0개 |
| **보안** | 보안 스캔 점수 | C | A | Snyk Grade A |
| **성능** | 번들 크기 | 357KB | 180KB | < 200KB |
| **성능** | 초기 로딩 | 3초 | 1.5초 | < 2초 |
| **성능** | Lighthouse | 60점 | 90점 | > 85점 |
| **품질** | 테스트 커버리지 | 0% | 80% | > 75% |
| **품질** | 중복 코드 | 28% | 5% | < 10% |
| **품질** | 전역 변수 | 116개 | 10개 | < 15개 |

### 정성적 지표

#### 코드 품질
- [ ] ESLint 에러 0개
- [ ] 순환 복잡도 < 10
- [ ] JSDoc 주석 90% 이상
- [ ] 네이밍 컨벤션 100% 준수

#### 안정성
- [ ] 가동률 99.9% 유지
- [ ] 에러율 < 0.1%
- [ ] 평균 응답 시간 < 2초
- [ ] 데이터 일관성 100%

#### 사용성
- [ ] 신규 사용자 온보딩 < 10분
- [ ] 핵심 기능 접근 < 3클릭
- [ ] 모바일 반응형 지원
- [ ] 접근성 Level A 준수

### 마일스톤 검증

#### v13.6.0 검증 (보안)
```bash
# 자동 검증
npm run security:scan
npm run test:security

# 수동 검증
- [ ] XSS 공격 테스트
- [ ] API 키 암호화 확인
- [ ] CORS Preflight 테스트
- [ ] 침투 테스트 (선택)
```

#### v13.7.0 검증 (성능)
```bash
# 자동 검증
npm run lighthouse
npm run test:performance

# 수동 검증
- [ ] 번들 크기 측정
- [ ] 로딩 시간 측정
- [ ] 메모리 프로파일링
- [ ] 네트워크 최적화 확인
```

#### v13.8.0 검증 (품질)
```bash
# 자동 검증
npm run lint
npm run test:unit

# 수동 검증
- [ ] 코드 리뷰
- [ ] SonarQube 리포트
- [ ] 중복 코드 확인
- [ ] 문서 완성도 체크
```

#### v14.0.0 검증 (통합)
```bash
# 자동 검증
npm run test:e2e
npm run test:all

# 수동 검증
- [ ] 전체 기능 테스트
- [ ] 크로스 브라우저 테스트
- [ ] UAT (사용자 승인 테스트)
- [ ] 릴리즈 준비도 체크
```

---

## 📊 진행 상황 추적

### 주간 체크인

#### Week 1 (2025-10-05)
- [ ] Phase 1 킥오프
- [ ] 보안 감사 실행
- [ ] CryptoJS 통합 시작

#### Week 2 (2025-10-12)
- [ ] Phase 1 완료
- [ ] v13.6.0 릴리즈
- [ ] 보안 테스트 보고서

#### Week 3 (2025-10-19)
- [ ] Phase 2 킥오프
- [ ] Vite 마이그레이션 시작
- [ ] 번들 크기 측정

#### Week 4 (2025-10-26)
- [ ] Phase 2 완료
- [ ] v13.7.0 릴리즈
- [ ] 성능 벤치마크 리포트

#### Week 5 (2025-11-02)
- [ ] Phase 3 킥오프
- [ ] 모듈화 리팩토링 시작
- [ ] ESLint 설정

#### Week 6 (2025-11-09)
- [ ] Phase 3 완료
- [ ] v13.8.0 릴리즈
- [ ] 코드 품질 리포트

#### Week 7 (2025-11-16)
- [ ] Phase 4 킥오프
- [ ] 테스트 작성 시작
- [ ] CI/CD 파이프라인 구축

#### Week 8 (2025-11-23)
- [ ] Phase 4 완료
- [ ] v14.0.0 릴리즈
- [ ] 최종 검토 및 배포

### 일일 스탠드업 (Daily)

**형식**:
```markdown
## [날짜] 일일 진행 현황

### 어제 완료
- [x] Task A
- [x] Task B

### 오늘 계획
- [ ] Task C
- [ ] Task D

### 이슈/블로커
- 이슈 1: 설명...
  → 해결 방안: ...

### 도움 요청
- 요청사항...
```

---

## 📚 부록

### A. 도구 및 라이브러리

```json
{
  "devDependencies": {
    "vite": "^5.0.0",
    "jest": "^29.0.0",
    "@playwright/test": "^1.40.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  },
  "dependencies": {
    "dompurify": "^3.0.0",
    "crypto-js": "^4.2.0",
    "papaparse": "^5.4.1"
  }
}
```

### B. 참고 문서

- [PRD](./PRD_virtual_table_db.md) - 제품 요구사항
- [LLD](./LLD_virtual_table_db.md) - 기술 설계
- [코드 리뷰 보고서](./docs/CODE_REVIEW_2025-10-05.md)

### C. 연락처

| 역할 | 이름 | 연락처 |
|-----|------|--------|
| PM | - | - |
| Tech Lead | - | - |
| Security | - | - |
| QA | - | - |

---

**작성자**: Project Manager
**검토자**: Development Team
**승인자**: CTO
**다음 업데이트**: 매주 금요일
