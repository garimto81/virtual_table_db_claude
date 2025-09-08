# 📊 테이블 관리 시스템 설치 가이드

## 🚀 빠른 시작

### 1단계: Google Apps Script 설정

1. [Google Apps Script](https://script.google.com) 접속
2. 새 프로젝트 생성
3. `Code_v53_TableManagement.gs` 내용 복사하여 붙여넣기
4. `SHEET_ID`를 본인의 Google Sheets ID로 변경
```javascript
const SHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
```

5. 배포 → 새 배포
   - 유형: 웹 앱
   - 실행: 나
   - 액세스: 모든 사용자
   - 배포 클릭

6. 생성된 웹 앱 URL 복사

### 2단계: 프론트엔드 설정

1. **index.html 수정**
```html
<!-- head 태그 안에 추가 -->
<script src="table-management-module.js" defer></script>

<!-- APPS_SCRIPT_URL 설정 -->
<script>
  const APPS_SCRIPT_URL = 'YOUR_WEB_APP_URL_HERE';
</script>
```

2. **관리 버튼 동작 확인**
- "관리" 버튼 클릭 시 새로운 테이블 관리 UI가 열려야 함

### 3단계: Google Sheets 초기화

Apps Script 편집기에서 실행:
```javascript
function initializeSheets() // 실행
```

자동으로 생성되는 시트:
- **Tables**: 테이블 정보
- **Players**: 플레이어 데이터베이스
- **TablePlayers**: 테이블-플레이어 관계

## 🎮 사용 방법

### 테이블 생성
1. "관리" 버튼 클릭
2. "테이블 관리" 탭 선택
3. 테이블 이름, 스테이크, 최대 인원 입력
4. "생성" 클릭

### 플레이어 등록
1. "플레이어 관리" 탭 선택
2. 플레이어 정보 입력:
   - 이름 (필수)
   - 초기 칩 (필수)
   - 좌석 번호 (선택)
   - 노터블 여부 (선택)
3. "추가" 클릭

### 칩 관리
1. "현재 테이블" 탭에서 실시간 수정
2. 빠른 조정 버튼:
   - `-10k`: 10,000 차감
   - `+10k`: 10,000 추가
   - `x2`: 두 배로

### 게임에 동기화
1. 테이블과 플레이어 설정 완료
2. "현재 게임에 동기화" 버튼 클릭
3. 메인 화면에 플레이어 정보 반영

## 📁 파일 구조

```
virtual_data_claude/
├── index.html                          # 메인 애플리케이션
├── table-management-module.js          # 테이블 관리 모듈
├── apps-script/
│   └── Code_v53_TableManagement.gs    # 백엔드 API
└── test-table-management.html         # 테스트 페이지
```

## 🔧 테스트

1. `test-table-management.html` 열기
2. APPS_SCRIPT_URL 설정
3. 순서대로 테스트:
   - 시트 초기화
   - 테이블 생성
   - 플레이어 추가
   - 데이터 로드
   - 관리 UI 열기

## 📊 데이터 구조

### Tables 시트
| 열 | 필드 | 설명 |
|---|---|---|
| A | TableID | 고유 ID |
| B | TableName | 테이블 이름 |
| C | Stakes | 스테이크 |
| D | MaxPlayers | 최대 인원 |
| E | CreatedAt | 생성 시간 |
| F | UpdatedAt | 수정 시간 |
| G | Active | 활성 상태 |

### Players 시트
| 열 | 필드 | 설명 |
|---|---|---|
| A | PlayerID | 고유 ID |
| B | Name | 이름 |
| C | Nickname | 닉네임 |
| D | CurrentTable | 현재 테이블 |
| E | CurrentChips | 현재 칩 |
| F | TotalBuyIn | 총 바이인 |
| G | Notable | 노터블 여부 |
| H | LastSeen | 마지막 접속 |
| I | CreatedAt | 생성 시간 |
| J | Notes | 메모 |

### TablePlayers 시트
| 열 | 필드 | 설명 |
|---|---|---|
| A | TableID | 테이블 ID |
| B | PlayerID | 플레이어 ID |
| C | SeatNumber | 좌석 번호 |
| D | Chips | 칩 |
| E | BuyIn | 바이인 |
| F | Status | 상태 |
| G | JoinedAt | 참가 시간 |
| H | LeftAt | 퇴장 시간 |

## ⚙️ API 엔드포인트

### 테이블 관련
- `getTables`: 테이블 목록 조회
- `createTable`: 테이블 생성
- `updateTable`: 테이블 정보 수정

### 플레이어 관련
- `getPlayers`: 플레이어 목록 조회
- `upsertPlayer`: 플레이어 생성/수정
- `addPlayerToTable`: 테이블에 플레이어 추가
- `removePlayerFromTable`: 테이블에서 플레이어 제거

## 🎯 주요 기능

### ✅ 구현 완료
- 테이블 생성 및 관리
- 플레이어 등록 및 관리
- 노터블 플레이어 표시
- 실시간 칩 수정
- 빠른 칩 조정 버튼
- 좌석 번호 지정
- 테이블별 플레이어 관리
- 게임 동기화

### 🔄 향후 개선
- [ ] 플레이어 히스토리 추적
- [ ] 리바이/애드온 기록
- [ ] 세션별 통계
- [ ] 플레이어 검색
- [ ] 테이블 템플릿
- [ ] 일괄 작업
- [ ] 엑셀 가져오기/내보내기

## ⚠️ 주의사항

1. **CORS 이슈**: Apps Script 웹 앱은 `mode: 'no-cors'`로 호출해야 함
2. **권한**: Google Sheets 편집 권한 필요
3. **API 제한**: Google Apps Script 일일 실행 시간 제한
4. **데이터 동기화**: 실시간 동기화는 수동으로 수행

## 🐛 문제 해결

### 테이블이 생성되지 않을 때
1. Apps Script 콘솔에서 오류 확인
2. SHEET_ID가 올바른지 확인
3. 시트 권한 확인

### 플레이어가 추가되지 않을 때
1. 테이블을 먼저 선택했는지 확인
2. 필수 필드(이름, 칩) 입력 확인
3. 중복된 좌석 번호 확인

### API 호출 실패
1. 웹 앱 URL이 올바른지 확인
2. Apps Script 배포 상태 확인
3. 네트워크 연결 확인

## 📝 업데이트 로그

### v1.0.0 (2025-01-08)
- 초기 릴리즈
- 테이블 관리 시스템 구현
- 플레이어 등록 및 관리
- 노터블 및 칩 스택 관리
- 게임 동기화 기능

---

**Made with ❤️ by Claude Code Assistant**