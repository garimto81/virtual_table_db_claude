# Check/Call 통합 분석 및 스트리트 종료 조건 재정의

## 🎯 Check vs Call 비교

### Check (체크)
- **조건**: 현재 베팅이 없을 때만 가능
- **비용**: 0
- **상황**: 
  - 스트리트 시작 시 첫 액션
  - 모든 플레이어가 체크한 후
  
### Call (콜)
- **조건**: 베팅이 있을 때만 가능
- **비용**: 마지막 베팅 금액
- **상황**:
  - 누군가 Bet/Raise 후
  - 올인에 대응

## ✅ Check/Call 통합 가능성

### 🎯 통합 버튼 로직
```javascript
function getSmartAction(player, street) {
  const lastBet = findLastBet(street);
  const playerTotal = getPlayerTotalBet(player, street);
  
  if (!lastBet || lastBet.amount === 0) {
    // 베팅 없음 → CHECK
    return {
      action: 'Check',
      amount: 0,
      label: 'Check'
    };
  } else {
    // 베팅 있음 → CALL
    const callAmount = lastBet.amount - playerTotal;
    const playerChips = getPlayerChips(player);
    
    if (playerChips <= callAmount) {
      // 칩 부족 → ALL-IN CALL
      return {
        action: 'All In',
        amount: playerChips,
        label: `All-in ${playerChips}`
      };
    } else {
      // 일반 CALL
      return {
        action: 'Call',
        amount: callAmount,
        label: `Call ${callAmount}`
      };
    }
  }
}
```

### ✨ 개선된 UI 제안
```html
<!-- 기존: 2개 버튼 -->
<button data-action="Checks">Check</button>
<button data-action="Calls">Call</button>

<!-- 개선: 1개 스마트 버튼 -->
<button id="smart-check-call" class="btn bg-green-600">
  <span class="action-label">Check</span>
  <span class="amount-label"></span>
</button>
```

**장점:**
1. 사용자 실수 방지 (잘못된 액션 선택 불가)
2. UI 단순화
3. 직관적인 플로우

**단점:**
1. 명시적 구분 감소
2. 교육적 가치 감소 (초보자가 Check/Call 차이 학습 어려움)

---

## 📋 스트리트 종료 조건 재정의

### 🔄 수정된 종료 조건

```javascript
function isStreetComplete(street) {
  const actions = state.actionState[street];
  const activePlayers = getActivePlayers(); // fold 제외
  const bettingPlayers = getBettingPlayers(); // fold, all-in 제외
  
  // 1. 베팅 가능한 플레이어가 1명 이하
  if (bettingPlayers.length <= 1) {
    return { complete: true, reason: 'no_more_betting' };
  }
  
  // 2. 액션 순환 완료 체크
  const betRounds = splitByBettingRounds(actions);
  const lastRound = betRounds[betRounds.length - 1];
  
  // 마지막 베팅 라운드에서 모든 베팅 가능 플레이어가 액션
  const actedInLastRound = new Set(
    lastRound.map(a => a.player)
  );
  
  // Fold는 제외하고 체크
  const needsAction = bettingPlayers.filter(p => 
    !actedInLastRound.has(p)
  );
  
  if (needsAction.length > 0) {
    return { complete: false, waiting: needsAction };
  }
  
  // 3. 베팅 균등화 확인
  const totalBets = calculateTotalBets(actions);
  const maxBet = Math.max(...Object.values(totalBets), 0);
  
  for (const player of bettingPlayers) {
    const playerBet = totalBets[player] || 0;
    if (playerBet < maxBet) {
      return { complete: false, needsCall: player };
    }
  }
  
  return { complete: true, reason: 'all_equal' };
}
```

### 📊 시나리오별 종료 판단

#### ✅ Case 1: Bet → Call → Fold
```javascript
Player A: Bet 100
Player B: Call 100  
Player C: Fold
// 종료: A와 B가 같은 금액, C는 제외
```

#### ✅ Case 2: 올인 콜 (칩 부족)
```javascript
Player A: All-in 500
Player B: All-in 300 (칩 부족, 전체 칩)
Player C: Call 500
// 종료: B는 사이드팟, A와 C는 메인팟+사이드팟
```

#### ✅ Case 3: 올인 리레이즈
```javascript
Player A: All-in 500
Player B: Call 300 (올인)
Player C: Call 500
Player D: All-in 1000 (리레이즈)
// D의 액션 후 A, C 추가 액션 필요
// A: 이미 올인 (액션 불가)
// C: 500 추가 콜 필요 → 대기
```

#### ❌ Case 4: 미완료 상황
```javascript
Player A: Bet 100
Player B: Raise 300
Player C: ?
// 미완료: C의 액션 대기
```

---

## 🎲 사이드팟 처리 로직

```javascript
function calculatePots(actions, players) {
  // 각 플레이어의 총 베팅액
  const contributions = {};
  actions.forEach(a => {
    if (a.amount) {
      contributions[a.player] = (contributions[a.player] || 0) + 
                                parseInt(a.amount);
    }
  });
  
  // 올인 플레이어 정렬 (금액 오름차순)
  const allInPlayers = players
    .filter(p => state.playerStatus[p] === 'allin')
    .sort((a, b) => contributions[a] - contributions[b]);
  
  const pots = [];
  let remainingPlayers = [...players];
  let previousCap = 0;
  
  // 각 올인 레벨별 팟 생성
  allInPlayers.forEach(allinPlayer => {
    const cap = contributions[allinPlayer];
    const potAmount = (cap - previousCap) * remainingPlayers.length;
    
    pots.push({
      amount: potAmount,
      players: [...remainingPlayers],
      cap: cap
    });
    
    // 이 플레이어는 다음 팟에서 제외
    remainingPlayers = remainingPlayers.filter(p => p !== allinPlayer);
    previousCap = cap;
  });
  
  // 남은 베팅 (최고 베팅자들끼리)
  if (remainingPlayers.length > 0) {
    const maxBet = Math.max(
      ...remainingPlayers.map(p => contributions[p] || 0)
    );
    const finalPot = (maxBet - previousCap) * remainingPlayers.length;
    
    if (finalPot > 0) {
      pots.push({
        amount: finalPot,
        players: remainingPlayers,
        cap: maxBet
      });
    }
  }
  
  return pots;
}
```

### 예시: 복잡한 사이드팟
```javascript
// 상황
Player A: All-in 100
Player B: All-in 300  
Player C: Call 300
Player D: All-in 500

// 계산 결과
Main Pot: 400 (100×4) - A, B, C, D
Side Pot 1: 600 ((300-100)×3) - B, C, D  
Side Pot 2: 400 ((500-300)×2) - D, C

// 총 팟: 1400
```

---

## 💡 구현 권장사항

### 1. Check/Call 통합
**권장**: **조건부 통합**
- 초보자 모드: 분리 (교육 목적)
- 숙련자 모드: 통합 (효율성)

```javascript
// 설정 옵션
state.smartButtons = true; // 토글 가능

// UI 렌더링
if (state.smartButtons) {
  renderSmartCheckCall();
} else {
  renderSeparateButtons();
}
```

### 2. 스트리트 종료 로직
```javascript
function getStreetStatus(street) {
  const active = getActivePlayers();
  const betting = getBettingPlayers();
  
  // 우선순위별 체크
  if (active.length === 1) {
    return 'HAND_END';
  }
  
  if (betting.length === 0) {
    return 'SHOWDOWN'; // 모두 올인
  }
  
  if (betting.length === 1) {
    if (hasUncalledBet()) {
      return 'UNCALLED_BET'; // 베팅 반환
    }
    return 'STREET_END'; // 다음 스트리트
  }
  
  if (allBetsEqual() && allPlayersActed()) {
    return 'STREET_END';
  }
  
  return 'WAITING';
}
```

### 3. 자동 진행 트리거
```javascript
const AUTO_ADVANCE = {
  'HAND_END': () => declareWinner(),
  'SHOWDOWN': () => dealRemainingCards(),
  'STREET_END': () => advanceStreet(),
  'UNCALLED_BET': () => {
    returnUncalledBet();
    advanceStreet();
  },
  'WAITING': () => waitForAction()
};
```

## 📌 결론

### Check/Call 통합
- **가능**: 기술적으로 완전히 가능
- **추천**: 옵션으로 제공 (토글 가능)

### 스트리트 종료 조건
1. 모든 베팅 가능 플레이어가 같은 금액
2. 마지막 액션이 Call/Check/Fold
3. 베팅 가능 플레이어 1명 이하

### 사이드팟
- 올인 금액별로 자동 분할
- 각 팟별 참여자 추적
- 승자 결정 시 팟별 분배