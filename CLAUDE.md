# Claude AI 개발 가이드라인 v2.0

## 🎯 핵심 원칙

### 1. 자동화 우선 개발 철학
- **모든 반복 작업은 자동화**: 수동 작업 최소화
- **Subagent 적극 활용**: 전문 영역별 에이전트 활용
- **MCP 도구 우선 사용**: 가능한 모든 작업에 MCP 도구 활용
- **병렬 처리 기본**: 독립적 작업은 동시 실행

### 2. 언어 및 소통 원칙
- **한글 우선 정책**: 모든 응답과 주석은 한글로 작성
- **명확한 커뮤니케이션**: 기술 용어는 한글(영문) 형식
- **사용자 중심 안내**: 작업 진행 상황 실시간 공유

## 🔄 작업 수행 프로세스

### 🔥 최우선 체크리스트 (Daily Start)
```yaml
📊 AI 결과물 추출 결과 대기중
- 현재 상태: v12.15.8 AI 프롬프트 최적화 완료
- 다음 단계: 실제 편집 버튼 테스트로 AI 프롬프트 개선 효과 확인
- 확인 항목:
  ✓ 파일명 밑줄 정리 작동 여부
  ✓ BB 획득 정보 간결 표시 여부
  ✓ 3단어 제한 AI 요약 정확도
  ✓ 장황한 분석 제거 확인
```

### 📋 작업 시작 전 체크리스트
```yaml
1. TodoWrite로 작업 계획 수립
2. 적절한 Subagent 선정
3. 필요한 MCP 도구 확인
4. 병렬 처리 가능 작업 식별
```

### 🚀 코드 수정 후 자동 실행 절차
```bash
# ✅ 자동으로 수행되는 작업
1. 로컬 테스트 실행
2. 버전 번호 자동 증가
   - Major (x.0.0): 대규모 변경
   - Minor (0.x.0): 새 기능 추가
   - Patch (0.0.x): 버그 수정
3. README.md 변경사항 기록
4. Git 커밋 생성
5. GitHub 푸시
6. WebFetch로 배포 확인
7. 브라우저 캐시 초기화 안내
```

### 📝 Git 커밋 메시지 규칙
```
feat: 새로운 기능 추가
fix: 버그 수정
refactor: 코드 개선
docs: 문서 수정
style: 스타일 변경
test: 테스트 추가/수정
chore: 기타 변경사항
perf: 성능 개선
```

## 🛠️ Subagent 활용 가이드

### 🎨 개발 영역별 전문 에이전트

#### 백엔드 개발
```yaml
backend-architect: API 설계, DB 스키마 구성
python-pro: 고급 Python 패턴, 최적화
deployment-engineer: CI/CD, 배포 자동화
database-optimizer: 쿼리 최적화, 인덱싱
```

#### 프론트엔드 개발
```yaml
frontend-developer: Next.js/React 구현
typescript-expert: 타입 시스템 설계
graphql-architect: GraphQL 스키마 구축
performance-engineer: 프론트엔드 성능 최적화
```

#### 데이터 & AI
```yaml
data-scientist: 데이터 분석, SQL 쿼리
ml-engineer: ML 파이프라인 구축
ai-engineer: LLM 통합, RAG 구현
data-engineer: ETL 파이프라인 설계
```

#### 인프라 & 운영
```yaml
cloud-architect: AWS/GCP/Azure 설계
devops-troubleshooter: 운영 이슈 해결
security-auditor: 보안 취약점 점검
deployment-engineer: 배포 전략 수립
```

#### 품질 관리
```yaml
test-automator: 테스트 자동화
code-reviewer: 코드 리뷰
debugger: 버그 추적 및 수정
security-auditor: OWASP 준수 검증
```

### 🔧 작업별 Subagent 조합 예시

#### 새 기능 개발
```mermaid
1. backend-architect → API 설계
2. test-automator → TDD 테스트 작성
3. python-pro/frontend-developer → 구현
4. code-reviewer → 코드 검토
5. deployment-engineer → 배포
```

#### 버그 수정
```mermaid
1. debugger → 원인 분석
2. devops-troubleshooter → 시스템 점검
3. 코드 수정
4. test-automator → 테스트
5. security-auditor → 보안 검증
```

#### 성능 최적화
```mermaid
1. performance-engineer → 병목 분석
2. database-optimizer → DB 최적화
3. python-pro → 코드 개선
4. 성능 테스트 및 모니터링
```

## 🔌 MCP 도구 활용

### 📦 주요 MCP 도구 및 용도

#### Supabase MCP
```yaml
용도: 데이터베이스 관리, 실시간 기능
주요 기능:
  - list_projects: 프로젝트 목록
  - execute_sql: SQL 실행
  - apply_migration: 마이그레이션
  - get_advisors: 보안 검사
```

#### Context7 MCP
```yaml
용도: 라이브러리 문서 확인, 버전 관리
주요 기능:
  - resolve-library-id: 라이브러리 ID 확인
  - get-library-docs: 최신 문서 조회
  - 마이그레이션 가이드 제공
```

#### Exa MCP
```yaml
용도: 웹 검색, 정보 수집
주요 기능:
  - web_search_exa: 고급 웹 검색
  - company_research_exa: 기업 정보
  - deep_researcher_start: 심층 분석
```

#### GitHub MCP
```yaml
용도: 저장소 관리, 이슈 트래킹
주요 기능:
  - search_repositories: 저장소 검색
  - create_issue: 이슈 생성
  - create_pull_request: PR 생성
```

#### Sequential Thinking MCP
```yaml
용도: 복잡한 문제 분해, 단계별 해결
주요 기능:
  - 논리적 사고 체인 구성
  - 문제 분해 및 분석
  - 순차적 해결 방안 도출
```

## 📊 프로젝트 관리

### 🗂️ 프로젝트 구조
```
C:\claude01\
├── CLAUDE.md           # 메인 가이드라인
├── PROJECT_NOTES.md    # 프로젝트별 주의사항
├── README.md          # 전체 프로젝트 설명
└── [프로젝트 폴더]/
    ├── PROJECT_NOTES.md  # 개별 프로젝트 가이드
    └── README.md        # 프로젝트별 문서
```

### 📈 버전 관리 자동화
```javascript
// 버전 업데이트 자동 수행
const updateVersion = (type) => {
  // type: 'major' | 'minor' | 'patch'
  1. package.json 버전 업데이트
  2. index.html APP_VERSION 수정
  3. README.md 버전 기록 추가
  4. CHANGELOG.md 자동 생성
};
```

### 🔍 품질 보증 체크리스트
```yaml
코드 작성 완료:
  ✓ 단위 테스트 작성
  ✓ 통합 테스트 실행
  ✓ 린트 검사 통과
  ✓ 타입 체크 통과
  ✓ 보안 취약점 스캔

배포 전:
  ✓ 성능 테스트
  ✓ 브라우저 호환성
  ✓ 모바일 반응형
  ✓ 접근성 검사
  ✓ SEO 최적화
```

## 🔄 정기 유지보수

### 📅 일일 점검
- [ ] 테스트 스위트 실행
- [ ] API 사용량 모니터링
- [ ] 에러 로그 분석
- [ ] 성능 메트릭 확인

### 📅 주간 점검
- [ ] 의존성 업데이트 확인
- [ ] 보안 패치 적용
- [ ] 백업 무결성 검증
- [ ] 코드 커버리지 분석

### 📅 월간 점검
- [ ] 전체 문서 업데이트
- [ ] 인프라 비용 최적화
- [ ] 성능 벤치마크
- [ ] 사용자 피드백 분석

## 💡 베스트 프랙티스

### 🚀 성능 최적화
1. **병렬 처리**: 독립적 작업은 동시 실행
2. **캐싱 전략**: 반복 데이터 캐시 활용
3. **지연 로딩**: 필요시에만 리소스 로드
4. **코드 분할**: 번들 크기 최적화

### 🛡️ 보안 강화
1. **환경 변수**: 민감 정보 분리
2. **권한 최소화**: 필요한 권한만 부여
3. **입력 검증**: 모든 사용자 입력 검증
4. **정기 감사**: 보안 취약점 스캔

### 📝 문서화
1. **코드 즉시 문서화**: 작성과 동시 진행
2. **예제 포함**: 실제 사용 예시 제공
3. **변경 이력**: 모든 변경사항 기록
4. **API 문서**: OpenAPI 스펙 유지

## 🆘 문제 해결 가이드

### 🐛 일반적인 이슈 해결
```yaml
빌드 실패:
  1. 의존성 재설치: npm ci
  2. 캐시 초기화: npm cache clean --force
  3. node_modules 재생성

테스트 실패:
  1. 테스트 DB 초기화
  2. 목업 데이터 확인
  3. 타임존 설정 확인

배포 실패:
  1. 환경 변수 확인
  2. 빌드 로그 분석
  3. 롤백 준비
```

### 📞 도움말 및 지원
- **Claude Code 문서**: https://docs.anthropic.com/en/docs/claude-code
- **이슈 제보**: https://github.com/anthropics/claude-code/issues
- **커뮤니티 포럼**: 활발한 토론 참여
- **긴급 지원**: 우선순위별 대응

## 🎓 학습 리소스

### 📚 추천 자료
- Subagent 활용 가이드
- MCP 도구 마스터 클래스
- 성능 최적화 베스트 프랙티스
- 보안 코딩 가이드라인

### 🏆 인증 및 자격
- Claude AI 개발자 인증
- 클라우드 아키텍처 자격
- 보안 전문가 인증

---

**📌 중요**: 이 가이드라인은 Claude AI가 프로젝트 작업 시 자동으로 참조합니다.
모든 작업은 이 가이드라인에 따라 자동화되어 수행됩니다.

**최종 수정일**: 2025-09-17
**버전**: v2.0.0