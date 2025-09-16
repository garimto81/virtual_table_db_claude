# 🎰 Virtual Table DB Claude

## 📌 프로젝트 개요
포커 핸드 모니터링 시스템 - Google Sheets와 Apps Script를 활용한 실시간 데이터 동기화 시스템

## 🚀 주요 기능
- ✅ 실시간 포커 핸드 추적 및 분석
- ✅ Google Sheets 자동 업데이트 (F열: 파일명, H열: AI분석)
- ✅ AI 기반 핸드 분석 (Gemini API)
- ✅ CSV 파일 시간 매칭 (±3분 범위)
- ✅ 웹 기반 모니터링 대시보드
- ✅ 🔍 시트 업데이트 디버그 기능

## 📁 프로젝트 구조
```
virtual_table_db_claude/
├── index.html                  # 메인 웹 애플리케이션 (v10.1.2)
├── README.md                   # 프로젝트 개요
├── PROJECT_DOCUMENTATION.md    # 통합 프로젝트 문서
├── _config.yml                 # GitHub Pages 설정
├── scripts/                    # Apps Script 최신 버전
│   └── apps_script_v3.4.2.gs  # ⚠️ 최신 버전만 유지
└── tools/                      # 테스트 도구
    ├── quick_test.html
    └── test_connection.html
```

## 🛠️ 빠른 시작

### 1. Apps Script 배포
1. [Google Apps Script](https://script.google.com) 접속
2. 새 프로젝트 생성
3. `scripts/apps_script_v3.4.2.gs` 내용 복사/붙여넣기
4. 배포 > 새 배포 > 웹 앱
5. 액세스 권한: "모든 사용자" 설정
6. 배포 URL 복사
7. **중요**: Google Sheets에 편집자 권한 부여

### 2. 웹 앱 설정
1. https://garimto81.github.io/virtual_table_db_claude/ 접속
2. 설정 버튼 클릭
3. **메인 시트 URL** 입력 (통합 관리)
4. Apps Script URL 입력
5. 저장 및 테스트
6. 🔍 디버그 버튼으로 실시간 검증

## 📖 문서
모든 상세 설정, 문제 해결, API 정보는 [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)를 참조하세요.

### 📌 Apps Script 파일 위치
**최신 버전**: `scripts/apps_script_v3.4.4.gs`
⚠️ **중요**: 항상 최신 버전만 사용하고, 이전 버전은 모두 삭제합니다.

## 🔧 기술 스택
- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript
- **Backend**: Google Apps Script
- **Database**: Google Sheets
- **AI**: Google Gemini API
- **Hosting**: GitHub Pages

## 📊 버전
- **현재 버전**: v10.2.0
- **Apps Script**: v3.4.4
- **최종 업데이트**: 2025-01-16

### v10.2.0 업데이트 내용 (메이저 업데이트)
- ✅ **편집 버튼 자동 시트 업데이트** - 클릭 즉시 처리
- ✅ **진행 상태 팝업 로그창** - 실시간 작업 진행 표시
- ✅ **작업 중 버튼 비활성화** - 충돌 방지
- ✅ **2단계 작업 프로세스** 구현
  - 편집 버튼: 최초 등록 (E열: '미완료')
  - 완료 버튼: 최종 완료 (E열: '복사완료')
- 🔧 확인 팝업 제거로 작업 속도 향상

### v10.1.4 업데이트 내용
- ✅ E열 드롭다운 데이터 검증 규칙 자동 설정
- 🔧 초기 업데이트 시 '미완료' 기본값 설정
- 🔧 완료 처리 버튼 클릭 시 '복사완료' 자동 설정
- 📦 Apps Script v3.4.4 적용

### v10.1.3 업데이트 내용
- ✅ E열 상태 드롭다운 지원 추가 (미완료/복사완료)
- 🔧 완료 처리 버튼 행 번호 파싱 오류 수정
- 📦 Apps Script v3.4.3 적용

### v10.1.2 업데이트 내용
- 🐛 Apps Script finalAnalysis 변수 스코프 오류 수정
- ✅ 시트 업데이트 오류 메시지 해결
- 🔧 try-catch 블록 외부 변수 선언으로 참조 오류 해결
- 📦 Apps Script v3.4.2 적용 필요
- 📁 프로젝트 구조 정리 및 문서 통합

### v10.1.1 업데이트 내용
- 🔧 브라우저 캐시 문제로 인한 오류 메시지 개선
- ✅ 실제 시트 업데이트는 정상 작동
- 📦 버전 번호 업데이트로 캐시 강제 무효화

### v10.1.0 업데이트 내용
- 🔧 E열 데이터 검증 규칙 충돌 문제 해결
- ✅ verifyUpdate 액션 호환성 개선
- 📋 새 행 추가 시 자동으로 E열 검증 규칙 제거
- 🛡️ Apps Script 버전별 기능 자동 감지

### v10.0.0 업데이트 내용 (메이저 업데이트)
- 🎯 **단일 시트 통합 관리**: 읽기/쓰기 시트 통합
- 📋 하나의 시트 URL로 모든 작업 처리
- 🚀 설정 단순화 및 성능 개선
- ✅ B열: 시간 매칭 (읽기)
- ✅ F열: 파일명 업데이트 (쓰기)
- ✅ H열: AI 분석 업데이트 (쓰기)
- 🔄 기존 설정과 완벽한 호환성 유지

### v9.8.0 업데이트 내용
- 🔧 강화된 6단계 디버깅 시스템
- ✅ 실시간 시트 업데이트 검증 기능
- 🔐 Apps Script 권한 자동 진단
- 📊 업데이트 후 즉시 데이터 확인
- 🎯 더 정확한 오류 분석 및 해결책 제시
- 🔍 디버그 버튼 기능 대폭 강화

### v9.7.6 업데이트 내용
- 🔍 시트 업데이트 디버그 버튼 추가
- 실시간 시트 업데이트 검증 기능
- HTML 오류 수정 (hand-result 요소 제거 관련)
- 3단계 검증: URL 형식, Apps Script 연결, 실제 업데이트 테스트

### v9.7.5 업데이트 내용
- Apps Script 연결 테스트를 GET에서 POST로 변경
- CORS 오류 해결을 위한 text/plain Content-Type 사용
- 테스트 연결 시 action: 'test' 전송
- Apps Script v3.1 호환성 확보

### v9.7.4 업데이트 내용
- Apps Script text/plain 파싱 로직 개선
- CORS 회피용 text/plain Content-Type 지원
- 요청 타입 및 action 필드 디버그 로그 추가
- '알 수 없는 액션: unknown' 오류 해결

### v9.7.3 업데이트 내용
- 노트 섹션 완전 제거
- 2열 레이아웃으로 단순화 (핸드 목록 + 상세 정보)
- 필수 정보만 표시하여 최대 가독성 확보

### v9.7.2 업데이트 내용
- 결과 탭 제거로 UI 가독성 향상
- 핸드 목록과 핸드 상세 정보만 표시
- 노트 영역 확대로 사용성 개선

### v9.7.1 업데이트 내용
- 무한 알림 루프 문제 해결
- notifiedHands 로드 시 디버그 로그 추가
- 새 알림 트리거 전 기존 알림 확인 로직 추가
- 중복 알림 방지 검증 강화

### v9.7.0 업데이트 내용
- CSV 행 번호 불일치 자동 감지 및 보정
- 실제 위치 기반 데이터 재슬라이싱
- CSV 파싱 오류 방지 로직 강화

### v9.6.8 업데이트 내용
- 모든 버전 표시를 APP_VERSION 상수로 통일
- 동적 버전 업데이트 (HTML, 타이틀, UI)
- 하드코딩된 버전 번호 모두 제거
- 버전 관리 중앙화로 유지보수성 향상

### v9.6.7 업데이트 내용
- 강력한 버전 체크 및 자동 업데이트 시스템 추가
- 버전 변경 시 자동 캐시 초기화 (중요 설정은 보존)
- Tailwind CSS 버전 파라미터 추가
- 빌드 타임스탬프 추가로 정확한 버전 추적

### v9.6.6 업데이트 내용
- CSV BOARD 오타(BO\ARD) 처리 추가
- 보드 카드 개수 기반 스트리트 판단 로직으로 변경
- POT CORRECTION 이벤트 처리 추가
- 카드 문자열 파싱 개선 (Qs2h 형식 지원)
- 플레이어 seat 매핑 정확도 향상

### v9.6.5 업데이트 내용
- 카드 10을 T로 표시하도록 변경
- 입력은 10과 T 둘 다 인식 가능하도록 개선
- 통계 섹션 UI 제거
- 카드 파싱 로직 강화 (대소문자, 숫자 형식 지원)

### v9.6.4 업데이트 내용
- CORS 오류 해결을 위해 Content-Type을 text/plain으로 변경
- Apps Script와의 호환성 개선

### v9.6.3 업데이트 내용
- Apps Script 통신 방식 통일 (JSON)
- POST 요청 일관성 개선
- 새 Apps Script URL 적용

### v9.6.1 업데이트 내용
- 시간 매칭 오차 수정
- Seoul 시간대 변환 로직 제거
- Apps Script 변수 스코프 오류 수정

## 🐛 문제 해결

### 🔍 시트 업데이트 문제
1. 헤더의 **🔍 디버그** 버튼 클릭
2. 3단계 검증 수행
3. 실제 테스트 데이터 입력 확인

### 상세 가이드
- [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)의 문제 해결 섹션 참조
- CORS 오류, 캐시 문제, 권한 설정 등

## 📞 지원
- GitHub Issues: [Report Issue](https://github.com/garimto81/virtual_table_db_claude/issues)
- 문서: [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)

---
© 2025 Virtual Table DB Team