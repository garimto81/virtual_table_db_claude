# 포커 스트리트 프로세스 완전 정의

## 📌 스트리트의 기본 규칙

### 액션 순서
1. **딜러 버튼 기준**: 시계 방향으로 진행
2. **프리플랍**: 빅블라인드 다음 플레이어부터 시작
3. **포스트플랍**: 스몰블라인드(또는 가장 가까운 활성 플레이어)부터 시작

## 🎯 스트리트에서 가능한 모든 시나리오

### 1. PREFLOP 시나리오

#### 시나리오 1-1: 모두 폴드
```
UTG: Fold
MP: Fold  
CO: Fold
BTN: Fold
SB: Fold
→ BB 승리 (종료)
```
**종료 조건**: 1명만 남음

#### 시나리오 1-2: 림프 팟
```
UTG: Call BB
MP: Call BB
CO: Call BB
BTN: Call BB
SB: Call BB
BB: Check
→ FLOP으로 진행
```
**종료 조건**: 모든 플레이어가 같은 금액을 넣고, 마지막 플레이어가 Check/Call

#### 시나리오 1-3: 레이즈와 콜
```
UTG: Raise to 3BB
MP: Fold
CO: Call 3BB
BTN: Fold
SB: Fold
BB: Call 3BB
→ FLOP으로 진행
```
**종료 조건**: 레이즈 후 모든 활성 플레이어가 콜

#### 시나리오 1-4: 3벳과 4벳
```
UTG: Raise to 3BB
MP: Reraise to 9BB (3bet)
CO: Fold
BTN: Reraise to 27BB (4bet)
SB: Fold
BB: Fold
UTG: Call 27BB
MP: Call 27BB
→ FLOP으로 진행
```
**종료 조건**: 마지막 레이즈에 모두 콜

#### 시나리오 1-5: 올인
```
UTG: Raise to 3BB
MP: All-in 100BB
CO: Fold
BTN: Call 100BB (또는 All-in)
SB: Fold
BB: Fold
UTG: Fold
→ 2명 올인, 즉시 5장 오픈 가능
```
**특수 상황**: 사이드팟 없는 헤드업 올인

### 2. POSTFLOP (Flop/Turn/River) 시나리오

#### 시나리오 2-1: 전원 체크
```
SB: Check
BB: Check
UTG: Check
MP: Check
→ 다음 스트리트로
```
**종료 조건**: 모든 활성 플레이어 체크

#### 시나리오 2-2: 벳과 콜
```
SB: Check
BB: Bet 50
UTG: Call 50
MP: Call 50
SB: Call 50
→ 다음 스트리트로
```
**종료 조건**: 벳에 모두 콜

#### 시나리오 2-3: 벳과 레이즈
```
SB: Check
BB: Bet 50
UTG: Raise to 150
MP: Fold
SB: Fold
BB: Call 150
→ 다음 스트리트로
```
**종료 조건**: 레이즈에 남은 플레이어 콜

#### 시나리오 2-4: 체크-레이즈
```
SB: Check
BB: Check
UTG: Bet 100
MP: Fold
SB: Raise to 300 (체크-레이즈)
BB: Fold
UTG: Call 300
→ 다음 스트리트로
```
**종료 조건**: 체크-레이즈에 콜

#### 시나리오 2-5: 멀티플 레이즈
```
SB: Bet 50
BB: Raise to 150
UTG: Reraise to 450
SB: Call 450
BB: Call 450
→ 다음 스트리트로
```
**종료 조건**: 마지막 레이즈에 모두 콜

## 🔍 스트리트 종료 조건 명확화

### ✅ 정상 종료 (다음 스트리트로 진행)
1. **모든 활성 플레이어가 같은 금액을 팟에 넣었고**
2. **마지막 액션이 Check 또는 Call**

```javascript
function isStreetComplete(street) {
  const actions = state.actionState[street];
  const activePlayers = getActivePlayers(); // fold/allin 제외
  
  if (actions.length === 0) return false;
  
  // 마지막 액션 확인
  const lastAction = actions[actions.length - 1];
  if (!['Checks', 'Calls'].includes(lastAction.action)) {
    return false;
  }
  
  // 각 플레이어의 총 베팅액 계산
  const playerBets = {};
  actions.forEach(action => {
    if (action.amount && action.player) {
      playerBets[action.player] = (playerBets[action.player] || 0) + 
                                   parseInt(action.amount);
    }
  });
  
  // 올인이 아닌 활성 플레이어들의 베팅액 확인
  const betAmounts = activePlayers
    .filter(p => state.playerStatus[p] !== 'allin')
    .map(p => playerBets[p] || 0);
  
  // 모두 같은 금액인지 확인 (체크는 0)
  const maxBet = Math.max(...betAmounts);
  return betAmounts.every(amt => amt === maxBet || amt === 0);
}
```

### 🛑 조기 종료 (핸드 종료)
1. **1명만 남음** (나머지 모두 폴드)
2. **올인 쇼다운** (베팅 불가능한 상황)

```javascript
function shouldEndHand() {
  const activePlayers = getActivePlayers();
  
  // 1명만 남음
  if (activePlayers.length === 1) {
    return { end: true, reason: 'last_player' };
  }
  
  // 올인 쇼다운 체크
  const nonAllinPlayers = activePlayers.filter(p => 
    state.playerStatus[p] !== 'allin'
  );
  
  if (nonAllinPlayers.length <= 1) {
    // 베팅 가능한 플레이어가 0명 또는 1명
    return { end: true, reason: 'allin_showdown' };
  }
  
  return { end: false };
}
```

### ⏸️ 대기 상태 (액션 필요)
1. **베팅/레이즈 후** 다른 플레이어 액션 대기
2. **체크 후** 다음 플레이어 액션 대기

## 📊 사이드팟 시나리오

### 시나리오 3-1: 단순 사이드팟
```
Player A (100 chips): All-in 100
Player B (300 chips): Call 100
Player C (500 chips): Call 100
→ 메인팟: 300 (A, B, C 참여)
→ B와 C는 계속 베팅 가능
```

### 시나리오 3-2: 복수 사이드팟
```
Player A (50 chips): All-in 50
Player B (150 chips): All-in 150
Player C (500 chips): Call 150
→ 메인팟: 150 (A, B, C 참여)
→ 사이드팟1: 200 (B, C 참여)
→ C는 계속 베팅 가능
```

## 🎮 자동 진행 트리거

### 즉시 진행 가능
```javascript
const AUTO_ADVANCE_TRIGGERS = {
  // 1. 모두 체크
  allCheck: (actions, players) => {
    return players.every(p => 
      actions.find(a => a.player === p && a.action === 'Checks')
    );
  },
  
  // 2. 벳/레이즈에 모두 콜
  allCall: (actions, players) => {
    const lastRaise = findLastRaise(actions);
    if (!lastRaise) return false;
    
    const afterRaise = actions.slice(actions.indexOf(lastRaise) + 1);
    return players
      .filter(p => p !== lastRaise.player)
      .every(p => afterRaise.find(a => 
        a.player === p && ['Calls', 'Folds'].includes(a.action)
      ));
  },
  
  // 3. 1명 제외 모두 폴드
  onlyOneLeft: (actions, players) => {
    const foldCount = actions.filter(a => a.action === 'Folds').length;
    return foldCount >= players.length - 1;
  },
  
  // 4. 올인 쇼다운
  allinShowdown: (actions, players) => {
    const allinCount = actions.filter(a => a.action === 'All In').length;
    const activeNonAllin = players.length - allinCount;
    return activeNonAllin <= 1;
  }
};
```

## 📋 액션 유효성 검증

### 유효한 액션 조합
```javascript
function getValidActions(player, street) {
  const lastAction = getLastAction(street);
  const playerLastAction = getPlayerLastAction(player, street);
  
  // 이미 폴드한 플레이어
  if (state.playerStatus[player] === 'folded') {
    return [];
  }
  
  // 이미 올인한 플레이어
  if (state.playerStatus[player] === 'allin') {
    return [];
  }
  
  // 첫 액션 (포스트플랍) 또는 체크 후
  if (!lastAction || lastAction.action === 'Checks') {
    return ['Check', 'Bet', 'All In'];
  }
  
  // 베팅/레이즈 후
  if (['Bets', 'Raises', 'All In'].includes(lastAction.action)) {
    // 이미 같은 금액을 콜했으면 액션 불가
    if (playerLastAction?.action === 'Calls' && 
        playerLastAction.amount === lastAction.amount) {
      return [];
    }
    return ['Fold', 'Call', 'Raise', 'All In'];
  }
  
  return [];
}
```

## 🚀 구현 우선순위

### Level 1: 기본 종료 조건
- [x] 1명만 남음 감지
- [x] 모두 체크 감지
- [x] 벳에 모두 콜 감지

### Level 2: 올인 처리
- [ ] 올인 플레이어 추적
- [ ] 사이드팟 계산
- [ ] 올인 쇼다운 감지

### Level 3: 자동 진행
- [ ] 스트리트 완료 자동 감지
- [ ] 다음 스트리트 자동 전환
- [ ] 보드 카드 자동 프롬프트

### Level 4: 고급 기능
- [ ] 액션 타이머
- [ ] 미스클릭 방지
- [ ] 액션 히스토리 분석