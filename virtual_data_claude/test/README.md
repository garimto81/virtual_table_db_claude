# 🧪 Apps Script v62 로컬 테스트 환경

Google Apps Script 코드를 로컬에서 테스트할 수 있는 환경입니다.

## 📁 파일 구조

```
test/
├── README.md                 # 이 파일
├── test-runner.html          # 웹 기반 테스트 실행기
├── mock-apps-script.js       # Google Apps Script 환경 모킹
└── local-apps-script.js      # 로컬 실행용 Apps Script 코드
```

## 🚀 빠른 시작

### 1. 로컬 서버 실행
```bash
# test 디렉토리에서 실행
cd virtual_data_claude/test
python -m http.server 8000
```

### 2. 브라우저에서 열기
```
http://localhost:8000/test-runner.html
```

## 🎮 사용법

### 자동 테스트 실행
- **기본 기능 테스트**: `getTableList`, `getPlayersByTable`, `addPlayer` 함수 테스트
- **일괄 업데이트 테스트**: `batchUpdatePlayers` 함수 테스트
- **삭제 기능 테스트**: `deletePlayer` 함수 테스트
- **정렬 기능 테스트**: `sortTypeSheet` 함수 테스트

### 대화형 테스트
- **플레이어 추가**: 폼을 통해 직접 플레이어 추가
- **플레이어 삭제**: 폼을 통해 직접 플레이어 삭제

### 데이터 관리
- **현재 데이터 출력**: 콘솔에 시트 데이터 출력
- **테스트 데이터 리셋**: 초기 상태로 되돌리기
- **출력 지우기**: 콘솔 출력 화면 지우기

## 📊 초기 테스트 데이터

### Type 시트
| Player   | Table  | Chips | Seat | Status |
|----------|--------|-------|------|--------|
| Player1  | Table1 | 10000 | 1    | IN     |
| Player2  | Table1 | 15000 | 2    | IN     |
| Player3  | Table2 | 8000  | 1    | IN     |
| Player4  | Table1 | 12000 |      | OUT    |

## 🧪 테스트 시나리오

### 1. 기본 CRUD 테스트
```javascript
// 테이블 목록 조회
const tables = getTableList();

// 플레이어 추가
const result = addPlayer({
    name: 'NewPlayer',
    table: 'Table1',
    seat: 3,
    chips: 20000
});

// 플레이어 삭제
const deleteResult = deletePlayer('NewPlayer', 'Table1');
```

### 2. 일괄 업데이트 테스트
```javascript
const players = [
    { name: 'BatchPlayer1', seat: 1, chips: 10000, notable: false },
    { name: 'BatchPlayer2', seat: 2, chips: 15000, notable: true }
];

const deleted = ['OldPlayer'];

const result = batchUpdatePlayers('TestTable', players, deleted);
```

### 3. 정렬 테스트
```javascript
// 정렬 실행
const sortResult = sortTypeSheet();

// 정렬 결과 확인
TestUtils.printSheetData('Type');
```

## 🔍 디버깅

### 콘솔 출력
모든 `console.log`, `console.error`, `console.warn` 출력이 웹페이지에 실시간으로 표시됩니다.

### 데이터 확인
우측 테이블에서 현재 Type 시트의 모든 데이터를 실시간으로 확인할 수 있습니다.

### 오류 추적
각 함수 호출 시 상세한 로그가 출력되어 문제점을 쉽게 파악할 수 있습니다.

## 🛠️ Mock 환경 특징

### Google Apps Script API 완전 모킹
- `SpreadsheetApp.openById()`
- `sheet.getDataRange().getValues()`
- `sheet.getRange().setValue()`
- `sheet.appendRow()`
- `sheet.deleteRow()`
- `sheet.sort()`

### 실제 Google Sheets와 동일한 동작
- 1-based 인덱싱 (Google Sheets 표준)
- 행/열 확장 자동 처리
- 정렬 알고리즘 구현
- 에러 처리 로직

### 테스트 유틸리티
```javascript
// 현재 시트 데이터 출력
TestUtils.printSheetData('Type');

// 시트 데이터 가져오기
const data = TestUtils.getSheetData('Type');

// 테스트 데이터 리셋
TestUtils.resetTestData();

// 특정 테이블 플레이어 확인
const players = TestUtils.getTablePlayers('Table1');
```

## ⚡ 성능 테스트

### 대량 데이터 테스트
```javascript
// 100명의 플레이어 일괄 추가
const manyPlayers = [];
for (let i = 1; i <= 100; i++) {
    manyPlayers.push({
        name: `Player${i}`,
        seat: i % 10 + 1,
        chips: Math.floor(Math.random() * 50000) + 10000,
        notable: i % 5 === 0
    });
}

const result = batchUpdatePlayers('BigTable', manyPlayers, []);
```

### 삭제 성능 테스트
```javascript
// 여러 플레이어 동시 삭제
const toDelete = ['Player1', 'Player2', 'Player3'];
const result = batchUpdatePlayers('TestTable', [], toDelete);
```

## 🐛 알려진 제한사항

1. **비동기 처리**: 실제 Google Apps Script와 달리 모든 작업이 동기적으로 처리됩니다.

2. **권한 체크**: Google Sheets의 권한 관련 오류는 시뮬레이션되지 않습니다.

3. **네트워크 지연**: 실제 API 호출 지연은 시뮬레이션되지 않습니다.

4. **트리거**: Google Apps Script의 시간 기반 트리거 등은 지원되지 않습니다.

## 📈 확장 방법

### 새로운 함수 테스트 추가
1. `local-apps-script.js`에 함수 구현
2. `test-runner.html`에 테스트 케이스 추가
3. 버튼 및 UI 요소 추가

### Mock 데이터 변경
`mock-apps-script.js`의 `initTestData()` 함수에서 초기 데이터를 수정할 수 있습니다.

### 새로운 시트 추가
Mock 환경에서 새로운 시트를 추가하려면 `MockSpreadsheet.initTestData()`에 시트를 추가하세요.

## 🔧 문제 해결

### 브라우저 콘솔 확인
F12 개발자 도구의 콘솔에서 추가 오류 정보를 확인할 수 있습니다.

### 데이터 상태 리셋
테스트 중 데이터가 꼬인 경우 "테스트 데이터 리셋" 버튼을 클릭하세요.

### 캐시 문제
브라우저 캐시로 인한 문제 시 Ctrl+Shift+R로 강제 새로고침하세요.

---

이 테스트 환경을 통해 Google Apps Script 코드를 빠르고 안전하게 테스트할 수 있습니다! 🚀