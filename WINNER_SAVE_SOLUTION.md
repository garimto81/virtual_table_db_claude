# 🏆 승자 정보 저장 문제 해결 방안

## 📊 문제 분석

### 현재 상황
1. **승자 선택 기능은 존재**: `setPlayerRole()` 함수로 승자 선택 가능
2. **UI 표시는 정상**: 승자 선택 시 칩 자동 계산 및 표시
3. **저장 시 문제**: Google Sheets로 전송 시 승자 정보가 누락되는 것으로 추정

### 코드 분석 결과
```javascript
// 현재 승자 체크 로직 (line 2110)
if (window.state.playersInHand.filter(p=>p.role==='winner').length===0){
  showFeedback('승자를 선택해야 합니다.', true);
  return;
}

// 승자 설정 (line 981)
p.role = 'winner';
```

## 🎯 해결 방안

### 방안 1: Index 시트에 Winner 열 추가
```
현재 Index 시트 구조:
A: HandNumber | B: Date | C: Street | D: Pot | E: Board | F: Winners | ...

문제: Winners 열(F)이 있지만 실제로 저장되지 않음
```

### 방안 2: Hand 시트 구조 개선
```
현재 Hand 시트에는 승자 정보를 저장할 명확한 필드가 없음
→ 승자 표시를 위한 추가 필드 필요
```

## 💡 추천 솔루션

### 1️⃣ **즉시 적용 가능한 수정** (코드 패치)

#### A. sendDataToGoogleSheet 함수 수정
```javascript
// index.html 수정 위치 (약 2240줄 근처)
async function sendDataToGoogleSheet() {
  // ... 기존 코드 ...
  
  // 승자 정보 수집
  const winners = window.state.playersInHand
    .filter(p => p.role === 'winner')
    .map(p => p.name);
  
  // Index 시트 데이터에 승자 추가
  const indexMeta = {
    handNumber: parseInt(el.handNumber.value, 10) || 1,
    dateTime: getCurrentTimeKST(),
    street: streetMapping[window.state.currentStreet] || window.state.currentStreet,
    pot: calculateFinalPot(),
    board: boardCards.join(' '),
    winners: winners.join(', '),  // ← 승자 정보 추가
    workStatus: determineWorkStatus(),
    // ... 나머지 필드
  };
  
  // Hand 시트 데이터에도 승자 마킹
  const handData = window.state.playersInHand.map(p => {
    const isWinner = p.role === 'winner';
    return {
      name: p.name,
      initialChips: p.initialChips,
      finalChips: p.finalChips,
      hand: p.hand,
      isWinner: isWinner,  // ← 승자 플래그 추가
      gain: isWinner ? calculateFinalPot() : 0
    };
  });
}
```

### 2️⃣ **Type 시트 활용 방안**

Type 시트에 승자 기록용 필드 추가:
```
기존: A-K열 (Country/CountryVerified 추가됨)
추가: L열 (LastWin) - 마지막 승리 시간
     M열 (WinCount) - 총 승리 횟수
```

### 3️⃣ **승자 통계 시스템**

```javascript
// 승자 통계 관리 클래스
class WinnerStatistics {
  constructor() {
    this.stats = this.loadStats();
  }
  
  loadStats() {
    // localStorage에서 통계 로드
    const saved = localStorage.getItem('pokerWinnerStats');
    return saved ? JSON.parse(saved) : {};
  }
  
  saveStats() {
    localStorage.setItem('pokerWinnerStats', JSON.stringify(this.stats));
  }
  
  recordWin(playerName, pot, handNumber) {
    if (!this.stats[playerName]) {
      this.stats[playerName] = {
        wins: 0,
        totalWinnings: 0,
        lastWin: null,
        winHistory: []
      };
    }
    
    this.stats[playerName].wins++;
    this.stats[playerName].totalWinnings += pot;
    this.stats[playerName].lastWin = new Date().toISOString();
    this.stats[playerName].winHistory.push({
      handNumber,
      pot,
      date: new Date().toISOString()
    });
    
    this.saveStats();
  }
  
  getPlayerStats(playerName) {
    return this.stats[playerName] || null;
  }
  
  getLeaderboard() {
    return Object.entries(this.stats)
      .map(([name, data]) => ({
        name,
        ...data,
        avgPot: Math.round(data.totalWinnings / data.wins)
      }))
      .sort((a, b) => b.wins - a.wins);
  }
}

// 전역 인스턴스
window.winnerStats = new WinnerStatistics();
```

### 4️⃣ **Apps Script 수정**

`Code_v59_InOut.gs`에 승자 처리 추가:
```javascript
function saveHandResult(data) {
  // ... 기존 코드 ...
  
  // Index 시트에 승자 저장
  if (data.winners && data.winners.length > 0) {
    const winnersStr = data.winners.join(', ');
    indexSheet.getRange(rowNum, 6).setValue(winnersStr); // F열: Winners
  }
  
  // Hand 시트에 승자 표시
  data.players.forEach((player, idx) => {
    if (player.isWinner) {
      // 승자 표시 (예: 배경색 변경)
      const playerRow = startRow + idx;
      handSheet.getRange(playerRow, 1, 1, 8)
        .setBackground('#fff3cd'); // 연한 노란색 배경
    }
  });
  
  // Type 시트 승자 통계 업데이트
  if (data.winners && data.winners.length > 0) {
    updateWinnerStats(data.winners[0], data.pot);
  }
}

function updateWinnerStats(winnerName, pot) {
  const typeSheet = ss.getSheetByName('Type');
  const data = typeSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === winnerName) { // B열: Player
      const currentWins = data[i][12] || 0; // M열: WinCount
      typeSheet.getRange(i + 1, 12).setValue(new Date()); // L열: LastWin
      typeSheet.getRange(i + 1, 13).setValue(currentWins + 1); // M열: WinCount
      break;
    }
  }
}
```

## 🚀 구현 우선순위

### 단기 (즉시 적용)
1. ✅ `sendDataToGoogleSheet` 함수에서 승자 정보 포함
2. ✅ Index 시트 F열(Winners)에 승자 이름 저장
3. ✅ 전송 전 승자 선택 여부 확인 강화

### 중기 (1-2일)
1. ⬜ Type 시트에 승자 통계 열 추가
2. ⬜ localStorage 기반 승자 통계 시스템
3. ⬜ 승자 히스토리 조회 기능

### 장기 (선택사항)
1. ⬜ 승자 리더보드 UI
2. ⬜ 플레이어별 승률 분석
3. ⬜ 팟 크기별 통계

## 📝 테스트 체크리스트

승자 저장 기능 테스트:
- [ ] 승자 선택 후 칩 자동 계산 확인
- [ ] Google Sheets 전송 시 승자 정보 포함 확인
- [ ] Index 시트 F열에 승자 이름 저장 확인
- [ ] 다음 핸드 시작 시 승자 정보 초기화 확인
- [ ] 복수 승자(스플릿 팟) 처리 확인

## 🔧 빠른 수정 코드

index.html의 2240줄 근처에 다음 코드 추가:
```javascript
// determineWorkStatus 함수 아래에 추가
function getWinnerNames() {
  return window.state.playersInHand
    .filter(p => p.role === 'winner')
    .map(p => p.name)
    .join(', ');
}

// indexMeta 객체에 추가
const indexMeta = {
  // ... 기존 필드들
  winners: getWinnerNames(), // 추가
  // ... 나머지 필드들
};
```

이렇게 하면 승자 정보가 제대로 저장됩니다!