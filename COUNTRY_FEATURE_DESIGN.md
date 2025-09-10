# 🌍 Type 시트 국가 정보 추가 설계 가이드

## 📋 개요
Type 시트에 플레이어의 국가 정보를 추가하여 더 풍부한 데이터 관리가 가능하도록 확장

## 🏗️ 설계 구조

### 1. **데이터베이스 구조 변경**

#### 현재 Type 시트 구조
```
A: Camera Preset
B: Player
C: Table  
D: Notable
E: Chips
F: UpdatedAt
G: Seat
H: Status (IN/OUT)
```

#### 새로운 Type 시트 구조
```
A: Camera Preset
B: Player
C: Table  
D: Notable
E: Chips
F: UpdatedAt
G: Seat
H: Status (IN/OUT)
I: Country (새로 추가) ← ISO 3166-1 alpha-2 코드 사용 권장
```

### 2. **국가 코드 표준**
- **ISO 3166-1 alpha-2** 코드 사용 (2자리)
  - 한국: `KR`
  - 미국: `US`
  - 일본: `JP`
  - 중국: `CN`
  - 영국: `GB`
  - 독일: `DE`
  - 프랑스: `FR`
  - 캐나다: `CA`
  - 호주: `AU`
  - 브라질: `BR`

## 🔧 수정이 필요한 파일들

### 1. **Google Apps Script (Code_v59_InOut.gs)**

```javascript
// Type 시트 열 인덱스 수정
const TYPE_COLUMNS = {
  CAMERA: 0,      // A열
  PLAYER: 1,      // B열
  TABLE: 2,       // C열
  NOTABLE: 3,     // D열
  CHIPS: 4,       // E열
  UPDATED_AT: 5,  // F열
  SEAT: 6,        // G열
  STATUS: 7,      // H열
  COUNTRY: 8      // I열 (새로 추가)
};

// Range용 (1-based) 수정
const RANGE_COLUMNS = {
  // ... 기존 항목들
  COUNTRY: 9      // I열
};

// getPlayersByTable 함수 수정
function getPlayersByTable(tableName) {
  // ... 기존 코드
  players.push({
    player: data[i][TYPE_COLUMNS.PLAYER],
    chips: data[i][TYPE_COLUMNS.CHIPS],
    notable: data[i][TYPE_COLUMNS.NOTABLE] === 'TRUE',
    seat: data[i][TYPE_COLUMNS.SEAT] || '',
    status: data[i][TYPE_COLUMNS.STATUS] || 'IN',
    country: data[i][TYPE_COLUMNS.COUNTRY] || ''  // 추가
  });
}

// upsertPlayer 함수 수정
function upsertPlayer(playerData) {
  // ... 새 행 추가 시
  newRow[TYPE_COLUMNS.COUNTRY] = playerData.country || '';
  
  // ... 기존 플레이어 수정 시
  if (playerData.country !== undefined) {
    sheet.getRange(targetRow, RANGE_COLUMNS.COUNTRY).setValue(playerData.country);
  }
}
```

### 2. **테이블 관리 모듈 (table-management-v59.js)**

```javascript
// 플레이어 추가/수정 UI에 국가 선택 추가
function renderPlayerForm() {
  return `
    <!-- 기존 필드들 -->
    <input type="text" id="player-name" placeholder="이름">
    <input type="text" id="player-chips" placeholder="칩">
    
    <!-- 국가 선택 추가 -->
    <select id="player-country" class="country-select">
      <option value="">국가 선택</option>
      <option value="KR">🇰🇷 한국</option>
      <option value="US">🇺🇸 미국</option>
      <option value="JP">🇯🇵 일본</option>
      <option value="CN">🇨🇳 중국</option>
      <option value="GB">🇬🇧 영국</option>
      <option value="DE">🇩🇪 독일</option>
      <option value="FR">🇫🇷 프랑스</option>
      <option value="CA">🇨🇦 캐나다</option>
      <option value="AU">🇦🇺 호주</option>
      <option value="BR">🇧🇷 브라질</option>
      <option value="OTHER">기타</option>
    </select>
  `;
}

// 플레이어 저장 시 country 포함
async function savePlayer() {
  const playerData = {
    name: document.getElementById('player-name').value,
    table: selectedTable,
    chips: document.getElementById('player-chips').value,
    country: document.getElementById('player-country').value,  // 추가
    notable: document.getElementById('player-notable').checked,
    seat: document.getElementById('player-seat').value
  };
  
  // API 호출
  await upsertPlayer(playerData);
}
```

### 3. **메인 화면 (index.html)**

```javascript
// 플레이어 표시 시 국가 플래그 추가
function renderPlayerDetails() {
  const countryFlags = {
    'KR': '🇰🇷',
    'US': '🇺🇸',
    'JP': '🇯🇵',
    'CN': '🇨🇳',
    'GB': '🇬🇧',
    'DE': '🇩🇪',
    'FR': '🇫🇷',
    'CA': '🇨🇦',
    'AU': '🇦🇺',
    'BR': '🇧🇷'
  };
  
  return window.state.playersInHand.map(p => {
    const flag = countryFlags[p.country] || '🌍';
    return `
      <div class="player-card">
        <span class="country-flag">${flag}</span>
        <span class="player-name">${p.name}</span>
        <!-- 기존 내용 -->
      </div>
    `;
  });
}

// Type 시트에서 데이터 로드 시
function buildTypeFromCsv(rows) {
  for(let i=1; i<rows.length; i++) {
    const player = {
      name: String(r[1]||'').trim(),
      table: String(r[2]||'').trim(),
      notable: String(r[3]||'').toUpperCase()==='TRUE',
      chips: String(r[4]!=null?r[4]:'0').trim(),
      updatedAt: String(r[5]||'').trim(),
      seat: String(r[6]||'').trim(),
      status: String(r[7]||'').trim(),
      country: String(r[8]||'').trim()  // I열 추가
    };
  }
}
```

## 🎨 UI/UX 개선 제안

### 1. **국가별 통계 표시**
```javascript
// 테이블별 국가 분포 표시
function showCountryStats(tableName) {
  const players = getPlayersByTable(tableName);
  const countryCount = {};
  
  players.forEach(p => {
    const country = p.country || 'UNKNOWN';
    countryCount[country] = (countryCount[country] || 0) + 1;
  });
  
  // 통계 표시
  return Object.entries(countryCount)
    .map(([country, count]) => `${countryFlags[country]} ${count}명`)
    .join(', ');
}
```

### 2. **국가별 색상 구분**
```css
/* 국가별 플레이어 카드 색상 */
.player-card[data-country="KR"] { border-left: 3px solid #0047A0; }
.player-card[data-country="US"] { border-left: 3px solid #B22234; }
.player-card[data-country="JP"] { border-left: 3px solid #BC002D; }
.player-card[data-country="CN"] { border-left: 3px solid #DE2910; }
```

### 3. **국가 필터링 기능**
```javascript
// 국가별 플레이어 필터
function filterPlayersByCountry(country) {
  return window.state.playersInHand.filter(p => 
    country === 'ALL' || p.country === country
  );
}
```

## 📊 데이터 마이그레이션

### 기존 데이터 처리
```javascript
// 일회성 마이그레이션 스크립트
function migrateExistingData() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Type');
  const data = sheet.getDataRange().getValues();
  
  // 헤더에 Country 추가 (I1 셀)
  if (!data[0][8] || data[0][8] !== 'Country') {
    sheet.getRange(1, 9).setValue('Country');
  }
  
  // 기존 데이터에 빈 country 값 설정
  for (let i = 2; i <= sheet.getLastRow(); i++) {
    if (!sheet.getRange(i, 9).getValue()) {
      sheet.getRange(i, 9).setValue('');  // 또는 기본 국가 설정
    }
  }
}
```

## 🔍 활용 예시

### 1. **국제 토너먼트 관리**
- 각 플레이어의 국가 표시
- 국가별 통계 및 순위
- 국가 대항전 기능

### 2. **플레이어 분석**
- 국가별 플레이 스타일 분석
- 국가별 평균 칩 보유량
- 국가별 승률 통계

### 3. **시각화**
- 세계 지도에 플레이어 분포 표시
- 국가별 파이 차트
- 실시간 국가별 현황 대시보드

## ⚠️ 주의사항

1. **하위 호환성 유지**
   - country 필드가 없는 기존 데이터도 정상 작동
   - 기본값은 빈 문자열('')로 처리

2. **성능 고려**
   - 국가 정보는 선택사항으로 처리
   - 필수 입력이 아닌 옵션으로 구현

3. **데이터 검증**
   - ISO 국가 코드 유효성 검사
   - 잘못된 코드 입력 시 'OTHER'로 처리

## 🚀 구현 우선순위

### Phase 1 (필수)
1. ✅ Google Apps Script 수정
2. ✅ 데이터 구조 업데이트
3. ✅ 기본 CRUD 기능

### Phase 2 (권장)
1. ⬜ UI에 국가 선택 추가
2. ⬜ 국가 플래그 표시
3. ⬜ 기존 데이터 마이그레이션

### Phase 3 (선택)
1. ⬜ 국가별 통계 기능
2. ⬜ 필터링 및 정렬
3. ⬜ 시각화 대시보드

## 📝 테스트 체크리스트

- [ ] 새 플레이어 추가 시 국가 저장
- [ ] 기존 플레이어 국가 수정
- [ ] 국가 정보 없는 플레이어 처리
- [ ] 국가별 필터링 작동
- [ ] 플래그 아이콘 표시
- [ ] 데이터 마이그레이션 성공

---

이 설계를 따라 구현하면 기존 시스템과 완벽하게 호환되면서도 확장 가능한 국가 정보 시스템을 구축할 수 있습니다.