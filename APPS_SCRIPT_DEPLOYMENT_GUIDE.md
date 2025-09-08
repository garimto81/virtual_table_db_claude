# 📋 Google Apps Script 배포 가이드

## ⚠️ 중요: 반드시 이 단계를 따라야 테이블 관리 기능이 작동합니다!

## 1단계: Google Apps Script 열기

1. [Google Apps Script](https://script.google.com) 접속
2. 기존 프로젝트 열기 또는 새 프로젝트 생성

## 2단계: 기존 코드 백업

현재 Code.gs 내용을 복사하여 안전한 곳에 저장

## 3단계: 새 코드 복사

1. `apps-script/Code_v54_Complete.gs` 파일 열기
2. 전체 내용 복사 (Ctrl+A, Ctrl+C)
3. Google Apps Script 편집기에 붙여넣기

## 4단계: SHEET_ID 수정

```javascript
// 14번째 줄 찾기
const SHEET_ID = '1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U';

// 본인의 Google Sheets ID로 변경
const SHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
```

Google Sheets URL 예시:
```
https://docs.google.com/spreadsheets/d/[이 부분이 SHEET_ID]/edit
```

## 5단계: 시트 초기화 (중요!)

Apps Script 편집기에서:

1. 함수 선택 드롭다운에서 `initializeSheets` 선택
2. ▶️ 실행 버튼 클릭
3. 권한 요청이 나오면 승인

이 단계에서 자동으로 생성되는 시트:
- **Tables**: 테이블 정보
- **Players**: 플레이어 데이터베이스  
- **TablePlayers**: 테이블-플레이어 관계

## 6단계: 기존 데이터 확인

1. 함수 선택 드롭다운에서 `testTableSystem` 선택
2. ▶️ 실행 버튼 클릭
3. 로그 확인 (보기 → 로그)

정상 로그 예시:
```
=== 테이블 시스템 테스트 시작 ===
1. 시트 초기화: {success=true, message=Sheets initialized successfully}
2. 테이블 목록: {success=true, tables=[...]}
3. 테이블 생성: {success=true, table={...}}
4. 플레이어 추가: {success=true, playerId=..., action=created}
5. 플레이어 목록: {success=true, players=[...]}
=== 테스트 완료 ===
```

## 7단계: 웹 앱 배포

1. 배포 → 새 배포 클릭
2. 설정:
   - 유형: **웹 앱**
   - 설명: `테이블 관리 시스템 v54`
   - 실행: **나**
   - 액세스: **모든 사용자**
3. 배포 클릭
4. 웹 앱 URL 복사

URL 형식:
```
https://script.google.com/macros/s/[배포ID]/exec
```

## 8단계: 프론트엔드 연결 확인

index.html에서 APPS_SCRIPT_URL이 올바른지 확인:
```javascript
const APPS_SCRIPT_URL = "배포된_URL_여기에_붙여넣기";
```

## 9단계: 테스트

1. 웹사이트 열기
2. "관리" 버튼 클릭
3. 테이블 관리 모달이 열리는지 확인
4. 기존 테이블이 표시되는지 확인

## 🔧 문제 해결

### "Tables 시트를 찾을 수 없습니다" 오류
→ 5단계 initializeSheets 실행 확인

### 테이블 목록이 비어있음
→ Type 시트에 데이터가 있는지 확인
→ testTableSystem 실행하여 마이그레이션 확인

### API 호출 실패
→ 웹 앱 URL이 올바른지 확인
→ 배포 설정에서 "모든 사용자" 액세스 확인

### CORS 오류
→ FormData 방식으로 전송하는지 확인
→ no-cors 모드 사용 금지

## 📊 시트 구조 확인

Google Sheets를 열어 다음 시트가 생성되었는지 확인:

### Tables 시트
| TableID | TableName | Stakes | MaxPlayers | CreatedAt | UpdatedAt | Active |
|---------|-----------|--------|------------|-----------|-----------|--------|
| UUID... | Friday... | 1/2 NL | 9          | 2025...   | 2025...   | true   |

### Players 시트
| PlayerID | Name | Nickname | CurrentTable | CurrentChips | Notable | ... |
|----------|------|----------|--------------|--------------|---------|-----|
| UUID...  | John | JD       | Friday...    | 100000       | true    | ... |

### Type 시트 (기존)
기존 플레이어 데이터가 자동으로 마이그레이션됩니다.

## ✅ 배포 완료 체크리스트

- [ ] Code_v54_Complete.gs 복사
- [ ] SHEET_ID 수정
- [ ] initializeSheets 실행
- [ ] testTableSystem 실행
- [ ] 웹 앱 배포
- [ ] URL 복사
- [ ] 프론트엔드 테스트
- [ ] 테이블 목록 확인
- [ ] 플레이어 추가 테스트

## 🚨 주의사항

1. **반드시 initializeSheets를 먼저 실행**해야 합니다
2. 기존 데이터는 자동으로 마이그레이션되지만 백업 권장
3. 배포 후 URL이 변경되므로 반드시 새 URL 복사
4. Type 시트의 기존 데이터는 유지됩니다

---

문제가 있으면 다음을 확인하세요:
1. Apps Script 로그 (보기 → 로그)
2. 브라우저 콘솔 (F12)
3. Google Sheets 시트 구조

**최종 업데이트**: 2025-09-08