# 🎰 포커 핸드 로거 (Poker Hand Logger)

[![Version](https://img.shields.io/badge/version-v2.4.0-green)](https://github.com/garimto81/virtual_data_claude)
[![Status](https://img.shields.io/badge/status-stable-success)](https://garimto81.github.io/virtual_data_claude/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

포커 게임의 핸드를 기록하고 AI로 칩 스택을 분석하는 웹 애플리케이션

🔗 **[라이브 데모](https://garimto81.github.io/virtual_data_claude/)**

## ✨ 주요 기능

### 🎮 게임 기록
- 핸드별 액션 기록 (Preflop, Flop, Turn, River)
- 최대 9명 플레이어 관리
- 팟 사이즈 자동 계산
- Google Sheets 자동 저장

### 🤖 AI 칩 분석
- 카메라로 칩 촬영 및 등록
- Gemini Vision API로 스택 분석
- 칩 개수 자동 계산
- 모바일/PC 모두 지원

### 📱 반응형 디자인
- 모바일, 태블릿, PC 최적화
- 다크 테마
- 직관적인 UI/UX

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
2. 테이블 선택 또는 생성
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
├── mobile-camera-enhanced.js  # 모바일 카메라 최적화
├── README.md                  # 프로젝트 소개
├── PROJECT_DOCUMENTATION.md   # 상세 문서
├── VERSION_HISTORY.md         # 버전 이력
└── ROLLBACK_HISTORY.md       # 롤백 기록
```

## 📊 버전 정보

### 현재 버전: v2.4.0 (2025-09-08)
- ✅ 테이블 관리 시스템 추가
- ✅ 플레이어 데이터베이스 구현
- ✅ 실시간 칩 수정 기능

### 최근 업데이트
- 테이블 생성 및 관리
- 플레이어 등록 시스템
- 노터블 플레이어 표시
- 빠른 칩 조정 버튼

## ⚠️ 알려진 이슈

### 현재 제한사항
- 칩 값 자유 입력 (제한 없음)
- 칩 값 중복 가능
- 칩 삭제 기능 없음

### 해결 예정
- [ ] 칩 값 5종류 제한
- [ ] 중복 방지 기능
- [ ] 삭제 기능 추가

## 🤝 기여하기

### 개발 가이드라인
1. feature 브랜치에서 작업
2. 충분한 테스트 후 PR 생성
3. 코드 리뷰 후 병합

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

## 🔧 문제 해결

### 카메라가 작동하지 않을 때
1. HTTPS 연결 확인
2. 브라우저 카메라 권한 허용
3. 다른 앱이 카메라 사용 중인지 확인

### 데이터가 저장되지 않을 때
1. 인터넷 연결 확인
2. Google Sheets 권한 확인
3. 브라우저 쿠키/캐시 삭제

## 📞 지원

- **이슈 리포트**: [GitHub Issues](https://github.com/garimto81/virtual_data_claude/issues)
- **이메일**: (이메일 주소)

## 📄 라이선스

MIT License - 자유롭게 사용하세요!

## 🙏 감사의 말

- Google Sheets API 제공
- Gemini API 제공
- Tailwind CSS 팀
- 모든 기여자와 사용자

---

**Made with ❤️ by garimto81 & Claude Code Assistant**

*최종 업데이트: 2025-09-08*