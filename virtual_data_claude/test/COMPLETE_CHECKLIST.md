# 🔍 플레이어 관리 기능 종합 체크리스트

## 📋 체크리스트 사용법
- **정상 작동 시**: Part A (기능 테스트) 사용
- **문제 발생 시**: Part B (문제 진단) 사용
- **수정 후**: Part C (검증) 사용

---

# Part A: 기능 테스트 체크리스트 ✅

## 🎯 테스트 환경 준비
- [ ] Apps Script URL 설정 확인
- [ ] Google Sheets 연결 상태 확인
- [ ] 테스트용 테이블 선택
- [ ] 브라우저 콘솔 열기 (F12)

## 🧹 중복 플레이어 자동 제거 (v1.7.0) ✅ 성공

### ❌ 이전 실패한 접근 방법들:
- [ ] ~~loadPlayerData API 사용~~ → API 존재하지 않음
- [ ] ~~APPS_SCRIPT_URL 대기 후 실행~~ → URL 문제가 아니었음

### ✅ 현재 구현 (실제 삭제):
- [x] 페이지 로드 시 3초 후 자동 실행
- [x] window.state.playerDataByTable에서 데이터 가져오기
- [x] 중복 플레이어 검사 (같은 테이블 + 이름 + 좌석)
- [x] batchUpdate API로 Google Sheets에서 실제 삭제
- [x] 테이블별로 그룹화하여 처리
- [x] 스낵바로 결과 알림

### 중복 제거 테스트
```javascript
// 수동 실행 (실제 삭제)
removeDuplicatePlayers().then(result => {
    console.log('제거 결과:', result);
    console.log('제거된 플레이어:', result.removedPlayers);
});

// 로컬 데이터 중복 정리
const cleaned = removeDuplicatesFromLocalData(playerData);
```

### ✅ 핵심 발견:
- 관리 버튼의 batchUpdate API 활용
- FormData로 deleted 배열 전송
- 테이블별 개별 처리로 정확한 삭제

## 1️⃣ 관리 모달 기본 동작

### 모달 열기/닫기
- [ ] "관리" 버튼 클릭 → 모달 열림
- [ ] X 버튼 클릭 → 모달 닫힘
- [ ] 모달 외부 클릭 → 모달 닫힘
- [ ] ESC 키 → 모달 닫힘

### 테이블 선택
- [ ] "🎯 테이블 선택" 클릭 → 테이블 목록 표시
- [ ] 테이블 선택 → 플레이어 목록 로드
- [ ] 선택된 테이블명 상단에 표시
- [ ] "변경" 버튼 → 테이블 재선택 가능

## 2️⃣ 플레이어 CRUD 기능

### ✏️ 이름 수정
- [ ] 이름 입력 필드 활성화
- [ ] 새 이름 입력 → 즉시 반영
- [ ] 변경된 항목 노란색 배경 표시
- [ ] "미등록 변경사항: 수정 N명" 표시
- [ ] 빈 이름 입력 방지
- [ ] 중복 이름 경고

### 💰 칩 수정
- [ ] 칩 입력 필드 숫자만 허용
- [ ] 양수 입력 → 정상 표시
- [ ] 음수 입력 → 빨간색 표시
- [ ] 0 입력 → 정상 처리
- [ ] 큰 숫자 (999999999) → 정상 처리
- [ ] 천 단위 콤마 자동 표시

### 🗑️ 플레이어 삭제
- [ ] 삭제 버튼(✕) 클릭 → 즉시 UI 제거
- [ ] 삭제된 항목 취소선 표시
- [ ] "미등록 변경사항: 삭제 N명" 표시
- [ ] 스낵바 표시 (실행취소 옵션)
- [ ] 다중 삭제 성능 (즉각 반응)

### ➕ 플레이어 추가
- [ ] 빈 좌석에 이름 입력
- [ ] Enter 키 → 플레이어 추가
- [ ] 자동 좌석 번호 할당
- [ ] 기본 칩 수량 설정
- [ ] "미등록 변경사항: 추가 N명" 표시
- [ ] 10명 제한 확인

## 3️⃣ 일괄 처리 기능

### 🔄 일괄 등록
- [ ] "일괄 등록" 버튼 활성화
- [ ] 클릭 → 로딩 표시
- [ ] 성공 메시지 표시
- [ ] Google Sheets 실시간 반영
- [ ] 변경사항 카운터 초기화

### 🚪 모달 자동 닫기
- [ ] 일괄 등록 성공 후 2초 대기
- [ ] 모달 페이드 아웃 효과
- [ ] 자동으로 모달 닫힘
- [ ] 대시보드로 자동 이동
- [ ] 플레이어 목록 자동 새로고침

### 🔄 변경 취소
- [ ] "변경 취소" 버튼 → 모든 변경 초기화
- [ ] 원본 데이터로 복원
- [ ] 변경사항 카운터 리셋
- [ ] 스낵바로 알림

## 4️⃣ 동기화 및 검증

### Google Sheets 동기화
- [ ] 이름 변경 → Type 시트 B열 업데이트
- [ ] 칩 변경 → Type 시트 E열 업데이트
- [ ] 삭제 → Type 시트 H열 'OUT' 또는 행 삭제
- [ ] 추가 → Type 시트 새 행 추가
- [ ] 타임스탬프 (F열) 자동 갱신

### 데이터 정합성
- [ ] 중복 플레이어 자동 제거 (v3.2.8)
- [ ] Table > Seat 순 자동 정렬 (v3.2.5)
- [ ] 테이블별 그룹핑 유지
- [ ] 좌석 번호 중복 방지

---

# Part B: 문제 진단 체크리스트 🔧

## 🚨 데이터 동기화 문제 (v3.4.2 발견)

### "로컬 데이터와 시트 데이터 불일치"
**증상**: 중복 제거가 작동하지 않고, 로컬 플레이어 수와 실제 시트 플레이어 수가 다름

**예시**:
- 로컬 데이터: 915T02 테이블 10명
- 실제 시트: 915T02 테이블 17명
- 차이: 7명 누락

**진단 방법**:
```javascript
// 1. 로컬 데이터 확인
console.log('로컬 915T02:', window.state.playerDataByTable['915T02'].length);

// 2. 실제 시트 데이터 확인 (수동으로 시트에서 카운트)

// 3. 데이터 로딩 시점 확인
console.log('데이터 로딩 완료 시간:', window.state.lastLoadTime);
```

**가능한 원인**:
- [ ] 페이지 로딩 중 데이터 동기화 미완료
- [ ] Apps Script API 호출 실패
- [ ] 캐시된 오래된 데이터 사용
- [ ] 특정 테이블 데이터 로딩 실패

**해결 방법**:
1. **강제 새로고침**: `Ctrl+Shift+R`
2. **데이터 재로딩**: 관리 버튼으로 수동 데이터 갱신
3. **캐시 클리어**: 브라우저 캐시 삭제
4. **API 상태 확인**: Apps Script URL 응답 확인

## 🚨 증상별 빠른 진단

### "관리 버튼이 작동하지 않음"
```javascript
// Console에서 실행
document.getElementById('manage-players-btn')  // null이면 요소 없음
el.managePlayersBtn  // undefined면 초기화 안됨
```
- [ ] 버튼 요소 존재 확인
- [ ] 이벤트 리스너 연결 확인
- [ ] 콘솔 에러 확인

### "모달이 열리지 않음"
```javascript
// Console에서 수동 실행
document.getElementById('registration-modal').classList.remove('hidden', 'opacity-0')
```
- [ ] 모달 HTML 존재 확인
- [ ] openRegistrationModal 함수 정의 확인
- [ ] CSS hidden 클래스 확인

### "플레이어 목록이 표시 안 됨"
```javascript
// Console에서 확인
window.managementState  // 상태 확인
renderManagementPlayersList()  // 수동 렌더링
```
- [ ] managementState 초기화 확인
- [ ] current-players-list 요소 확인
- [ ] 테이블 선택 여부 확인

### "삭제가 작동하지 않음"
```javascript
// Console에서 확인
typeof window.deleteLocalPlayer  // 'function'이어야 함
window.deleteLocalPlayer(0)  // 수동 실행
```
- [ ] deleteLocalPlayer 전역 노출 확인
- [ ] onclick 이벤트 연결 확인
- [ ] 인덱스 파라미터 전달 확인

### "자동 닫기가 작동 안 함"
```javascript
// Console에서 확인
typeof autoCloseManagementModal  // 'function'이어야 함
autoCloseManagementModal()  // 수동 실행

// 모달이 실제로 열려있는지 확인
const modal = document.getElementById('registration-modal');
const isHidden = modal.classList.contains('hidden');
console.log('모달 상태:', isHidden ? '닫힘' : '열림');
```
- [ ] modal-auto-close.js 로드 확인
- [ ] 함수 정의 확인
- [ ] 모달이 이미 닫혀있는지 확인
- [ ] console.warn이 NOTICE로 표시되는 이슈 (v3.3.3)

## 🔍 체계적 진단 프로세스

### 1단계: HTML 요소 확인
```javascript
// 필수 요소 체크
const elements = [
    'manage-players-btn',
    'registration-modal',
    'management-menu',
    'player-management-content',
    'current-players-list',
    'open-table-management-btn'
];
elements.forEach(id => {
    const el = document.getElementById(id);
    console.log(`${id}: ${el ? '✅' : '❌'}`);
});
```

### 2단계: JavaScript 함수 확인
```javascript
// 필수 함수 체크
const functions = [
    'openRegistrationModal',
    'renderManagementPlayersList',
    'onManagementTableSelected',
    'updateLocalPlayerChips',
    'addNewPlayer'
];
functions.forEach(func => {
    const exists = typeof window[func] === 'function' ||
                   typeof eval(func) === 'function';
    console.log(`${func}: ${exists ? '✅' : '❌'}`);
});
```

### 3단계: 전역 상태 확인
```javascript
// 전역 객체 체크
console.log('managementState:', window.managementState ? '✅' : '❌');
console.log('state:', window.state ? '✅' : '❌');
console.log('APPS_SCRIPT_URL:', typeof APPS_SCRIPT_URL !== 'undefined' ? '✅' : '❌');
```

### 4단계: 콘솔 에러 분석
```javascript
// 일반적인 에러 패턴
// Uncaught ReferenceError: 함수가 정의되지 않음
// Cannot read property: null 객체 접근
// 404 Not Found: 파일 경로 오류
// CORS error: Apps Script URL 문제
```

## 🛠️ 빠른 수정 명령어

### 문제별 즉시 해결책

#### 1. 관리 상태 초기화
```javascript
window.managementState = {
    selectedTable: null,
    originalPlayers: [],
    currentPlayers: [],
    changes: { added: [], modified: [], deleted: [] }
};
```

#### 2. 삭제 함수 전역 노출
```javascript
window.deleteLocalPlayer = function(index) {
    const player = window.managementState.currentPlayers[index];
    if (!player) return;
    window.managementState.currentPlayers.splice(index, 1);
    window.managementState.changes.deleted.push(player.name);
    renderManagementPlayersList();
    updateChangesSummary();
};
```

#### 3. 모달 수동 제어
```javascript
// 열기
function openModal() {
    const modal = document.getElementById('registration-modal');
    if (modal) modal.classList.remove('hidden', 'opacity-0');
}

// 닫기
function closeModal() {
    const modal = document.getElementById('registration-modal');
    if (modal) modal.classList.add('hidden', 'opacity-0');
}
```

#### 4. 이벤트 리스너 재연결
```javascript
const btn = document.getElementById('manage-players-btn');
if (btn) {
    btn.onclick = null;  // 기존 제거
    btn.addEventListener('click', () => {
        console.log('관리 버튼 클릭');
        openRegistrationModal();
    });
}
```

---

# Part C: 검증 체크리스트 ✅

## 🎯 수정 후 최종 검증

### 기본 동작 검증
- [ ] 관리 버튼 → 모달 열림
- [ ] 테이블 선택 → 플레이어 로드
- [ ] 이름/칩 수정 → 즉시 반영
- [ ] 플레이어 삭제 → UI 제거
- [ ] 플레이어 추가 → 목록 추가

### 동기화 검증
- [ ] 일괄 등록 → Sheets 반영
- [ ] 모달 자동 닫기 (2초)
- [ ] 대시보드 새로고침
- [ ] 중복 제거 확인

### 성능 검증
- [ ] 즉각적인 UI 반응
- [ ] 에러 없는 콘솔
- [ ] 부드러운 애니메이션

---

## 🚀 통합 진단 스크립트

### 전체 진단 실행
```javascript
// test/diagnose_and_fix.js 로드
fetch('test/diagnose_and_fix.js')
    .then(r => r.text())
    .then(eval)
    .then(() => {
        console.log('진단 완료. testFunctions 사용 가능');
    });
```

### 테스트 함수 사용
```javascript
testFunctions.openModal()      // 모달 열기
testFunctions.renderPlayers()  // 목록 렌더링
testFunctions.addTestPlayer()  // 테스트 플레이어
testFunctions.testAutoClose()  // 자동 닫기 테스트
```

---

## 📊 문제 해결 매트릭스

| 증상 | 원인 | 해결 방법 | 확인 명령 |
|------|------|-----------|-----------|
| 버튼 무반응 | 이벤트 미연결 | 리스너 재연결 | `el.managePlayersBtn` |
| 모달 안 열림 | 함수 미정의 | 함수 재정의 | `typeof openRegistrationModal` |
| 목록 안 보임 | 상태 미초기화 | managementState 초기화 | `window.managementState` |
| 삭제 안 됨 | 전역 미노출 | window.deleteLocalPlayer 정의 | `typeof window.deleteLocalPlayer` |
| 자동 닫기 실패 | 모달 이미 닫힘 | 모달 상태 확인 후 처리 | `modal.classList.contains('hidden')` |
| 데이터 불일치 | 로컬/시트 동기화 실패 | 강제 새로고침 및 재로딩 | `window.state.playerDataByTable['915T02'].length` |
| 중복 검출 실패 | 로컬 데이터 이미 정리됨 | Google Sheets 직접 접근 필요 | `getAllPlayers API 구현 여부` |
| NOTICE 로그 | console.warn 오버라이드 | v3.3.3의 console 리다이렉트 | `console.warn 원본 복구` |

---

## 💡 Tips

### 개발자 도구 활용
- **Console**: 에러 확인, 명령 실행
- **Elements**: HTML 구조 확인
- **Network**: API 호출 확인
- **Sources**: 스크립트 디버깅

### 캐시 문제 해결
- 일반 새로고침: `F5`
- 캐시 무시: `Ctrl + Shift + R`
- 개발자 도구 열고: `Ctrl + F5`

---

## 📊 데이터 동기화 문제 해결 (v3.4.2)

### 🔍 문제 발견
**915T02 테이블**: 구글 시트 17명 vs 로컬 데이터 10명 불일치

### 🛠️ 원인 분석
`buildTypeFromCsv` 함수 (index.html:3798)에서 잘못된 중복 필터링:
```javascript
// ❌ 기존 (이름만으로 중복 판단)
if(!byTable[table].some(p=>p.name===player))

// ✅ 수정 (테이블+이름+좌석 기준)
const isDuplicate = byTable[table].some(p => p.name === player && p.seat === seat);
if(!isDuplicate)
```

### 🎯 해결책
- **정확한 중복 기준**: table + name + seat 모두 같아야 중복으로 판단
- **데이터 보존**: 같은 이름이라도 다른 좌석이면 별도 플레이어로 처리
- **로그 개선**: 좌석 정보 포함한 상세 로그 출력

### ✅ 결과
- 로컬 데이터에 실제 구글 시트와 동일한 모든 플레이어 유지
- 중복 제거 시스템이 정확한 중복만 검출 가능
- 데이터 동기화 문제 완전 해결

---

**최종 업데이트**: 2025-09-18
**버전**: v3.4.2
**용도**: 기능 테스트 + 문제 진단 + 데이터 동기화 해결