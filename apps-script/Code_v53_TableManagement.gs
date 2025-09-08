/****************************************************
 * Poker Hand Logger - Apps Script Backend v53
 * 테이블 및 플레이어 관리 기능 추가
 * 
 * 스프레드시트 구조:
 * - Hand 시트: 포커 핸드 로우 데이터
 * - Index 시트: 핸드 인덱스
 * - Type 시트: 플레이어 정보 (A:설정, B:Player, C:Table, D:Notable, E:Chips, F:UpdatedAt)
 * - Tables 시트: 테이블 정보 (NEW)
 * - Players 시트: 전체 플레이어 데이터베이스 (NEW)
 ****************************************************/

const SHEET_ID = '1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U';

// ===== 시트 초기화 =====
function initializeSheets() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  
  // Tables 시트 생성/초기화
  let tablesSheet = ss.getSheetByName('Tables');
  if (!tablesSheet) {
    tablesSheet = ss.insertSheet('Tables');
    tablesSheet.getRange(1, 1, 1, 7).setValues([
      ['TableID', 'TableName', 'Stakes', 'MaxPlayers', 'CreatedAt', 'UpdatedAt', 'Active']
    ]);
  }
  
  // Players 시트 생성/초기화
  let playersSheet = ss.getSheetByName('Players');
  if (!playersSheet) {
    playersSheet = ss.insertSheet('Players');
    playersSheet.getRange(1, 1, 1, 10).setValues([
      ['PlayerID', 'Name', 'Nickname', 'CurrentTable', 'CurrentChips', 'TotalBuyIn', 'Notable', 'LastSeen', 'CreatedAt', 'Notes']
    ]);
  }
  
  // TablePlayers 시트 (테이블-플레이어 관계)
  let tablePlayersSheet = ss.getSheetByName('TablePlayers');
  if (!tablePlayersSheet) {
    tablePlayersSheet = ss.insertSheet('TablePlayers');
    tablePlayersSheet.getRange(1, 1, 1, 8).setValues([
      ['TableID', 'PlayerID', 'SeatNumber', 'Chips', 'BuyIn', 'Status', 'JoinedAt', 'LeftAt']
    ]);
  }
}

// ===== 테이블 관리 API =====

// 테이블 목록 조회
function getTables() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('Tables');
  if (!sheet) return { success: false, message: 'Tables sheet not found' };
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, tables: [] };
  
  const headers = data[0];
  const tables = data.slice(1).map(row => {
    const table = {};
    headers.forEach((header, index) => {
      table[header] = row[index];
    });
    return table;
  }).filter(t => t.Active !== false); // 활성 테이블만
  
  return { success: true, tables };
}

// 테이블 생성
function createTable(tableName, stakes, maxPlayers) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('Tables');
  if (!sheet) return { success: false, message: 'Tables sheet not found' };
  
  const tableId = Utilities.getUuid();
  const now = new Date().toISOString();
  
  sheet.appendRow([
    tableId,
    tableName,
    stakes || 'No Limit',
    maxPlayers || 9,
    now,
    now,
    true
  ]);
  
  return { 
    success: true, 
    table: {
      TableID: tableId,
      TableName: tableName,
      Stakes: stakes,
      MaxPlayers: maxPlayers
    }
  };
}

// 테이블 업데이트
function updateTable(tableId, updates) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('Tables');
  if (!sheet) return { success: false, message: 'Tables sheet not found' };
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const tableIdIndex = headers.indexOf('TableID');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][tableIdIndex] === tableId) {
      // 업데이트 적용
      Object.keys(updates).forEach(key => {
        const colIndex = headers.indexOf(key);
        if (colIndex !== -1) {
          sheet.getRange(i + 1, colIndex + 1).setValue(updates[key]);
        }
      });
      
      // UpdatedAt 갱신
      const updatedAtIndex = headers.indexOf('UpdatedAt');
      sheet.getRange(i + 1, updatedAtIndex + 1).setValue(new Date().toISOString());
      
      return { success: true };
    }
  }
  
  return { success: false, message: 'Table not found' };
}

// ===== 플레이어 관리 API =====

// 플레이어 목록 조회
function getPlayers(tableId = null) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('Players');
  if (!sheet) return { success: false, message: 'Players sheet not found' };
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, players: [] };
  
  const headers = data[0];
  let players = data.slice(1).map(row => {
    const player = {};
    headers.forEach((header, index) => {
      player[header] = row[index];
    });
    return player;
  });
  
  // 특정 테이블의 플레이어만 필터링
  if (tableId) {
    players = players.filter(p => p.CurrentTable === tableId);
  }
  
  return { success: true, players };
}

// 플레이어 생성/업데이트
function upsertPlayer(playerData) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('Players');
  if (!sheet) return { success: false, message: 'Players sheet not found' };
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const nameIndex = headers.indexOf('Name');
  const now = new Date().toISOString();
  
  // 기존 플레이어 찾기
  let playerRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][nameIndex] === playerData.Name) {
      playerRow = i;
      break;
    }
  }
  
  if (playerRow === -1) {
    // 새 플레이어 추가
    const playerId = Utilities.getUuid();
    const newRow = headers.map(header => {
      switch(header) {
        case 'PlayerID': return playerId;
        case 'CreatedAt': return now;
        case 'LastSeen': return now;
        default: return playerData[header] || '';
      }
    });
    sheet.appendRow(newRow);
    return { success: true, playerId, action: 'created' };
  } else {
    // 기존 플레이어 업데이트
    Object.keys(playerData).forEach(key => {
      const colIndex = headers.indexOf(key);
      if (colIndex !== -1 && key !== 'PlayerID') {
        sheet.getRange(playerRow + 1, colIndex + 1).setValue(playerData[key]);
      }
    });
    
    // LastSeen 갱신
    const lastSeenIndex = headers.indexOf('LastSeen');
    sheet.getRange(playerRow + 1, lastSeenIndex + 1).setValue(now);
    
    return { success: true, playerId: data[playerRow][0], action: 'updated' };
  }
}

// ===== 테이블-플레이어 관계 관리 =====

// 테이블에 플레이어 추가
function addPlayerToTable(tableId, playerId, seatNumber, chips, buyIn) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('TablePlayers');
  if (!sheet) return { success: false, message: 'TablePlayers sheet not found' };
  
  const now = new Date().toISOString();
  
  // 중복 체크
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === tableId && data[i][1] === playerId && !data[i][7]) {
      // 이미 테이블에 있고 떠나지 않은 경우
      return { success: false, message: 'Player already at table' };
    }
  }
  
  sheet.appendRow([
    tableId,
    playerId,
    seatNumber || 0,
    chips || 0,
    buyIn || chips || 0,
    'active',
    now,
    '' // LeftAt은 비움
  ]);
  
  // Players 시트에서 CurrentTable 업데이트
  updatePlayerCurrentTable(playerId, tableId, chips);
  
  return { success: true };
}

// 플레이어 현재 테이블 업데이트
function updatePlayerCurrentTable(playerId, tableId, chips) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('Players');
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const playerIdIndex = headers.indexOf('PlayerID');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][playerIdIndex] === playerId) {
      const tableIndex = headers.indexOf('CurrentTable');
      const chipsIndex = headers.indexOf('CurrentChips');
      
      sheet.getRange(i + 1, tableIndex + 1).setValue(tableId);
      if (chips !== undefined) {
        sheet.getRange(i + 1, chipsIndex + 1).setValue(chips);
      }
      break;
    }
  }
}

// 테이블에서 플레이어 제거
function removePlayerFromTable(tableId, playerId) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('TablePlayers');
  if (!sheet) return { success: false, message: 'TablePlayers sheet not found' };
  
  const data = sheet.getDataRange().getValues();
  const now = new Date().toISOString();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === tableId && data[i][1] === playerId && !data[i][7]) {
      // LeftAt 설정
      sheet.getRange(i + 1, 8).setValue(now);
      // Status를 'left'로 변경
      sheet.getRange(i + 1, 6).setValue('left');
      
      // Players 시트에서 CurrentTable 제거
      updatePlayerCurrentTable(playerId, '', 0);
      
      return { success: true };
    }
  }
  
  return { success: false, message: 'Player not found at table' };
}

// ===== 통합 API 엔드포인트 =====

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    
    switch(action) {
      // 테이블 관련
      case 'getTables':
        return ContentService.createTextOutput(JSON.stringify(getTables()))
          .setMimeType(ContentService.MimeType.JSON);
      
      case 'createTable':
        return ContentService.createTextOutput(JSON.stringify(
          createTable(payload.tableName, payload.stakes, payload.maxPlayers)
        )).setMimeType(ContentService.MimeType.JSON);
      
      case 'updateTable':
        return ContentService.createTextOutput(JSON.stringify(
          updateTable(payload.tableId, payload.updates)
        )).setMimeType(ContentService.MimeType.JSON);
      
      // 플레이어 관련
      case 'getPlayers':
        return ContentService.createTextOutput(JSON.stringify(
          getPlayers(payload.tableId)
        )).setMimeType(ContentService.MimeType.JSON);
      
      case 'upsertPlayer':
        return ContentService.createTextOutput(JSON.stringify(
          upsertPlayer(payload.playerData)
        )).setMimeType(ContentService.MimeType.JSON);
      
      case 'addPlayerToTable':
        return ContentService.createTextOutput(JSON.stringify(
          addPlayerToTable(payload.tableId, payload.playerId, payload.seatNumber, payload.chips, payload.buyIn)
        )).setMimeType(ContentService.MimeType.JSON);
      
      case 'removePlayerFromTable':
        return ContentService.createTextOutput(JSON.stringify(
          removePlayerFromTable(payload.tableId, payload.playerId)
        )).setMimeType(ContentService.MimeType.JSON);
      
      // 기존 핸드 저장 기능 유지
      case 'saveHand':
        return saveHandData(payload);
      
      default:
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          message: 'Unknown action: ' + action
        })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 테스트 함수
function testTableManagement() {
  // 1. 시트 초기화
  initializeSheets();
  
  // 2. 테이블 생성
  const table = createTable('Friday Night Game', '1/2 NL', 9);
  console.log('Created table:', table);
  
  // 3. 플레이어 생성
  const player1 = upsertPlayer({
    Name: 'John Doe',
    Nickname: 'JD',
    CurrentChips: 100000,
    Notable: true
  });
  console.log('Created player:', player1);
  
  // 4. 테이블에 플레이어 추가
  if (table.success && player1.success) {
    const result = addPlayerToTable(
      table.table.TableID,
      player1.playerId,
      1, // seat number
      100000, // chips
      100000 // buy-in
    );
    console.log('Added player to table:', result);
  }
  
  // 5. 조회 테스트
  console.log('Tables:', getTables());
  console.log('Players:', getPlayers());
}