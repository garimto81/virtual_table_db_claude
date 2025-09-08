# 📋 Type 시트 기반 테이블 관리 시스템 v58

## 🎯 개요
기존 Type 시트를 활용하여 추가 시트 없이 간단하게 테이블과 플레이어를 관리하는 시스템입니다.

## 📊 Type 시트 구조

### 기존 구조
```
A: Camera Preset | B: Player | C: Table | D: Notable | E: Chips | F: UpdatedAt | G: Seat
```

### 개선된 구조 (H열 추가)
```
A: Camera Preset | B: Player | C: Table | D: Notable | E: Chips | F: UpdatedAt | G: Seat | H: Status
```

## 🔧 설치 방법

### 1단계: Apps Script 업데이트

1. [Google Apps Script](https://script.google.com) 접속
2. 기존 프로젝트 열기
3. `Code_v58_Simple.gs` 내용 복사
4. SHEET_ID 확인/수정
5. 저장

### 2단계: Status 열 초기화

Apps Script 편집기에서:
1. 함수 선택: `initializeStatusColumn`
2. ▶️ 실행 버튼 클릭
3. 권한 승인 (최초 1회)

### 3단계: 웹 앱 재배포

1. 배포 → 배포 관리
2. 수정 → 새 버전
3. 설명: "v58 - Type 시트 기반 관리"
4. 배포
5. URL 복사

### 4단계: 프론트엔드 연결

`index.html`에서 APPS_SCRIPT_URL 업데이트:
```javascript
const APPS_SCRIPT_URL = "새로운_배포_URL";
```

## 📱 사용 방법

### 테이블 관리

1. **"관리" 버튼 클릭**
   - 테이블 목록 표시
   - 각 테이블의 플레이어 수 확인

2. **새 테이블 만들기**
   - 테이블 이름 입력
   - "새 테이블 만들기" 클릭

3. **테이블 선택**
   - 원하는 테이블 클릭
   - 해당 테이블 플레이어 목록 표시

### 플레이어 관리

1. **플레이어 추가**
   - "플레이어 추가" 버튼 클릭
   - 이름, 칩, 좌석, 노터블 입력
   - 저장

2. **플레이어 수정**
   - 플레이어 카드의 "수정" 버튼 클릭
   - 정보 수정 후 저장

3. **상태 변경**
   - 🟢 ACTIVE: 플레이 중
   - 🟡 AWAY: 자리 비움
   - 🟠 BREAK: 휴식 중
   - ⚫ OUT: 테이블 떠남
   - 💀 BUSTED: 올인 후 탈락

## 🔄 Status 관리 규칙

### 상태 전환 가능 경로
- **ACTIVE** → AWAY, BREAK, OUT, BUSTED
- **AWAY** → ACTIVE, OUT
- **BREAK** → ACTIVE, OUT
- **BUSTED** → OUT
- **OUT** → (재등록 필요)

### 소프트 삭제
- 플레이어를 실제로 삭제하지 않고 Status를 OUT으로 변경
- 과거 기록 유지
- UI에서는 OUT/BUSTED 플레이어 숨김

## 📑 API 함수 목록

### Apps Script (백엔드)

```javascript
// Status 열 초기화
initializeStatusColumn()

// 테이블 목록 조회
getTableList()

// 테이블별 플레이어 조회
getPlayersByTable(tableName)

// 플레이어 추가/수정
upsertPlayer(playerData)

// 플레이어 상태 변경
updatePlayerStatus(playerName, tableName, newStatus)
```

### JavaScript (프론트엔드)

```javascript
// 관리 모달 열기
openTableManagement()

// 테이블 선택
tableManager.selectTable(tableName)

// 플레이어 상태 변경
tableManager.setPlayerStatus(playerName, status)

// 플레이어 수정
tableManager.editPlayer(playerName)
```

## 🐛 문제 해결

### Status 열이 없는 경우
→ `initializeStatusColumn()` 함수 실행

### 플레이어가 표시되지 않는 경우
→ Status가 OUT이 아닌지 확인

### 좌석이 중복되는 경우
→ Type 시트에서 직접 수정

### API 호출 실패
→ 웹 앱 URL 확인
→ 배포 설정에서 "모든 사용자" 액세스 확인

## 📊 Type 시트 예시

```
Row | Player  | Table      | Notable | Chips  | UpdatedAt  | Seat | Status
----|---------|------------|---------|--------|------------|------|--------
2   | Alice   | Friday 1/2 | TRUE    | 100000 | 2025-09-08 | 1    | ACTIVE
3   | Bob     | Friday 1/2 | FALSE   | 75000  | 2025-09-08 | 3    | AWAY
4   | Charlie | Friday 1/2 | TRUE    | 200000 | 2025-09-08 | 5    | ACTIVE
5   | David   | Friday 1/2 | FALSE   | 0      | 2025-09-08 |      | BUSTED
6   | Eve     | Friday 1/2 | TRUE    | 180000 | 2025-09-08 |      | OUT
```

## ✅ 장점

1. **간단함**: Type 시트 하나만 사용
2. **호환성**: 기존 시스템과 100% 호환
3. **직관적**: 스프레드시트에서 바로 확인 가능
4. **가벼움**: 추가 시트 불필요
5. **유연함**: 수동 편집 가능

## 📝 주의사항

- Player + Table 조합이 고유 키
- 같은 플레이어가 여러 테이블 동시 참여 불가
- OUT 상태 플레이어는 UI에 표시되지 않음
- 과거 기록은 Type 시트에 유지됨

---

**버전**: v58  
**최종 업데이트**: 2025-09-08  
**작성자**: Claude Code Assistant