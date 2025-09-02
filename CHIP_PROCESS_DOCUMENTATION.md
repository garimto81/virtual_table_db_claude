# 포커 핸드 로거 - 칩 프로세스 문서

## 📊 액션별 칩 변동 프로세스

### 1. **Bet/Raise 액션**
```javascript
// 베팅/레이즈 시 처리
action: 'Bets' 또는 'Raises'
amount: 입력한 금액

처리:
1. 플레이어 칩에서 amount 차감
2. p.chips = p.chips - amount
3. 팟 사이즈에 amount 추가
4. chipsUpdatedAt 타임스탬프 기록
```

### 2. **Call 액션**
```javascript
// 수정된 콜 로직
1. 현재 스트리트에서 마지막 Bet/Raise/All In 찾기
2. 없으면 이전 스트리트들 확인
3. 콜 금액 결정:
   - 베팅 있음: 해당 베팅 금액
   - 프리플랍 베팅 없음: 빅블라인드
   - 포스트플랍 베팅 없음: 체크 권장
4. 올인 콜 체크:
   - 플레이어 칩 < 콜 금액: All In 처리
   - 플레이어 칩 >= 콜 금액: 일반 콜
```

### 3. **All In 액션**
```javascript
action: 'All In'
amount: p.chips (플레이어의 모든 칩)

처리:
1. 플레이어의 모든 칩을 베팅
2. p.chips = 0
3. 팟 사이즈에 전체 칩 추가
```

### 4. **Fold/Check 액션**
```javascript
action: 'Folds' 또는 'Checks'
amount: null

처리:
- 칩 변동 없음
- 팟 사이즈 변경 없음
```

### 5. **Pot Correction (팟 사이즈 조정)**
```javascript
// 수정된 팟 조정 로직
action: 'Pot Correction'
amount: 입력한 팟 사이즈 (조정된 최종값)

처리:
1. 입력값을 새로운 팟 사이즈로 직접 설정
2. cumulativePot = amount (기존 팟 무시)
3. 플레이어 칩 변동 없음
```

## 🔧 칩 계산 핵심 함수들

### addActionToLog 함수
```javascript
function addActionToLog(action, amount=null){
  if (amount){
    const p = state.playersInHand.find(pp => pp.name === actionPadPlayer);
    if (p){
      const cur = parseInt(unformatNumber(p.chips) || 0, 10);
      const amountToDeduct = parseInt(unformatNumber(amount), 10);
      const newChips = Math.max(0, cur - amountToDeduct); // 음수 방지
      p.chips = newChips.toString();
      p.chipsUpdatedAt = new Date().toISOString();
    }
  }
  // 액션 기록
  state.actionState[street].push({
    player: actionPadPlayer,
    action,
    amount,
    timestamp: new Date().toISOString()
  });
}
```

### renderActionStreets 함수 (팟 계산)
```javascript
function renderActionStreets(){
  let cumulativePot = 0;
  
  streets.forEach(street => {
    let streetPot = 0;
    
    // 프리플랍 블라인드
    if(street === 'preflop'){
      streetPot += SB + BB + (Ante ? BB : 0);
    }
    
    // Pot Correction 확인
    const potCorrection = logs.find(a => a.action === 'Pot Correction');
    if(potCorrection) {
      // 팟을 직접 설정
      cumulativePot = parseInt(potCorrection.amount);
    } else {
      // 일반 액션들 합산
      logs.forEach(a => {
        if(a.amount && a.action !== 'Pot Correction') {
          streetPot += parseInt(a.amount);
        }
      });
      cumulativePot += streetPot;
    }
  });
}
```

## 📝 주요 개선사항

### ✅ 수정 완료
1. **Pot Correction**: 입력값을 그대로 팟 사이즈로 설정 (기존 팟 무시)
2. **Call 로직**: 
   - 현재/이전 스트리트의 모든 베팅 확인
   - All In도 콜 대상으로 포함
   - 포스트플랍에서 베팅 없으면 체크 권장

### 🎯 동작 검증 포인트
1. **프리플랍 콜**: 베팅 없으면 BB 콜
2. **포스트플랍 콜**: 베팅 없으면 체크 권장 메시지
3. **올인 콜**: 칩 부족 시 자동 올인 처리
4. **팟 조정**: 입력값이 새 팟 사이즈가 됨
5. **음수 방지**: 칩이 0 이하로 떨어지지 않음

## 🔍 테스트 시나리오

### 시나리오 1: 기본 베팅
```
1. Player A: Bet 100 → 칩 -100, 팟 +100
2. Player B: Call 100 → 칩 -100, 팟 +100
3. 팟 총액: 200
```

### 시나리오 2: 올인 콜
```
1. Player A: Bet 500
2. Player B (칩 300): Call → 자동 All In 300
```

### 시나리오 3: 팟 조정
```
1. 현재 팟: 1000
2. Pot Correction: 1500
3. 새 팟: 1500 (1000 무시)
```

### 시나리오 4: 멀티 스트리트 콜
```
1. Flop: Player A Bet 100
2. Turn: 아무도 베팅 안함
3. Turn: Player B Call → 100 콜 (Flop 베팅 참조)
```

## 📌 주의사항
- 모든 금액은 천단위 콤마 포맷 자동 처리
- 칩 변경 시 항상 타임스탬프 기록
- Undo 시 칩 복구 처리
- Type 시트에는 변경된 플레이어만 업데이트