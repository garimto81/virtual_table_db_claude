# 📚 Virtual Data Claude - 통합 문서

> 🎯 **Poker Hand Logger v2.8.2** - Google Sheets 기반 포커 핸드 기록 시스템
> 
> 최종 업데이트: 2025-01-10

---

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [시스템 구조](#시스템-구조)
3. [설치 및 배포](#설치-및-배포)
4. [기능 가이드](#기능-가이드)
5. [개발 가이드](#개발-가이드)
6. [문제 해결](#문제-해결)
7. [버전 히스토리](#버전-히스토리)

---

## 프로젝트 개요

### 🎯 주요 기능
- 실시간 포커 핸드 기록 및 관리
- Google Sheets 통합 데이터베이스
- 플레이어 IN/OUT 상태 관리
- 자동 팟 계산 및 칩 추적
- 카메라 번호 자동 증가
- 국가 정보 매핑 시스템

### 🏗️ 기술 스택
- **Frontend**: Vanilla JavaScript, Tailwind CSS
- **Backend**: Google Apps Script v59
- **Database**: Google Sheets (Type, Index, Hand)
- **API**: Gemini Vision API (칩 분석)

### 📊 시트 구조

#### Type 시트 (플레이어 관리)
```
A: Camera Preset  | B: Player | C: Table | D: Notable | E: Chips
F: UpdatedAt | G: Seat | H: Status | I: pic | J: Country | K: CountryVerified
```

#### Index 시트 (핸드 메타데이터)
```
A: HandNumber | B: DateTime | C: Street | D: Pot | E: Board
F: Winners | G: WorkStatus | H-M: 카메라 정보 | N: 타임스탬프
```

#### Hand 시트 (상세 기록)
```
A: 행번호 | B: PLAYER/액션 | C: 플레이어명 | D: 좌석
E: 0(고정) | F: 시작칩 | G: 종료칩 | H: 핸드번호
```

---

## 시스템 구조

### 📁 파일 구조
```
virtual_data_claude/
├── index.html                 # 메인 애플리케이션
├── apps-script/              
│   ├── Code_v59_InOut.gs     # 메인 백엔드
│   ├── OneTimeCountryUpdate.gs # 국가 정보 업데이트
│   └── UpdateCountryInfo.gs   # 국가 매핑 로직
└── DOCUMENTATION.md           # 통합 문서
```

### 🔄 데이터 흐름
1. **초기 로드**: Type/Index 시트에서 데이터 로드
2. **플레이어 관리**: IN/OUT 상태 전환
3. **액션 기록**: Street별 액션 저장
4. **시트 전송**: Hand/Index 시트에 일괄 저장
5. **다음 핸드**: 자동 증가 및 초기화

---

## 설치 및 배포

### 🚀 Google Apps Script 배포

#### 1. 시트 ID 설정
```javascript
const SHEET_ID = 'YOUR_SHEET_ID_HERE';
```

#### 2. Apps Script 설정
1. Google Sheets 열기
2. 확장 프로그램 → Apps Script
3. `Code_v59_InOut.gs` 내용 붙여넣기
4. 저장 및 배포

#### 3. 웹 앱 배포
```
배포 → 새 배포
- 유형: 웹 앱
- 실행: 나
- 액세스: 모든 사용자
```

#### 4. CORS 설정
```javascript
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
```

### 📱 프론트엔드 설정

#### 1. API URL 설정
```javascript
const API_BASE_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

#### 2. 로컬 테스트
```bash
# Live Server 사용
# 또는 Python 서버
python -m http.server 8000
```

---

## 기능 가이드

### 👥 플레이어 관리

#### IN/OUT 상태 전환
- **IN 추가**: "추가" 버튼 → 플레이어 선택 → 칩 입력
- **OUT 처리**: 플레이어 카드의 "OUT" 버튼 클릭
- **상태 확인**: Type 시트 H열에서 확인

#### 칩 관리
- 자동 포맷: 1,000 단위 쉼표
- 무한 버그 수정: 2,000,000 이상 정상 처리
- 승자 선택 시 팟 자동 가산

### 🎮 핸드 진행

#### Street 진행
1. **Preflop**: 기본 시작
2. **Flop**: 3장 커뮤니티 카드
3. **Turn**: 1장 추가
4. **River**: 마지막 1장

#### 액션 기록
- Fold, Check, Call, Bet, Raise, All-in
- 금액 입력: 키패드 사용
- Pot Correction: 팟 크기 수동 조정

### 🏆 승자 처리

#### 승자 선택
1. 하단 승자 버튼 클릭
2. 팟 자동 계산 및 칩 추가
3. Index 시트 F열에 기록

#### 승자 저장 문제 해결
```javascript
// index.html 수정 (2240줄)
const indexMeta = {
  // ... 기존 필드
  winners: getWinnerNames(), // 추가
};

function getWinnerNames() {
  return window.state.playersInHand
    .filter(p => p.role === 'winner')
    .map(p => p.name)
    .join(', ');
}
```

### 🌍 국가 정보 시스템

#### 1회성 업데이트 실행
```javascript
// Apps Script에서 실행
runOneTimeCountryUpdate()
```

#### 매핑 데이터 (55명)
- 🇨🇦 캐나다: 50명
- 🇯🇵 일본: 1명 (Daisuke Watanabe)
- 🇮🇷 이란: 1명 (Kianoosh Haghighi)
- 🇫🇷 프랑스: 2명 (Sami Ouladitto, Audrey Slama)

#### 수동 수정
```javascript
updatePlayerCountry("플레이어명", "KR");
```

---

## 개발 가이드

### 🔧 주요 함수

#### Frontend (index.html)

```javascript
// 초기화
loadInitial() // Type/Index 로드
resetApp()    // 새 핸드 시작

// 플레이어 관리
togglePlayerInOut(name, isIn)
setPlayerRole(name) // 승자 설정

// 액션 처리
addActionToLog(action, amount)
saveActionState()

// 시트 전송
sendDataToGoogleSheet()
```

#### Backend (Code_v59_InOut.gs)

```javascript
// 데이터 로드
getTypeSheetData()
getIndexSheetData()

// 플레이어 관리
togglePlayerStatus(player, status)

// 핸드 저장
saveHandResult(data)
```

### 📝 디버깅

#### 콘솔 로그
```javascript
// 상세 로그 활성화
console.log(`🔍 디버그: ${message}`);
```

#### 로그 모달
- F12 → Console
- 로그 모달 자동 표시
- 타임스탬프 포함

### 🔄 버전 관리

#### 버전 형식
```
v2.X.Y
- X: 주요 기능 추가
- Y: 버그 수정/개선
```

#### 커밋 메시지
```bash
git commit -m "feat: 기능 추가
fix: 버그 수정
refactor: 코드 개선"
```

---

## 문제 해결

### ❌ 일반적인 문제

#### 1. CORS 오류
```javascript
// Apps Script에 추가
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}
```

#### 2. 칩 무한 표시
```javascript
// 수정 완료 (v2.8.1)
const maxChips = playerData ? 
  parseInt(unformatNumber(playerData.initialChips) || 0, 10) : 
  Infinity;
```

#### 3. 승자 저장 안됨
- `indexMeta`에 `winners` 필드 추가 필요
- Index 시트 F열 확인

#### 4. 플레이어 중복
- Type 시트에서 중복 제거
- Status 열 확인

### 🔍 테스트 체크리스트

- [ ] Type 시트 로드 확인
- [ ] 플레이어 IN/OUT 전환
- [ ] 칩 계산 정확성
- [ ] 승자 선택 및 저장
- [ ] 다음 핸드 초기화
- [ ] 카메라 번호 증가

---

## 버전 히스토리

### v2.8.2 (2025-01-10)
- 📚 문서 통합 및 정리
- 🗑️ 프로젝트 구조 단순화
- 📁 불필요한 파일 대량 삭제

### v2.8.1 (2025-01-10)
- 🐛 2백만 칩 이상 무한 표시 버그 수정
- ✨ 국가 정보 매핑 시스템 추가
- 📝 승자 저장 솔루션 문서화

### v2.8.0 (2024-09-08)
- ✨ IN/OUT 상태 관리 개선
- 🔧 Type 시트 Status 열 추가
- 📊 실시간 동기화 강화

### v2.7.0 (2024-09-05)
- ✨ 테이블 관리 시스템
- 🎯 카메라 프리셋 기능
- 🔄 자동 번호 증가

---

## 📞 지원 및 문의

- **GitHub**: https://github.com/garimto81/virtual_data_claude
- **Issues**: 버그 리포트 및 기능 제안
- **최종 수정**: 2025-01-10

---

*이 문서는 Virtual Data Claude 프로젝트의 모든 문서를 통합한 것입니다.*