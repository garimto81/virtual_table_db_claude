# Virtual Table Sheet Updater - Apps Script

Virtual 시트의 F열(파일명), H열(AI분석) 업데이트를 위한 Google Apps Script 백엔드

## 🚀 설치 방법

### 1. Google Apps Script 프로젝트 생성
1. [Google Apps Script](https://script.google.com) 접속
2. 새 프로젝트 생성
3. `SheetUpdater.gs` 내용을 복사하여 붙여넣기

### 2. 웹 앱 배포
1. 배포 → 새 배포
2. 유형: 웹 앱
3. 실행: 나
4. 액세스: 모든 사용자
5. 배포 클릭

### 3. 웹 앱 URL 설정
배포 후 생성된 URL을 포커 핸드 모니터링 시스템에 설정:

**포커 핸드 모니터링 → 설정 → Apps Script 시트 연동**
- 🔗 Apps Script Web App URL: `YOUR_WEB_APP_URL_HERE`

## 📊 시트 구조 요구사항

업데이트 대상 시트는 다음 열 구조를 가져야 합니다:

| 열 | 용도 | 예시 |
|---|---|---|
| A | Blinds | 1/2, 2/5 |
| B | Cyprus 시간 | 14:35:20 (매칭 기준) |
| C | Seoul 시간 | 23:35:20 |
| D | 핸드 번호 | #001, #002 |
| E | 기타 데이터 | - |
| **F** | **파일명** | **hand_001.mp4** ← 업데이트 |
| G | 기타 데이터 | - |
| **H** | **AI 분석** | **분석 실패** ← 업데이트 |
| I | 업데이트 시간 | 2025-09-07 15:30:00 |

## 🔧 주요 기능

### 1. 시트 업데이트 (`updateSheet`)
- **F열**: 파일명 업데이트
- **H열**: AI 분석 결과 업데이트  
- **I열**: 업데이트 시간 자동 기록

### 2. 연결 테스트
- GET 요청으로 연결 상태 확인
- 버전 정보 및 서비스 상태 반환

### 3. 안전한 시트 접근
- CORS 정책 완전 우회
- 서버사이드에서 안전한 시트 접근
- 에러 처리 및 상세 로깅

## 📨 API 사용법

### 연결 테스트 (GET)
```javascript
fetch('YOUR_WEB_APP_URL', {
  method: 'GET'
})
.then(response => response.json())
.then(data => console.log(data));
```

**응답 예시:**
```json
{
  "status": "ok",
  "method": "GET",
  "version": "v1.0",
  "service": "Virtual Table Sheet Updater",
  "time": "2025-09-07T15:30:00.000Z"
}
```

### 시트 업데이트 (POST)
```javascript
const updateData = {
  action: 'updateSheet',
  sheetUrl: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit?gid=GID#gid=GID',
  rowNumber: 5,
  handNumber: 'HAND_001',
  filename: 'hand_001_river_bluff.mp4',
  aiAnalysis: '분석 실패',
  timestamp: new Date().toISOString()
};

fetch('YOUR_WEB_APP_URL', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    payload: JSON.stringify(updateData)
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

**성공 응답 예시:**
```json
{
  "status": "success",
  "message": "시트 업데이트 완료",
  "data": {
    "sheetName": "시트1",
    "rowNumber": 5,
    "filename": "hand_001_river_bluff.mp4",
    "aiAnalysis": "분석 실패",
    "updatedAt": "2025-09-07T15:30:00.000Z",
    "handNumber": "HAND_001"
  }
}
```

## 🧪 테스트 함수

Apps Script 편집기에서 직접 실행 가능한 테스트 함수들:

### 1. `testConnection()`
시트 연결 상태 테스트

### 2. `testSheetUpdate()`
실제 시트 업데이트 테스트 (행 2에 테스트 데이터 입력)

## ⚠️ 주의사항

1. **권한 설정**: 웹 앱 배포 시 "모든 사용자" 액세스 허용
2. **시트 권한**: Apps Script가 대상 시트에 편집 권한이 있어야 함
3. **URL 형식**: 시트 URL은 편집 URL 형식 사용 (`/edit?gid=...`)
4. **행 번호**: 1부터 시작하는 실제 시트 행 번호 사용
5. **데이터 검증**: 빈 파일명이나 잘못된 행 번호는 오류 발생

## 🔄 워크플로우

1. **포커 핸드 매칭**: B열 기준으로 Virtual 시트에서 가장 가까운 시간 행 찾기
2. **완료 처리**: 포커 핸드 모니터링에서 "📊 시트 업데이트" 버튼 클릭
3. **데이터 입력**: 팝업에서 파일명 입력, AI 분석 확인
4. **자동 업데이트**: Apps Script로 F열(파일명), H열(AI분석) 자동 입력
5. **결과 확인**: 성공 시 해당 행에 데이터 업데이트 완료

## 📈 버전 히스토리

### v1.0 (2025-09-07)
- 초기 버전 출시
- F열(파일명), H열(AI분석) 업데이트 기능
- 연결 테스트 기능
- 상세 에러 처리 및 로깅