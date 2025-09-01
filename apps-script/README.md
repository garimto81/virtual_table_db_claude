# Google Apps Script - Poker Hand Logger Backend

## 📋 개요
이 Apps Script는 포커 핸드 로거의 백엔드로, Google Sheets와 연동하여 포커 게임 데이터를 저장하고 관리합니다.

## 🚀 설치 방법

### 1. Google Apps Script 프로젝트 생성
1. [Google Apps Script](https://script.google.com) 접속
2. 새 프로젝트 생성
3. `Code.gs` 내용을 복사하여 붙여넣기

### 2. 스프레드시트 ID 설정
```javascript
const SHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
```
- 본인의 Google Sheets ID로 변경
- Sheets URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`

### 3. 배포
1. 배포 → 새 배포
2. 유형: 웹 앱
3. 실행: 나
4. 액세스: 모든 사용자
5. 배포 클릭

### 4. 웹 앱 URL 복사
배포 후 생성된 URL을 프론트엔드 `index.html`에 설정:
```javascript
const APPS_SCRIPT_URL = "YOUR_WEB_APP_URL_HERE";
```

## 📊 스프레드시트 구조

### Hand 시트
포커 핸드의 모든 이벤트 데이터 저장
- 행 번호 | 이벤트 타입 | 데이터...

### Index 시트
| 열 | 필드 | 설명 |
|---|---|---|
| A | handNumber | 핸드 번호 |
| B | startRow | Hand 시트 시작 행 |
| C | endRow | Hand 시트 종료 행 |
| D | handUpdatedAt | 핸드 업데이트 시간 (ISO) |
| E | handEdit | 편집 플래그 |
| F | handEditTime | 편집 시간 |
| G | label | 게임 레이블 (예: HOLDEM) |
| H | table | 테이블 이름 |
| I | tableUpdatedAt | 테이블 업데이트 시간 |
| J | Cam | 캠 조합 (cam1+cam2) |
| K | CamFile01name | 첫 번째 캠 이름 |
| L | CamFile01number | 첫 번째 캠 번호 |
| M | CamFile02name | 두 번째 캠 이름 |
| N | CamFile02number | 두 번째 캠 번호 |

### Type 시트
| 열 | 필드 | 설명 |
|---|---|---|
| A | 설정값 | Cam 이름 등 |
| B | Player | 플레이어 이름 |
| C | Table | 테이블 이름 |
| D | Notable | 주목할 플레이어 (TRUE/FALSE) |
| E | Chips | 현재 칩 |
| F | UpdatedAt | 마지막 업데이트 시간 |

### Note 시트
| 열 | 필드 | 설명 |
|---|---|---|
| A | Timestamp | 타임스탬프 (epochSec) |
| B | HandNumber | 핸드 번호 |
| C | Note | 노트 내용 |

## 🔧 주요 기능

### 1. 데이터 저장 (POST)
- Hand 데이터를 시트에 저장
- HandIndex 자동 업데이트
- 플레이어 칩 정보 업데이트
- 노트 저장

### 2. 데이터 정규화
- 이벤트 타입 자동 정규화 (FOLDS → FOLD 등)
- 행 패딩으로 일관된 데이터 구조 유지

### 3. 에러 처리
- 상세한 에러 로깅
- JSON 응답으로 상태 반환

## 🧪 테스트

### 연결 테스트
```javascript
function testConnection() {
  // Apps Script 편집기에서 실행
  // 스프레드시트 연결 확인
}
```

### 데이터 구조 테스트
```javascript
function testDataStructure() {
  // 각 시트의 헤더와 데이터 확인
}
```

## 📝 버전 히스토리

### v52 (현재)
- 노트 처리를 선택적으로 변경 (프론트엔드 노트 기능 제거 대응)
- 버전 업데이트

### v51
- HandIndex 참조를 모두 Index로 통합
- 함수명 변경: _ensureHandIndexHeader → _ensureIndexHeader
- 주석 및 문서에서 HandIndex 용어 제거
- Index 시트로 완전 통합

### v50
- **중요**: HandIndex 시트가 아닌 Index 시트 사용하도록 수정
- Index 시트에 데이터가 올바르게 저장되도록 변경
- 테스트 함수명 변경 (testIndexUpdate)

### v49
- Hand 시트 PLAYER 행 F열(시작칩), G열(종료칩) 올바르게 설정
- HandIndex D열 날짜 형식 YYYY-MM-DD로 변경
- tableUpdatedAt 날짜 형식 통일

### v48
- Note 시트 헤더 스키마 수정 (Timestamp, HandNumber, Note)
- GAME 행 E열 날짜 업데이트 지원
- HandIndex 업데이트 로직 개선
- 에러 처리 강화

### v47
- Note 시트 타임스탬프 저장
- 초기 버전
- 기본 CRUD 기능

## ⚠️ 주의사항

1. **권한 설정**: 웹 앱 배포 시 "모든 사용자" 액세스 허용
2. **CORS**: form-urlencoded 방식으로 전송하여 CORS 문제 회피
3. **시트 이름**: Hand, HandIndex, Type, Note 시트 이름 변경 금지
4. **API 제한**: Google Apps Script 일일 실행 시간 제한 고려

## 🔗 관련 링크

- [프론트엔드 저장소](https://github.com/garimto81/virtual_data_claude)
- [라이브 데모](https://garimto81.github.io/virtual_data_claude/)
- [Google Apps Script 문서](https://developers.google.com/apps-script)

## 📧 문의

문제가 있거나 개선 사항이 있으면 Issue를 등록해주세요.