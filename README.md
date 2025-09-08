# 🎰 포커 핸드 로거 (Poker Hand Logger)

[![Version](https://img.shields.io/badge/version-v2.8.0-green)](https://github.com/garimto81/virtual_data_claude)
[![Status](https://img.shields.io/badge/status-stable-success)](https://garimto81.github.io/virtual_data_claude/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

포커 게임의 핸드를 기록하고 AI로 칩 스택을 분석하는 웹 애플리케이션

🔗 **[라이브 데모](https://garimto81.github.io/virtual_data_claude/)**

## ✨ 주요 기능

### 🎮 게임 기록
- 핸드별 액션 기록 (Preflop, Flop, Turn, River)
- 최대 9명 플레이어 관리
- 팟 사이즈 자동 계산 (올인 제한 고려)
- Google Sheets 자동 저장
- IN/OUT 테이블 관리 시스템

### 🤖 AI 칩 분석
- 카메라로 칩 촬영 및 등록
- Gemini Vision API로 스택 분석
- 칩 개수 자동 계산
- 모바일/PC 모두 지원

### 📱 반응형 디자인
- 모바일, 태블릿, PC 최적화
- 다크 테마
- 직관적인 UI/UX
- 스마트폰 최적화 테이블 선택 UI

## 🚀 시작하기

### 온라인 사용
1. https://garimto81.github.io/virtual_data_claude/ 접속
2. 바로 사용 가능!

### 로컬 실행
```bash
# 저장소 클론
git clone https://github.com/garimto81/virtual_data_claude.git

# 디렉토리 이동
cd virtual_data_claude

# 로컬 서버 실행
python -m http.server 8080

# 브라우저에서 열기
http://localhost:8080
```

## 📖 사용법

### 1. 게임 시작
1. "새 핸드" 버튼 클릭
2. 테이블 선택 (버튼식 페이지 토글 UI)
3. 플레이어 추가 (이름, 칩 수량)

### 2. 액션 기록
1. 각 스트리트에서 액션 입력
2. Fold, Check, Call, Bet, Raise, All-in 선택
3. 금액 입력 (Bet/Raise인 경우)

### 3. 칩 분석 (AI)
1. 관리 → 칩 컬러 탭
2. "칩 추가" 클릭
3. 칩 사진 촬영 또는 파일 선택
4. 칩 값 입력
5. 플레이어별 "칩 분석" 버튼으로 스택 계산

### 4. 테이블 관리 (신규)
1. 테이블 선택 버튼 클릭
2. 검색 및 필터 (전체/활성/빈테이블)
3. 페이지별 20개 테이블 표시
4. IN/OUT 상태로 플레이어 관리

## 🛠️ 기술 스택

- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript
- **Backend**: Google Apps Script
- **Database**: Google Sheets
- **AI**: Gemini Vision API
- **Hosting**: GitHub Pages

## 📁 프로젝트 구조

```
virtual_data_claude/
├── index.html                 # 메인 애플리케이션
├── chip-analysis-module.js    # AI 칩 분석 모듈
├── table-management-v59.js    # 테이블 관리 모듈
├── mobile-camera-enhanced.js  # 모바일 카메라 최적화
├── apps-script/
│   ├── Code_v59_InOut.gs     # IN/OUT 시스템 백엔드
│   └── Initialize_Status_OneTime.gs  # 초기화 스크립트
├── README.md                  # 프로젝트 소개
├── PROJECT_DOCUMENTATION.md   # 상세 문서
├── VERSION_HISTORY.md         # 버전 이력
└── ROLLBACK_HISTORY.md       # 롤백 기록
```

## 📊 버전 정보

### 현재 버전: v2.8.0 (2025-09-08)
- ✅ 올인 제한 고려한 정확한 팟 계산 로직
- ✅ 플레이어별 칩 제한 적용
- ✅ 메인팟/사이드팟 분리 계산
- ✅ 상세 디버그 로깅

### 최근 업데이트 이력
- v2.7.0: 팟 계산 로직 개선 - 블라인드/안티 포함
- v2.6.1: getElements 오류 수정
- v2.6.0: 스마트폰 최적화 테이블 선택 UI
- v2.5.1: 카메라 번호 초기값 로직 개선
- v2.5.0: IN/OUT 테이블 관리 시스템
- v2.4.0: 카메라 번호 로딩 개선 및 Type 시트 칩 업데이트

## ⚠️ 현재 문제점 및 해결 상황

### ✅ 해결된 이슈
1. **팟 계산 오류** 
   - 문제: HARMAN 18,000칩 제한이 무시되어 과도한 팟 계산
   - 해결: v2.8.0에서 올인 제한 로직 구현
   
2. **카메라 번호 초기값**
   - 문제: 입력하지 않으면 항상 1로 설정
   - 해결: v2.5.1에서 표시된 값으로 자동 입력

3. **테이블 선택 UI**
   - 문제: 100개 테이블 관리 어려움
   - 해결: v2.6.0에서 페이지 토글 방식 구현

### 🔧 진행 중인 작업
- [ ] 팟 계산 로직 실제 테스트 및 검증
- [ ] 사이드팟 완전 구현
- [ ] 다중 올인 상황 처리

### 📝 다음 단계 계획
1. 팟 계산 로직 실제 게임 데이터로 검증
2. 복잡한 멀티웨이 팟 테스트
3. 레이크 계산 기능 추가
4. 토너먼트 모드 지원

## 🐛 알려진 제한사항

### 기능적 제한
- 칩 값 5종류 이상 등록 가능
- 칩 값 중복 체크 없음
- 사이드팟 UI 표시 미구현

### 계획된 개선사항
- [ ] 칩 값 5종류 제한
- [ ] 중복 방지 기능
- [ ] 삭제 기능 개선
- [ ] 사이드팟 시각화

## 🤝 기여하기

### 개발 가이드라인
1. feature 브랜치에서 작업
2. 충분한 테스트 후 PR 생성
3. 코드 리뷰 후 병합
4. **모든 수정 시 버전 업데이트 필수**
5. **테스트 완벽 수행 필수**
6. **README.md 업데이트 필수**

### 브랜치 전략
```
main (프로덕션)
├── develop (개발)
└── feature/* (기능 개발)
```

## 📝 문서

- [프로젝트 전체 문서](PROJECT_DOCUMENTATION.md)
- [버전 히스토리](VERSION_HISTORY.md)
- [롤백 히스토리](ROLLBACK_HISTORY.md)
- [개발 가이드라인](CLAUDE.md)

## 🔧 문제 해결

### 카메라가 작동하지 않을 때
1. HTTPS 연결 확인
2. 브라우저 카메라 권한 허용
3. 다른 앱이 카메라 사용 중인지 확인

### 데이터가 저장되지 않을 때
1. 인터넷 연결 확인
2. Google Sheets 권한 확인
3. 브라우저 쿠키/캐시 삭제

### 팟 계산이 이상할 때
1. 플레이어 초기 칩 확인
2. 블라인드/안티 설정 확인
3. 콘솔 로그에서 계산 과정 확인

## 📞 지원

- **이슈 리포트**: [GitHub Issues](https://github.com/garimto81/virtual_data_claude/issues)
- **이메일**: garimto81@gmail.com

## 📄 라이선스

MIT License - 자유롭게 사용하세요!

## 🙏 감사의 말

- Google Sheets API 제공
- Gemini API 제공
- Tailwind CSS 팀
- 모든 기여자와 사용자

---

**Made with ❤️ by garimto81 & Claude Code Assistant**

*최종 업데이트: 2025-09-08 22:00 KST*

## 📌 현재 상태 요약 (다음 작업 시작점)

### 완료된 작업
- ✅ v2.8.0 배포 완료
- ✅ 올인 제한 팟 계산 로직 구현
- ✅ CLAUDE.md에 개발 규칙 추가
- ✅ README.md 전체 업데이트

### 현재 상황
- **코드 상태**: 안정적, v2.8.0 배포됨
- **테스트 필요**: 실제 게임 데이터로 팟 계산 검증 필요
- **문서 상태**: 최신 업데이트 완료

### 다음 작업 우선순위
1. **팟 계산 검증**: ZAOUI vs HARMAN 사례로 실제 테스트
2. **사이드팟 구현**: 3명 이상 멀티웨이 팟 처리
3. **UI 개선**: 사이드팟 표시 및 언콜 베팅 시각화

### 중요 파일 경로
- 메인: `C:\claude03\virtual_data_claude\index.html`
- 테이블 관리: `C:\claude03\virtual_data_claude\table-management-v59.js`
- 백엔드: `C:\claude03\virtual_data_claude\apps-script\Code_v59_InOut.gs`
- 칩 분석: `C:\claude03\virtual_data_claude\chip-analysis-module.js`