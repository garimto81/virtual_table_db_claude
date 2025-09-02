# 스트리트 자동 진행 시스템 제안

## 🎮 방안 2: Smart Auto-Advance (추천)

### 핵심 컨셉
- **컨텍스트 인식**: 액션에 따라 다음 스트리트 자동 결정
- **플레이어 상태 추적**: Fold/All-in 플레이어 자동 관리
- **유연한 제어**: 자동/수동 모드 토글

### 구현 설계

```javascript
// State 확장
state = {
  ...existing,
  autoAdvanceMode: true,  // 자동 진행 모드 on/off
  playerStatus: {
    // {playerName: 'active' | 'folded' | 'allin'}
  },
  streetComplete: {
    preflop: false,
    flop: false,
    turn: false,
    river: false
  }
}

// 자동 진행 로직
function checkAutoAdvance() {
  if (!state.autoAdvanceMode) return;
  
  const activePlayers = getActivePlayers();
  const currentStreet = state.currentStreet;
  
  // 1. All-in 상황 체크
  if (activePlayers.length <= 1 || allPlayersActedOrAllin()) {
    // 모든 플레이어가 올인이거나 1명만 남음
    autoCompleteToRiver();
    return;
  }
  
  // 2. 스트리트 완료 체크
  if (isStreetComplete(currentStreet)) {
    // 다음 스트리트로 자동 전환
    if (shouldAddBoard(currentStreet)) {
      promptBoardCards(() => {
        advanceToNextStreet();
      });
    } else {
      advanceToNextStreet();
    }
  }
}

// 스트리트 완료 판단
function isStreetComplete(street) {
  const actions = state.actionState[street];
  const activePlayers = getActivePlayers();
  
  // 모든 활성 플레이어가 액션했는지 확인
  const actedPlayers = new Set(actions.map(a => a.player));
  
  // 마지막 액션이 체크/콜이면 완료
  const lastAction = actions[actions.length - 1];
  if (lastAction && (lastAction.action === 'Checks' || lastAction.action === 'Calls')) {
    return actedPlayers.size >= activePlayers.length - 1;
  }
  
  return false;
}
```

### UI/UX 플로우

```
┌─────────────────────────────────────┐
│  [✓] Auto-Advance Mode              │  ← 토글 스위치
└─────────────────────────────────────┘

PREFLOP
├─ Player A: Raises 100
├─ Player B: Folds      → 상태: folded
├─ Player C: Calls 100
└─ Player D: Calls 100  → [자동으로 FLOP 전환]

FLOP [자동 보드 카드 프롬프트]
├─ Player A: Bets 200
├─ Player C: All In 500 → 상태: allin
└─ Player D: Folds      → [자동으로 TURN 전환]

TURN [자동 보드 카드 프롬프트]
└─ [Player A vs All-in] → [자동으로 RIVER 전환]

RIVER [자동 보드 카드 프롬프트]
└─ [Showdown 자동 표시]
```

### 주요 기능

#### 1. 액션별 자동 처리
```javascript
function handleActionWithAutoAdvance(action, player, amount) {
  // 기존 액션 처리
  addActionToLog(action, amount);
  
  // 플레이어 상태 업데이트
  if (action === 'Folds') {
    state.playerStatus[player] = 'folded';
  } else if (action === 'All In') {
    state.playerStatus[player] = 'allin';
  }
  
  // 자동 진행 체크
  setTimeout(() => {
    checkAutoAdvance();
  }, 500); // 0.5초 딜레이로 UX 개선
}
```

#### 2. 보드 카드 자동 프롬프트
```javascript
function promptBoardCards(callback) {
  const street = getNextStreet();
  const cardsNeeded = getCardsNeeded(street);
  
  // 모달 자동 오픈
  openCardSelectorWithCallback(cardsNeeded, (cards) => {
    assignBoardCards(cards);
    callback();
  });
}
```

#### 3. 올인 런아웃
```javascript
function autoCompleteToRiver() {
  const remainingStreets = getRemainingStreets();
  
  // 남은 보드 카드 한번에 입력
  openMultiCardSelector(remainingStreets, (allCards) => {
    assignAllRemainingCards(allCards);
    jumpToRiver();
    showMessage('올인 런아웃 완료');
  });
}
```

---

## 🎯 방안 3: Workflow Templates (워크플로우 템플릿)

### 핵심 컨셉
미리 정의된 시나리오 템플릿 제공

### 템플릿 예시

#### "Quick All-in"
```
1. Preflop 액션 입력
2. 올인 발생 시 → 즉시 5장 보드 입력
3. 승자 선택
```

#### "Heads-up"
```
1. 2명만 선택
2. 각 스트리트 자동 전환
3. 폴드 시 즉시 종료
```

#### "Multi-way"
```
1. 3명 이상 선택
2. 각 플레이어 액션 추적
3. 사이드팟 자동 계산
```

### 구현 코드
```javascript
const WORKFLOW_TEMPLATES = {
  'quick-allin': {
    name: '빠른 올인',
    steps: [
      { type: 'input', target: 'players', min: 2 },
      { type: 'input', target: 'preflop-actions' },
      { type: 'check', condition: 'has-allin', 
        true: { type: 'input', target: 'all-board-cards' },
        false: { type: 'continue' }
      },
      { type: 'input', target: 'winner' }
    ]
  },
  'standard': {
    name: '표준 진행',
    steps: [
      { type: 'input', target: 'players' },
      { type: 'loop', streets: ['preflop', 'flop', 'turn', 'river'],
        body: [
          { type: 'input', target: 'street-actions' },
          { type: 'auto-advance' }
        ]
      }
    ]
  }
};

function executeWorkflow(templateId) {
  const template = WORKFLOW_TEMPLATES[templateId];
  const executor = new WorkflowExecutor(template);
  executor.start();
}
```

---

## 🎨 UI 구성 제안

### 메인 컨트롤
```html
<div class="auto-control-panel">
  <!-- 모드 선택 -->
  <div class="mode-selector">
    <button class="mode-btn active" data-mode="manual">수동</button>
    <button class="mode-btn" data-mode="smart">스마트</button>
    <button class="mode-btn" data-mode="template">템플릿</button>
  </div>
  
  <!-- 스마트 모드 옵션 -->
  <div class="smart-options" style="display:none;">
    <label>
      <input type="checkbox" checked> 폴드 플레이어 자동 제외
    </label>
    <label>
      <input type="checkbox" checked> 올인 시 자동 런아웃
    </label>
    <label>
      <input type="checkbox"> 보드 카드 자동 프롬프트
    </label>
  </div>
  
  <!-- 템플릿 선택 -->
  <div class="template-selector" style="display:none;">
    <select>
      <option>빠른 올인</option>
      <option>헤드업</option>
      <option>멀티웨이</option>
    </select>
  </div>
</div>
```

### 진행 인디케이터
```html
<div class="progress-indicator">
  <div class="step completed">Preflop</div>
  <div class="step active">Flop</div>
  <div class="step pending">Turn</div>
  <div class="step pending">River</div>
</div>
```

---

## 📊 장단점 비교

| 방안 | 장점 | 단점 | 추천도 |
|------|------|------|--------|
| **Quick Mode** | 매우 빠름 | 실수 정정 어려움 | ★★☆ |
| **Smart Auto** | 자연스러운 플로우, 유연함 | 구현 복잡도 중간 | ★★★ |
| **Templates** | 시나리오별 최적화 | 학습 곡선 있음 | ★★☆ |

## 🚀 구현 우선순위

### Phase 1 (즉시 구현 가능)
1. 폴드한 플레이어 다음 스트리트에서 자동 제외
2. 마지막 콜/체크 후 다음 스트리트 자동 전환
3. 올인 발생 시 빠른 보드 입력 옵션

### Phase 2 (추가 개발)
1. 스마트 모드 on/off 토글
2. 자동 보드 카드 프롬프트
3. 진행 상태 시각화

### Phase 3 (고급 기능)
1. 워크플로우 템플릿
2. 사용자 정의 템플릿
3. 단축키 지원

## 💡 추천 구현 방식

**Smart Auto-Advance (방안 2)** 를 기본으로 하되:
1. 초기엔 토글 on/off 만 제공
2. 사용자 피드백 수집 후 세부 옵션 추가
3. 자주 사용되는 패턴을 템플릿화

이렇게 하면 현재 시스템을 크게 변경하지 않으면서도 효율성을 크게 높일 수 있습니다.