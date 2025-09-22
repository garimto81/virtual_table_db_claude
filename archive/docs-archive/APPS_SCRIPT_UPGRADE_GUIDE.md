# Apps Script v3.0 업그레이드 가이드

## 🎯 목표

기존 Apps Script v2.0에서 v3.0으로 업그레이드하여 `batchVerify`와 `getHandStatus` 액션을 추가합니다.

## 📋 현재 상황

- **기존 버전**: v2.0 (appscripts_old.gs)
- **새 버전**: v3.0 (apps_script_FINAL.gs)
- **문제**: 프론트엔드에서 새 액션 호출 시 "알 수 없는 액션" 오류

## 🛠️ 단계별 업그레이드 가이드

### 1단계: 기존 코드 백업
```
현재 Google Apps Script 콘솔의 코드를 복사해서 별도 보관
```

### 2단계: 새 템플릿 기반으로 완전한 코드 준비

#### 📄 필요한 파일들
- `scripts/appscripts_old.gs` (기존 코드)
- `scripts/apps_script_FINAL.gs` (새 템플릿)

#### 🔧 통합 작업
1. **apps_script_FINAL.gs**를 기본 구조로 사용
2. **appscripts_old.gs**에서 다음 함수들의 **전체 코드** 복사:

```javascript
// 필수 복사 대상 함수들
function handleSheetUpdate(data) { /* 전체 코드 */ }
function handleHandUpdate(data) { /* 전체 코드 */ }
function handleHandAnalysis(data) { /* 전체 코드 */ }
function handleIndexUpdate(data) { /* 전체 코드 */ }
function handleSheetUpdateV2(data) { /* 전체 코드 */ }
function handleVerifyUpdate(data) { /* 전체 코드 */ }

// 추가 유틸리티 함수들
function buildDefaultAnalysis() { /* 전체 코드 */ }
function updateIndexSheet() { /* 전체 코드 */ }
// 기타 필요한 모든 함수들
```

### 3단계: Google Apps Script 배포

#### 📝 배포 순서
1. **script.google.com** 접속
2. 해당 프로젝트 열기
3. **기존 코드 전체 삭제**
4. **완성된 통합 코드 붙여넣기**
5. **저장** (Ctrl+S)
6. **"배포 > 새 배포 만들기"** 클릭
7. 설정:
   - 유형: **웹 앱**
   - 실행 대상: **나**
   - 액세스 권한: **모든 사용자**
8. **배포** 클릭
9. **새 웹 앱 URL 복사**

### 4단계: 프론트엔드 URL 업데이트

새로 받은 Apps Script URL을 프론트엔드 설정에서 교체

### 5단계: 연결 테스트

브라우저 콘솔에서 확인:
```javascript
// 예상 로그
📊 현재 배포된 Apps Script 버전: v3.0
📊 지원 기능: ['Sheet Update', 'Batch Verify', 'Hand Status Check', ...]
✅ batchVerify 액션 성공
✅ getHandStatus 액션 성공
```

## 🔧 새 액션 상세

### 📊 batchVerify
```javascript
// 요청
{
  action: 'batchVerify',
  sheetUrl: 'https://docs.google.com/spreadsheets/...',
  rows: [100, 101, 102, 103]
}

// 응답
{
  status: 'success',
  result: {
    data: {
      100: { row: 100, status: '미완료', timestamp: '...' },
      101: { row: 101, status: '복사완료', timestamp: '...' },
      102: { row: 102, status: '', timestamp: '...' },
      103: { row: 103, status: '미완료', timestamp: '...' }
    }
  }
}
```

### 🎯 getHandStatus
```javascript
// 요청
{
  action: 'getHandStatus',
  sheetUrl: 'https://docs.google.com/spreadsheets/...',
  handNumber: 139,
  handTime: 1726654800
}

// 응답 (성공)
{
  status: 'success',
  handNumber: 139,
  matchedRow: 619,
  handStatus: '미완료',
  matchType: 'exact',
  timeDiff: 0
}

// 응답 (실패)
{
  status: 'not_found',
  handNumber: 139,
  message: '핸드 #139에 해당하는 Virtual 시트 행을 찾을 수 없음'
}
```

## ⚠️ 주의사항

### 🔴 로직 충돌 방지
- 기존 액션들(`updateSheet`, `updateSheetV2` 등)은 **완전히 동일하게 작동**
- 새 액션들은 **기존 로직에 영향 없음**
- 버전 호환성 완전 보장

### 🔄 롤백 계획
문제 발생 시:
1. 1단계에서 백업한 기존 코드로 복원
2. 기존 배포 URL 재사용
3. 프론트엔드에서 캐시 전용 모드로 작동

## 📊 예상 효과

### ✅ 성공 시
- ❌ "알 수 없는 액션" 오류 해결
- ✅ 일괄 상태 확인 속도 향상
- ✅ 개별 핸드 매칭 정확도 향상

### 📈 성능 개선
- **기존**: 121개 핸드 × 개별 API 호출 = 121회
- **신규**: 121개 핸드 ÷ 배치 크기 = 약 10-15회

## 🎯 최종 확인사항

배포 완료 후 브라우저 콘솔에서:
```
✅ Apps Script v3.0 연결 성공
✅ 지원 액션: ['updateSheet', 'batchVerify', 'getHandStatus', ...]
🚀 CSV 파싱 캐시 히트: 1888개 행
✅ 시간 매칭 성공: 핸드 #139 상태 = 미완료
```

모든 로그가 정상이면 업그레이드 성공! 🎉