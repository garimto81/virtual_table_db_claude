# 🌍 Players.csv 기반 국가 정보 매핑 구현 가이드

## 📊 데이터 분석 결과

### CSV 파일 구조
- **총 80명**의 플레이어 데이터
- **국가 분포**:
  - 🇨🇦 캐나다: 75명 (93.75%)
  - 🇫🇷 프랑스: 4명 (5%)
  - 🇯🇵 일본: 1명 (Daisuke Watanabe)
  - 🇮🇷 이란: 1명 (Kianoosh Haghighi)

### 주요 발견사항
1. **대부분 캐나다** 기반 토너먼트
2. **Quebec 주**가 대다수 (몬트리올 중심)
3. 일부 국제 플레이어 참가

## 🎯 구현 아이디어

### 1️⃣ **자동 매핑 시스템**

#### 구현 방식
```javascript
// 1단계: CSV 파일을 데이터베이스로 변환
const playerDB = new Map([
  ['denis ouellette', { country: 'CA', state: 'Quebec', city: 'Mercier' }],
  ['daisuke watanabe', { country: 'JP', state: 'Quebec', city: 'Montreal' }],
  ['kianoosh haghighi', { country: 'IR', state: 'Quebec', city: 'Montreal' }],
  // ... 나머지 플레이어
]);

// 2단계: 플레이어 이름으로 국가 조회
function getCountryByName(playerName) {
  const normalized = playerName.toLowerCase().trim();
  
  // 정확한 매칭
  if (playerDB.has(normalized)) {
    return playerDB.get(normalized).country;
  }
  
  // 부분 매칭 (성 또는 이름)
  for (const [dbName, info] of playerDB) {
    if (dbName.includes(normalized) || normalized.includes(dbName)) {
      return info.country;
    }
  }
  
  // 기본값 (캐나다)
  return 'CA';
}
```

### 2️⃣ **이름 패턴 분석**

#### 국가별 이름 특징
```javascript
const namePatterns = {
  // 일본 이름
  JP: ['watanabe', 'tanaka', 'suzuki', 'sato', 'yamamoto'],
  
  // 이란/페르시아 이름
  IR: ['haghighi', 'khaddage', 'zadeh', 'pour'],
  
  // 프랑스 이름
  FR: ['ouellette', 'lavoie', 'bonneau', 'cartier', 'couture'],
  
  // 한국 이름 (만약 있다면)
  KR: ['kim', 'lee', 'park', 'choi', 'jung']
};

function guessCountryByName(name) {
  const nameLower = name.toLowerCase();
  
  for (const [country, patterns] of Object.entries(namePatterns)) {
    if (patterns.some(p => nameLower.includes(p))) {
      return country;
    }
  }
  
  return 'CA'; // 기본값
}
```

### 3️⃣ **스마트 매핑 전략**

#### 우선순위 시스템
```javascript
class CountryMapper {
  constructor() {
    this.exactMatches = new Map();   // 정확한 매칭
    this.partialMatches = new Map(); // 부분 매칭
    this.patterns = {};              // 패턴 매칭
  }
  
  getCountry(playerName) {
    // 1순위: 정확한 매칭
    if (this.exactMatches.has(playerName)) {
      return {
        country: this.exactMatches.get(playerName),
        confidence: 'high'
      };
    }
    
    // 2순위: 부분 매칭
    const partial = this.findPartialMatch(playerName);
    if (partial) {
      return {
        country: partial,
        confidence: 'medium'
      };
    }
    
    // 3순위: 패턴 매칭
    const pattern = this.matchPattern(playerName);
    if (pattern) {
      return {
        country: pattern,
        confidence: 'low'
      };
    }
    
    // 기본값
    return {
      country: 'CA',
      confidence: 'default'
    };
  }
}
```

### 4️⃣ **UI/UX 통합**

#### 플레이어 카드 디자인
```html
<div class="player-card" data-country="CA">
  <div class="country-indicator">
    <span class="flag">🇨🇦</span>
    <span class="country-code">CA</span>
  </div>
  <div class="player-info">
    <h3>Denis Ouellette</h3>
    <p class="location">Mercier, Quebec</p>
  </div>
  <div class="confidence-badge high">
    ✓ Verified
  </div>
</div>
```

#### 스타일링
```css
/* 국가별 색상 테마 */
.player-card[data-country="CA"] {
  border-left: 4px solid #FF0000; /* 캐나다 빨강 */
}

.player-card[data-country="JP"] {
  border-left: 4px solid #BC002D; /* 일본 빨강 */
}

.player-card[data-country="FR"] {
  border-left: 4px solid #0055A4; /* 프랑스 파랑 */
}

.player-card[data-country="IR"] {
  border-left: 4px solid #239F40; /* 이란 초록 */
}

/* 신뢰도 표시 */
.confidence-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}

.confidence-badge.high {
  background: #d4edda;
  color: #155724;
}

.confidence-badge.medium {
  background: #fff3cd;
  color: #856404;
}

.confidence-badge.low {
  background: #f8d7da;
  color: #721c24;
}
```

### 5️⃣ **통계 및 분석**

#### 국가별 대시보드
```javascript
function generateCountryStats(players) {
  const stats = {
    CA: { count: 0, totalChips: 0, avgChips: 0, topPlayer: null },
    JP: { count: 0, totalChips: 0, avgChips: 0, topPlayer: null },
    FR: { count: 0, totalChips: 0, avgChips: 0, topPlayer: null },
    IR: { count: 0, totalChips: 0, avgChips: 0, topPlayer: null },
    OTHER: { count: 0, totalChips: 0, avgChips: 0, topPlayer: null }
  };
  
  players.forEach(player => {
    const country = player.country || 'OTHER';
    const chips = parseInt(player.chips || 0);
    
    stats[country].count++;
    stats[country].totalChips += chips;
    
    if (!stats[country].topPlayer || chips > stats[country].topPlayer.chips) {
      stats[country].topPlayer = player;
    }
  });
  
  // 평균 계산
  Object.keys(stats).forEach(country => {
    if (stats[country].count > 0) {
      stats[country].avgChips = Math.round(
        stats[country].totalChips / stats[country].count
      );
    }
  });
  
  return stats;
}
```

## 🔧 구현 단계

### Phase 1: 데이터 준비
1. ✅ Players.csv 파싱
2. ✅ 플레이어 이름-국가 매핑 테이블 생성
3. ✅ 데이터베이스 저장 (localStorage 또는 IndexedDB)

### Phase 2: 매핑 로직
1. ⬜ 정확한 매칭 구현
2. ⬜ 부분 매칭 구현
3. ⬜ 패턴 매칭 구현
4. ⬜ 신뢰도 시스템 구현

### Phase 3: UI 통합
1. ⬜ 플레이어 카드에 국가 표시
2. ⬜ 국가 필터링 기능
3. ⬜ 국가별 통계 대시보드

### Phase 4: 고급 기능
1. ⬜ 수동 국가 수정 기능
2. ⬜ 국가 정보 학습 (머신러닝)
3. ⬜ 국가별 플레이 스타일 분석

## 💡 특별 기능 아이디어

### 1. **실시간 국가 추측**
```javascript
// 플레이어 이름 입력 시 실시간으로 국가 추측
input.addEventListener('input', (e) => {
  const name = e.target.value;
  const guess = guessCountryByName(name);
  
  // UI에 추측 결과 표시
  showCountrySuggestion(guess);
});
```

### 2. **국가별 리더보드**
```javascript
// 국가 대항전 형식의 리더보드
function createCountryLeaderboard(players) {
  const countries = groupBy(players, 'country');
  
  return Object.entries(countries)
    .map(([country, players]) => ({
      country,
      totalChips: sum(players, 'chips'),
      playerCount: players.length,
      topPlayer: maxBy(players, 'chips')
    }))
    .sort((a, b) => b.totalChips - a.totalChips);
}
```

### 3. **국가 배지 시스템**
```javascript
// 특정 국가 플레이어와 경기 시 배지 획득
const COUNTRY_BADGES = {
  'International': '5개국 이상 플레이어와 경기',
  'North American': '캐나다/미국 플레이어 10명과 경기',
  'Asian Master': '아시아 플레이어 5명과 경기',
  'European Tour': '유럽 플레이어 5명과 경기'
};
```

## 📈 예상 효과

1. **데이터 품질 향상**: 75% 이상 자동 매칭 가능
2. **사용자 경험 개선**: 시각적 국가 표시로 다양성 강조
3. **통계 분석 강화**: 국가별 플레이 패턴 분석 가능
4. **국제화 준비**: 다국적 토너먼트 지원

## 🚀 즉시 구현 가능한 MVP

```javascript
// 간단한 하드코딩 매핑으로 시작
const KNOWN_PLAYERS = {
  'Daisuke Watanabe': 'JP',
  'Kianoosh Haghighi': 'IR',
  'Sami Ouladitto': 'FR',
  'Audrey Slama': 'FR'
  // 나머지는 기본값 CA
};

function getPlayerCountry(name) {
  return KNOWN_PLAYERS[name] || 'CA';
}
```

이렇게 시작하고 점진적으로 개선해나가면 됩니다!