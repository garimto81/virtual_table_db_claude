# 🌍 Type 시트 국가 정보 1회성 업데이트 가이드

## 📋 실행 전 확인사항

### Type 시트 현재 구조
```
A: Camera Preset
B: Player
C: Table
D: Notable
E: Chips
F: UpdatedAt
G: Seat
H: Status (IN/OUT)
I: pic (기존)
J: Country (새로 추가)
K: CountryVerified (새로 추가)
```

## 🚀 1회성 업데이트 실행 방법

### Step 1: Google Sheets Apps Script 열기
1. Google Sheets 열기
2. 확장 프로그램 → Apps Script 클릭
3. 기존 코드 모두 삭제

### Step 2: 코드 붙여넣기
1. `UpdateCountryInfo.gs` 파일 내용 전체 복사
2. Apps Script 에디터에 붙여넣기
3. 저장 (Ctrl+S)

### Step 3: 1회성 실행
```javascript
// Apps Script 에디터에서 실행할 함수 선택
runOneTimeCountryUpdate()
```

1. 상단 드롭다운에서 `runOneTimeCountryUpdate` 선택
2. ▶️ 실행 버튼 클릭
3. 첫 실행시 권한 승인 필요

## 📊 예상 결과

### 자동 매핑될 플레이어 (55명)
- 🇨🇦 캐나다: 50명
- 🇯🇵 일본: 1명 (Daisuke Watanabe)
- 🇮🇷 이란: 1명 (Kianoosh Haghighi)  
- 🇫🇷 프랑스: 2명 (Sami Ouladitto, Audrey Slama)

### 처리 결과
```
✅ 매칭 성공: 정확한 이름이 일치하는 경우
   - J열: 국가 코드 (CA, JP, IR, FR)
   - K열: TRUE
   
⚠️ 기본값 적용: 매칭되지 않은 경우
   - J열: CA (캐나다 기본값)
   - K열: FALSE
   
⏩ 스킵: 이미 Country 정보가 있는 경우
   - 기존 데이터 유지
```

## 🔧 수동 수정 방법

### 특정 플레이어 국가 수정
```javascript
// Apps Script에서 실행
updatePlayerCountry("플레이어이름", "KR"); // 한국으로 변경
updatePlayerCountry("John Doe", "US");     // 미국으로 변경
```

### 국가 코드 참조
```
CA - 캐나다 🇨🇦
US - 미국 🇺🇸
KR - 한국 🇰🇷
JP - 일본 🇯🇵
CN - 중국 🇨🇳
FR - 프랑스 🇫🇷
GB - 영국 🇬🇧
DE - 독일 🇩🇪
IR - 이란 🇮🇷
```

## 📈 통계 확인

### 국가별 통계 조회
```javascript
// Apps Script에서 실행
getCountryStatistics()
```

### 출력 예시
```
🇨🇦 CA: 75명 (검증: 50명)
🇯🇵 JP: 1명 (검증: 1명)
🇮🇷 IR: 1명 (검증: 1명)
🇫🇷 FR: 3명 (검증: 2명)
```

## ⚠️ 주의사항

1. **백업 권장**: 실행 전 Type 시트 백업
2. **1회만 실행**: 중복 실행 시 기존 데이터는 스킵됨
3. **대소문자 구분**: 플레이어 이름이 정확히 일치해야 매핑됨
4. **UpdatedAt 갱신**: 국가 정보 추가 시 F열 자동 업데이트

## 🔍 문제 해결

### 매핑이 안되는 경우
- 플레이어 이름 정확히 확인 (공백, 대소문자)
- PLAYER_COUNTRY_MAP에 추가 필요

### 잘못된 국가가 입력된 경우
- `updatePlayerCountry()` 함수로 수동 수정
- 직접 시트에서 J열 수정 후 K열을 TRUE로 변경

## 📝 로그 확인

Apps Script 에디터에서:
1. 보기 → 로그 클릭
2. 실행 결과 확인:
   - 매칭된 플레이어 목록
   - 기본값 적용된 플레이어
   - 전체 통계

## ✅ 실행 후 확인

1. Type 시트 J열에 국가 코드 입력 확인
2. K열에 TRUE/FALSE 확인
3. F열 UpdatedAt 시간 갱신 확인
4. 통계로 전체 현황 파악

---

마지막 업데이트: 2025-01-10