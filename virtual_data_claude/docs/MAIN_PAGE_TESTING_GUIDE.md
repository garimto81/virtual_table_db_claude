# 📋 메인 페이지 관리 기능 테스트 가이드

## 🎯 테스트 목표
메인 `index.html` 페이지에서 관리 버튼을 통한 플레이어 CRUD 기능 검증

---

## 🔍 기능 분석 결과

### 📍 관리 모달 위치 및 구조
- **모달 ID**: `registration-modal` (line 355)
- **관리 버튼 ID**: `open-table-management-btn` (line 366)
- **플레이어 관리 섹션**: `player-management-content` (line 421)

### 🔧 구현된 기능들

#### 1️⃣ **플레이어 이름 수정**
- **함수**: `updateLocalPlayerName` (line ~5900)
- **구현 상태**: ✅ 완료
- **동작 방식**:
  - 로컬 상태 즉시 업데이트
  - `changes.modified` 배열에 추가
  - 시각적 표시 (노란색 배경)

#### 2️⃣ **플레이어 칩 수정**
- **함수**: `updateLocalPlayerChips` (line 5906)
- **구현 상태**: ✅ 완료
- **동작 방식**:
  - 로컬 상태 즉시 업데이트
  - 음수 칩 허용 (빨간색 표시)
  - `changes.modified` 배열에 추가

#### 3️⃣ **플레이어 삭제**
- **함수**: `window.deleteLocalPlayer` (line 5923)
- **구현 상태**: ✅ 완료
- **동작 방식**:
  - 즉시 UI에서 제거
  - `changes.deleted` 배열에 추가
  - ActionHistory로 실행 취소 가능

#### 4️⃣ **플레이어 추가**
- **함수**: `addNewPlayer` (line 6341)
- **버튼 ID**: `add-player-btn` (line 6312)
- **구현 상태**: ✅ 완료
- **동작 방식**:
  - 중복 체크 수행
  - 로컬 상태에 추가
  - `changes.added` 배열에 추가

#### 5️⃣ **일괄 등록 (동기화)**
- **함수**: 일괄 등록 로직 (line 6051)
- **구현 상태**: ✅ 완료 + 자동 닫기 추가
- **동작 방식**:
  - 모든 변경사항 서버 전송
  - 성공 시 2초 후 모달 자동 닫기
  - 대시보드로 리다이렉트

---

## 🧪 테스트 시나리오

### 📱 메인 페이지 테스트 절차

#### 1. 관리 모달 열기
```javascript
1. 메인 페이지 로드
2. "관리" 버튼 클릭 (우측 상단)
3. "🎯 테이블 선택" 클릭
4. 테이블 선택
5. 플레이어 목록 확인
```

#### 2. 플레이어 이름 수정 테스트
```javascript
✅ 예상 동작:
- 이름 입력 필드에 새 이름 입력
- 변경 시 노란색 배경 표시
- "미등록 변경사항: 수정: 1명" 표시
```

#### 3. 플레이어 칩 수정 테스트
```javascript
✅ 예상 동작:
- 칩 입력 필드에 숫자 입력
- 음수 입력 시 빨간색 표시
- "미등록 변경사항: 수정: N명" 업데이트
```

#### 4. 플레이어 삭제 테스트
```javascript
✅ 예상 동작:
- 🗑️ 버튼 클릭
- 즉시 목록에서 제거
- "미등록 변경사항: 삭제: N명" 표시
- 스낵바 표시 (실행 취소 가능)
```

#### 5. 플레이어 추가 테스트
```javascript
✅ 예상 동작:
- "플레이어 추가" 섹션에 정보 입력
- "추가" 버튼 클릭
- 목록에 새 플레이어 표시
- "미등록 변경사항: 추가: N명" 표시
```

#### 6. 일괄 등록 및 자동 닫기 테스트
```javascript
✅ 예상 동작:
1. "일괄 등록" 버튼 클릭
2. "✅ 동기화 완료" 메시지 표시
3. 2초 대기
4. 모달 자동으로 닫힘
5. 대시보드로 자동 이동
6. 플레이어 목록 새로고침
```

---

## 🐛 발견된 문제 및 해결

### ✅ 해결된 문제들
1. **중복 플레이어 문제**: v3.3.0에서 해결
2. **삭제 성능 문제**: v3.2.2에서 최적화
3. **모달 자동 닫기**: 구현 완료 (line 6181)

### ⚠️ 확인 필요 사항
1. **Apps Script URL 설정**: 반드시 설정 필요
2. **Google Sheets 권한**: 접근 권한 확인
3. **네트워크 연결**: 온라인 상태 확인

---

## 📊 코드 위치 매핑

| 기능 | 함수명 | 파일 위치 | 라인 번호 |
|------|--------|----------|-----------|
| 관리 모달 열기 | `openRegistrationModal` | index.html | 5502 |
| 테이블 선택 | `onManagementTableSelected` | index.html | 5668 |
| 플레이어 목록 렌더링 | `renderManagementPlayersList` | index.html | 5694 |
| 이름 수정 | `updateLocalPlayerName` | index.html | ~5900 |
| 칩 수정 | `updateLocalPlayerChips` | index.html | 5906 |
| 플레이어 삭제 | `deleteLocalPlayer` | index.html | 5923 |
| 플레이어 추가 | `addNewPlayer` | index.html | 6341 |
| 일괄 등록 | 일괄 등록 로직 | index.html | 6051 |
| 모달 자동 닫기 | `autoCloseManagementModal` | modal-auto-close.js | - |

---

## 🚀 빠른 테스트 명령

### 개발 서버 실행
```bash
cd /c/claude/virtual_data_claude
python -m http.server 8000
```

### 브라우저 콘솔 테스트
```javascript
// 관리 상태 확인
console.log(window.managementState);

// 변경사항 확인
console.log(window.managementState.changes);

// 수동 모달 열기
document.getElementById('registration-modal').classList.remove('hidden');

// 수동 모달 닫기
autoCloseManagementModal();
```

---

## ✅ 최종 검증 체크리스트

- [x] 관리 버튼 클릭 → 모달 열림
- [x] 테이블 선택 → 플레이어 목록 로드
- [x] 이름 수정 → 로컬 상태 반영
- [x] 칩 수정 → 로컬 상태 반영
- [x] 플레이어 삭제 → 즉시 UI 제거
- [x] 플레이어 추가 → 목록에 추가
- [x] 일괄 등록 → 서버 동기화
- [x] 모달 자동 닫기 → 2초 후 닫힘
- [x] 대시보드 리다이렉트 → 메인 화면으로

---

**작성일**: 2025-09-18
**버전**: v3.3.3
**테스트 환경**: Chrome 최신 버전