/****************************************************
 * One-Time Position Update Script
 * 기존 핸드 데이터에 포지션 정보(BTN/SB/BB) 추가
 * 
 * 실행 방법:
 * 1. Google Apps Script 에디터에서 이 파일 열기
 * 2. runOneTimePositionUpdate() 함수 실행
 * 3. 권한 승인 후 처리 완료 대기
 * 
 * 주의사항:
 * - 1회만 실행할 것 (중복 실행 시 데이터 덮어쓰기)
 * - 실행 전 Hand 시트 백업 권장
 ****************************************************/

const SHEET_ID = '1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U';

/**
 * 메인 실행 함수
 * Hand 시트의 모든 PLAYER 행에 포지션 정보 추가
 */
function runOneTimePositionUpdate() {
  const startTime = new Date();
  console.log(`[${startTime.toISOString()}] 포지션 업데이트 시작...`);
  
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const handSheet = spreadsheet.getSheetByName('Hand');
    
    if (!handSheet) {
      throw new Error('Hand 시트를 찾을 수 없습니다.');
    }
    
    // 전체 데이터 가져오기
    const data = handSheet.getDataRange().getValues();
    console.log(`총 ${data.length}개 행 발견`);
    
    let updatedCount = 0;
    let handCount = 0;
    let currentHandNumber = null;
    let currentHandPlayers = [];
    let buttonPosition = null;
    
    // 각 행 처리
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowType = row[1]; // B열: 행 타입
      
      // HAND 행이면 새로운 핸드 시작
      if (rowType === 'HAND') {
        // 이전 핸드의 포지션 처리
        if (currentHandPlayers.length > 0) {
          updatePositionsForHand(handSheet, currentHandPlayers, buttonPosition);
          updatedCount += currentHandPlayers.length;
        }
        
        // 새 핸드 초기화
        handCount++;
        currentHandNumber = row[2]; // C열: 핸드 번호
        currentHandPlayers = [];
        buttonPosition = null;
        
        console.log(`핸드 #${currentHandNumber} 처리 중...`);
      }
      
      // PLAYER 행이면 플레이어 정보 수집
      else if (rowType === 'PLAYER') {
        const playerName = row[2]; // C열: 플레이어 이름
        const seat = row[3] || (currentHandPlayers.length + 1); // D열: 좌석 번호
        const existingPosition = row[8]; // I열: 기존 포지션 (있을 경우)
        
        currentHandPlayers.push({
          rowIndex: i + 1, // 1-based index for Sheets
          name: playerName,
          seat: parseInt(seat) || 1,
          existingPosition: existingPosition
        });
      }
    }
    
    // 마지막 핸드 처리
    if (currentHandPlayers.length > 0) {
      updatePositionsForHand(handSheet, currentHandPlayers, buttonPosition);
      updatedCount += currentHandPlayers.length;
    }
    
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    
    console.log('========================================');
    console.log(`✅ 포지션 업데이트 완료!`);
    console.log(`처리된 핸드 수: ${handCount}`);
    console.log(`업데이트된 플레이어 행: ${updatedCount}`);
    console.log(`처리 시간: ${duration.toFixed(2)}초`);
    console.log('========================================');
    
    // 결과를 스프레드시트에도 기록
    const logSheet = spreadsheet.getSheetByName('UpdateLog') || spreadsheet.insertSheet('UpdateLog');
    logSheet.appendRow([
      new Date(),
      'Position Update',
      `${handCount} hands`,
      `${updatedCount} players`,
      `${duration.toFixed(2)}s`,
      'Success'
    ]);
    
    return {
      success: true,
      handsProcessed: handCount,
      playersUpdated: updatedCount,
      duration: duration
    };
    
  } catch (error) {
    console.error('오류 발생:', error);
    throw error;
  }
}

/**
 * 한 핸드의 플레이어들에게 포지션 할당
 */
function updatePositionsForHand(sheet, players, explicitButton) {
  if (players.length === 0) return;
  
  // 이미 포지션이 있는 경우 스킵
  const hasExistingPositions = players.some(p => p.existingPosition && p.existingPosition !== '');
  if (hasExistingPositions) {
    console.log(`  → 이미 포지션 정보가 있어 스킵`);
    return;
  }
  
  // 좌석 순서로 정렬
  players.sort((a, b) => a.seat - b.seat);
  
  // 버튼 위치 결정 (명시적 버튼이 없으면 랜덤)
  let buttonSeat;
  if (explicitButton) {
    buttonSeat = explicitButton;
  } else {
    // 랜덤하게 버튼 위치 선택
    const randomIndex = Math.floor(Math.random() * players.length);
    buttonSeat = players[randomIndex].seat;
  }
  
  // 버튼 다음 플레이어 찾기 (순환 구조)
  const getNextPlayer = (currentSeat) => {
    const currentIndex = players.findIndex(p => p.seat === currentSeat);
    const nextIndex = (currentIndex + 1) % players.length;
    return players[nextIndex];
  };
  
  // SB, BB 결정
  const buttonPlayer = players.find(p => p.seat === buttonSeat);
  const sbPlayer = getNextPlayer(buttonSeat);
  const bbPlayer = sbPlayer ? getNextPlayer(sbPlayer.seat) : null;
  
  // 헤즈업 처리 (2명일 때)
  if (players.length === 2) {
    // 헤즈업에서는 버튼이 SB를 겸함
    const btnPlayer = players.find(p => p.seat === buttonSeat);
    const otherPlayer = players.find(p => p.seat !== buttonSeat);
    
    if (btnPlayer) {
      sheet.getRange(btnPlayer.rowIndex, 9).setValue('BTN,SB'); // I열
      console.log(`  ${btnPlayer.name} (Seat ${btnPlayer.seat}): BTN,SB`);
    }
    if (otherPlayer) {
      sheet.getRange(otherPlayer.rowIndex, 9).setValue('BB'); // I열
      console.log(`  ${otherPlayer.name} (Seat ${otherPlayer.seat}): BB`);
    }
  } else {
    // 3명 이상일 때
    players.forEach(player => {
      let position = '';
      
      if (player.seat === buttonSeat) {
        position = 'BTN';
      } else if (sbPlayer && player.seat === sbPlayer.seat) {
        position = 'SB';
      } else if (bbPlayer && player.seat === bbPlayer.seat) {
        position = 'BB';
      }
      
      if (position) {
        sheet.getRange(player.rowIndex, 9).setValue(position); // I열
        console.log(`  ${player.name} (Seat ${player.seat}): ${position}`);
      }
    });
  }
  
  // 배치 변경사항 즉시 플러시
  SpreadsheetApp.flush();
}

/**
 * 테스트용: 특정 핸드만 업데이트
 */
function testPositionUpdateForHand(handNumber) {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const handSheet = spreadsheet.getSheetByName('Hand');
  
  if (!handSheet) {
    throw new Error('Hand 시트를 찾을 수 없습니다.');
  }
  
  const data = handSheet.getDataRange().getValues();
  let currentHandPlayers = [];
  let isTargetHand = false;
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowType = row[1];
    
    if (rowType === 'HAND' && String(row[2]) === String(handNumber)) {
      isTargetHand = true;
      console.log(`핸드 #${handNumber} 발견`);
    } else if (rowType === 'HAND' && isTargetHand) {
      // 다음 핸드 시작, 처리 중단
      break;
    }
    
    if (isTargetHand && rowType === 'PLAYER') {
      currentHandPlayers.push({
        rowIndex: i + 1,
        name: row[2],
        seat: parseInt(row[3]) || (currentHandPlayers.length + 1),
        existingPosition: row[8]
      });
    }
  }
  
  if (currentHandPlayers.length > 0) {
    console.log(`${currentHandPlayers.length}명의 플레이어 발견`);
    updatePositionsForHand(handSheet, currentHandPlayers, null);
    console.log('✅ 업데이트 완료');
  } else {
    console.log('❌ 해당 핸드를 찾을 수 없습니다.');
  }
}

/**
 * 통계: 현재 포지션 정보 상태 확인
 */
function checkPositionStatus() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const handSheet = spreadsheet.getSheetByName('Hand');
  
  if (!handSheet) {
    throw new Error('Hand 시트를 찾을 수 없습니다.');
  }
  
  const data = handSheet.getDataRange().getValues();
  let totalPlayers = 0;
  let playersWithPosition = 0;
  let playersWithoutPosition = 0;
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row[1] === 'PLAYER') {
      totalPlayers++;
      const position = row[8]; // I열
      if (position && position !== '') {
        playersWithPosition++;
      } else {
        playersWithoutPosition++;
      }
    }
  }
  
  console.log('========================================');
  console.log('포지션 정보 현황');
  console.log('========================================');
  console.log(`총 PLAYER 행: ${totalPlayers}`);
  console.log(`포지션 있음: ${playersWithPosition} (${(playersWithPosition/totalPlayers*100).toFixed(1)}%)`);
  console.log(`포지션 없음: ${playersWithoutPosition} (${(playersWithoutPosition/totalPlayers*100).toFixed(1)}%)`);
  console.log('========================================');
  
  return {
    total: totalPlayers,
    withPosition: playersWithPosition,
    withoutPosition: playersWithoutPosition
  };
}

/**
 * 되돌리기: 모든 포지션 정보 제거 (비상용)
 */
function clearAllPositions() {
  const confirmation = Browser.msgBox(
    '경고',
    '모든 포지션 정보를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    Browser.Buttons.YES_NO
  );
  
  if (confirmation !== Browser.Buttons.YES) {
    console.log('작업이 취소되었습니다.');
    return;
  }
  
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const handSheet = spreadsheet.getSheetByName('Hand');
  
  if (!handSheet) {
    throw new Error('Hand 시트를 찾을 수 없습니다.');
  }
  
  const data = handSheet.getDataRange().getValues();
  let clearedCount = 0;
  
  for (let i = 0; i < data.length; i++) {
    if (data[i][1] === 'PLAYER' && data[i][8]) {
      handSheet.getRange(i + 1, 9).setValue(''); // I열 비우기
      clearedCount++;
    }
  }
  
  console.log(`✅ ${clearedCount}개 포지션 정보 삭제 완료`);
  return clearedCount;
}