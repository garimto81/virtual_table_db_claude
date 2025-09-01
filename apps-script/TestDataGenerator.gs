/**
 * 1회성 테스트 데이터 생성 스크립트
 * Index 시트에 임의의 lastStreet, lastAction, workStatus 데이터를 추가
 * 실행 후 삭제해도 무방
 */

function generateTestDataForIndex() {
  const ss = SpreadsheetApp.openById('1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U');
  const indexSheet = ss.getSheetByName('Index');
  
  if (!indexSheet) {
    console.log('Index 시트를 찾을 수 없습니다');
    return;
  }
  
  // 현재 데이터 확인
  const lastRow = indexSheet.getLastRow();
  if (lastRow <= 1) {
    console.log('Index 시트에 데이터가 없습니다');
    return;
  }
  
  // 스트리트 옵션
  const streets = ['preflop', 'flop', 'turn', 'river'];
  const statuses = ['진행중', '완료', '검토필요'];
  const players = ['Hero', 'Villain', 'Fish', 'Shark', 'Rock'];
  const actions = ['Bets', 'Raises', 'Calls', 'Checks', 'Folds', 'All In'];
  const amounts = ['5,000', '10,000', '25,000', '50,000', '100,000', 'pot'];
  
  // 랜덤 선택 함수
  function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  
  // 마지막 액션 생성
  function generateLastAction() {
    const player = randomPick(players);
    const action = randomPick(actions);
    const needsAmount = ['Bets', 'Raises', 'Calls', 'All In'].includes(action);
    const amount = needsAmount ? randomPick(amounts) : '';
    return `${player} ${action} ${amount}`.trim();
  }
  
  // workStatus 결정 로직
  function determineStatus(street) {
    if (street === 'river') {
      return Math.random() > 0.3 ? '완료' : '검토필요';
    } else if (street === 'turn') {
      return Math.random() > 0.7 ? '완료' : '진행중';
    } else if (street === 'flop') {
      return '진행중';
    } else {
      return Math.random() > 0.9 ? '완료' : '진행중';
    }
  }
  
  // 2행부터 마지막 행까지 업데이트
  for (let row = 2; row <= lastRow; row++) {
    // 현재 행의 데이터 읽기 (A-N열)
    const currentData = indexSheet.getRange(row, 1, 1, 14).getValues()[0];
    
    // 이미 O,P,Q 열에 데이터가 있는지 확인
    const existingStatus = indexSheet.getRange(row, 15, 1, 3).getValues()[0];
    
    if (!existingStatus[0] || existingStatus[0] === '') {
      // 랜덤 스트리트 선택 (분포 조정)
      let randomStreet;
      const rand = Math.random();
      if (rand < 0.2) {
        randomStreet = 'preflop';
      } else if (rand < 0.5) {
        randomStreet = 'flop';
      } else if (rand < 0.75) {
        randomStreet = 'turn';
      } else {
        randomStreet = 'river';
      }
      
      const lastAction = generateLastAction();
      const workStatus = determineStatus(randomStreet);
      
      // O, P, Q 열 업데이트
      indexSheet.getRange(row, 15).setValue(randomStreet);    // O열: lastStreet
      indexSheet.getRange(row, 16).setValue(lastAction);      // P열: lastAction
      indexSheet.getRange(row, 17).setValue(workStatus);      // Q열: workStatus
      
      console.log(`행 ${row} 업데이트: ${randomStreet} | ${lastAction} | ${workStatus}`);
    } else {
      console.log(`행 ${row}은 이미 데이터가 있습니다`);
    }
  }
  
  console.log('테스트 데이터 생성 완료!');
  
  // 통계 출력
  const allData = indexSheet.getRange(2, 15, lastRow - 1, 3).getValues();
  const stats = {
    preflop: 0,
    flop: 0,
    turn: 0,
    river: 0,
    진행중: 0,
    완료: 0,
    검토필요: 0
  };
  
  allData.forEach(row => {
    if (row[0]) stats[row[0]]++;
    if (row[2]) stats[row[2]]++;
  });
  
  console.log('통계:', JSON.stringify(stats, null, 2));
}

/**
 * 특정 핸드 번호들에 대해서만 테스트 데이터 생성
 */
function updateSpecificHands() {
  const ss = SpreadsheetApp.openById('1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U');
  const indexSheet = ss.getSheetByName('Index');
  
  // 업데이트할 핸드 번호 목록 (예시)
  const targetHands = ['4990', '4989', '4988', '4987', '4986'];
  const lastRow = indexSheet.getLastRow();
  
  for (let row = 2; row <= lastRow; row++) {
    const handNumber = String(indexSheet.getRange(row, 1).getValue());
    
    if (targetHands.includes(handNumber)) {
      // 각 핸드별로 다른 상태 설정
      let street, action, status;
      
      switch(handNumber) {
        case '4990':
          street = 'river';
          action = 'Hero All In pot';
          status = '완료';
          break;
        case '4989':
          street = 'turn';
          action = 'Villain Raises 50,000';
          status = '검토필요';
          break;
        case '4988':
          street = 'flop';
          action = 'Fish Calls 10,000';
          status = '진행중';
          break;
        case '4987':
          street = 'preflop';
          action = 'Rock Folds';
          status = '진행중';
          break;
        case '4986':
          street = 'river';
          action = 'Shark Bets 25,000';
          status = '완료';
          break;
        default:
          continue;
      }
      
      indexSheet.getRange(row, 15).setValue(street);    // O열
      indexSheet.getRange(row, 16).setValue(action);     // P열
      indexSheet.getRange(row, 17).setValue(status);     // Q열
      
      console.log(`핸드 #${handNumber} 업데이트 완료`);
    }
  }
  
  console.log('특정 핸드 업데이트 완료!');
}

/**
 * 테스트 데이터 삭제 (원복)
 */
function clearTestData() {
  const ss = SpreadsheetApp.openById('1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U');
  const indexSheet = ss.getSheetByName('Index');
  
  const lastRow = indexSheet.getLastRow();
  if (lastRow > 1) {
    // O, P, Q 열만 삭제
    indexSheet.getRange(2, 15, lastRow - 1, 3).clearContent();
    console.log('테스트 데이터 삭제 완료');
  }
}