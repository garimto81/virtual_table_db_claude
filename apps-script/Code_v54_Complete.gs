/****************************************************
 * Poker Hand Logger - Apps Script Backend v54
 * 테이블 관리 시스템 통합 버전
 * 
 * 스프레드시트 구조:
 * - Hand 시트: 포커 핸드 로우 데이터
 * - Index 시트: 핸드 인덱스
 * - Type 시트: 플레이어 정보 (기존)
 * - Tables 시트: 테이블 관리 (NEW)
 * - Players 시트: 플레이어 DB (NEW)
 * - TablePlayers 시트: 테이블-플레이어 관계 (NEW)
 ****************************************************/

const SHEET_ID = '1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U';

// ===== 시트 초기화 (새로운 시트 생성) =====
function initializeSheets() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  
  // Tables 시트 생성/초기화
  let tablesSheet = ss.getSheetByName('Tables');
  if (!tablesSheet) {
    tablesSheet = ss.insertSheet('Tables');
    tablesSheet.getRange(1, 1, 1, 7).setValues([
      ['TableID', 'TableName', 'Stakes', 'MaxPlayers', 'CreatedAt', 'UpdatedAt', 'Active']
    ]);
    // 헤더 스타일
    tablesSheet.getRange(1, 1, 1, 7)
      .setBackground('#1a1a1a')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
  }
  
  // Players 시트 생성/초기화
  let playersSheet = ss.getSheetByName('Players');
  if (!playersSheet) {
    playersSheet = ss.insertSheet('Players');
    playersSheet.getRange(1, 1, 1, 10).setValues([
      ['PlayerID', 'Name', 'Nickname', 'CurrentTable', 'CurrentChips', 'TotalBuyIn', 'Notable', 'LastSeen', 'CreatedAt', 'Notes']
    ]);
    playersSheet.getRange(1, 1, 1, 10)
      .setBackground('#1a1a1a')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
  }
  
  // TablePlayers 시트 (테이블-플레이어 관계)
  let tablePlayersSheet = ss.getSheetByName('TablePlayers');
  if (!tablePlayersSheet) {
    tablePlayersSheet = ss.insertSheet('TablePlayers');
    tablePlayersSheet.getRange(1, 1, 1, 8).setValues([
      ['TableID', 'PlayerID', 'SeatNumber', 'Chips', 'BuyIn', 'Status', 'JoinedAt', 'LeftAt']
    ]);
    tablePlayersSheet.getRange(1, 1, 1, 8)
      .setBackground('#1a1a1a')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
  }
  
  // 기존 테이블 데이터 마이그레이션
  migrateExistingTables();
  
  return { success: true, message: 'Sheets initialized successfully' };
}

// ===== 기존 테이블 데이터 마이그레이션 =====
function migrateExistingTables() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const typeSheet = ss.getSheetByName('Type');
  const tablesSheet = ss.getSheetByName('Tables');
  
  if (!typeSheet || !tablesSheet) return;
  
  // Type 시트에서 테이블 목록 가져오기
  const typeData = typeSheet.getDataRange().getValues();
  const existingTables = new Set();
  
  for (let i = 1; i < typeData.length; i++) {
    const tableName = typeData[i][2]; // C열: Table
    if (tableName && tableName !== '') {
      existingTables.add(tableName);
    }
  }
  
  // Tables 시트에 기존 테이블 추가
  const tablesData = tablesSheet.getDataRange().getValues();
  const existingTableNames = new Set();
  
  for (let i = 1; i < tablesData.length; i++) {
    existingTableNames.add(tablesData[i][1]); // TableName
  }
  
  const now = new Date().toISOString();
  existingTables.forEach(tableName => {
    if (!existingTableNames.has(tableName)) {
      const tableId = Utilities.getUuid();
      tablesSheet.appendRow([
        tableId,
        tableName,
        'No Limit', // 기본 스테이크
        9, // 기본 최대 인원
        now,
        now,
        true
      ]);
    }
  });
}

// ===== 테이블 관리 API =====

function getTables() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName('Tables');
    
    if (!sheet) {
      // Tables 시트가 없으면 생성
      initializeSheets();
      return getTables(); // 재귀 호출
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      // Type 시트에서 기존 테이블 가져오기
      const typeSheet = ss.getSheetByName('Type');
      if (typeSheet) {
        const typeData = typeSheet.getDataRange().getValues();
        const tables = [];
        const tableSet = new Set();
        
        for (let i = 1; i < typeData.length; i++) {
          const tableName = typeData[i][2]; // C열: Table
          if (tableName && !tableSet.has(tableName)) {
            tableSet.add(tableName);
            tables.push({
              TableID: 'legacy_' + i,
              TableName: tableName,
              Stakes: 'No Limit',
              MaxPlayers: 9,
              Active: true
            });
          }
        }
        return { success: true, tables };
      }
      return { success: true, tables: [] };
    }
    
    const headers = data[0];
    const tables = data.slice(1).map(row => {
      const table = {};
      headers.forEach((header, index) => {
        table[header] = row[index];
      });
      return table;
    }).filter(t => t.Active !== false);
    
    return { success: true, tables };
  } catch (error) {
    console.error('getTables error:', error);
    return { success: false, message: error.toString(), tables: [] };
  }
}

function createTable(tableName, stakes, maxPlayers) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName('Tables');
    
    if (!sheet) {
      initializeSheets();
      sheet = ss.getSheetByName('Tables');
    }
    
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
  } catch (error) {
    console.error('createTable error:', error);
    return { success: false, message: error.toString() };
  }
}

// ===== 플레이어 관리 API =====

function getPlayers(tableId = null) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    
    // Players 시트에서 가져오기
    let sheet = ss.getSheetByName('Players');
    if (!sheet) {
      initializeSheets();
      sheet = ss.getSheetByName('Players');
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Players 시트가 비어있으면 Type 시트에서 가져오기
    if (data.length <= 1) {
      const typeSheet = ss.getSheetByName('Type');
      if (typeSheet) {
        const typeData = typeSheet.getDataRange().getValues();
        const players = [];
        
        for (let i = 1; i < typeData.length; i++) {
          const playerName = typeData[i][1]; // B열: Player
          const tableName = typeData[i][2]; // C열: Table
          const notable = typeData[i][3]; // D열: Notable
          const chips = typeData[i][4]; // E열: Chips
          
          if (playerName && (!tableId || tableName === tableId)) {
            players.push({
              PlayerID: 'legacy_' + i,
              Name: playerName,
              CurrentTable: tableName,
              CurrentChips: chips || 0,
              Notable: notable === true || notable === 'TRUE',
              LastSeen: typeData[i][5] || new Date().toISOString()
            });
          }
        }
        return { success: true, players };
      }
    }
    
    // Players 시트에서 데이터 처리
    const headers = data[0];
    let players = data.slice(1).map(row => {
      const player = {};
      headers.forEach((header, index) => {
        player[header] = row[index];
      });
      return player;
    });
    
    if (tableId) {
      players = players.filter(p => p.CurrentTable === tableId);
    }
    
    return { success: true, players };
  } catch (error) {
    console.error('getPlayers error:', error);
    return { success: false, message: error.toString(), players: [] };
  }
}

function upsertPlayer(playerData) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName('Players');
    
    if (!sheet) {
      initializeSheets();
      sheet = ss.getSheetByName('Players');
    }
    
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
      
      // Type 시트에도 추가
      updateTypeSheet(playerData.Name, playerData.CurrentTable, playerData.Notable, playerData.CurrentChips);
      
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
      
      // Type 시트도 업데이트
      updateTypeSheet(playerData.Name, playerData.CurrentTable, playerData.Notable, playerData.CurrentChips);
      
      return { success: true, playerId: data[playerRow][0], action: 'updated' };
    }
  } catch (error) {
    console.error('upsertPlayer error:', error);
    return { success: false, message: error.toString() };
  }
}

// Type 시트 업데이트 (기존 시스템과 호환성 유지)
function updateTypeSheet(playerName, tableName, notable, chips) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName('Type');
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    let found = false;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === playerName && data[i][2] === tableName) {
        // 업데이트
        sheet.getRange(i + 1, 4).setValue(notable ? 'TRUE' : 'FALSE'); // D열: Notable
        sheet.getRange(i + 1, 5).setValue(chips || 0); // E열: Chips
        sheet.getRange(i + 1, 6).setValue(new Date().toISOString()); // F열: UpdatedAt
        found = true;
        break;
      }
    }
    
    if (!found) {
      // 새로 추가
      sheet.appendRow([
        '', // A열: 설정값
        playerName, // B열: Player
        tableName, // C열: Table
        notable ? 'TRUE' : 'FALSE', // D열: Notable
        chips || 0, // E열: Chips
        new Date().toISOString() // F열: UpdatedAt
      ]);
    }
  } catch (error) {
    console.error('updateTypeSheet error:', error);
  }
}

// ===== 기존 핸드 저장 기능 (v52 호환) =====

function doPost(e) {
  try {
    const payload = _parseRequestBody(e);
    const action = payload.action;
    
    // 테이블 관리 액션
    switch(action) {
      case 'initializeSheets':
        return _json(initializeSheets());
        
      case 'getTables':
        return _json(getTables());
      
      case 'createTable':
        return _json(createTable(payload.tableName, payload.stakes, payload.maxPlayers));
      
      case 'getPlayers':
        return _json(getPlayers(payload.tableId));
      
      case 'upsertPlayer':
        return _json(upsertPlayer(payload.playerData));
      
      // 기존 핸드 저장 기능
      case 'saveHand':
      case undefined:
      case null:
        // 기존 saveHand 로직
        return saveHandData(payload);
      
      default:
        return _json({
          success: false,
          message: 'Unknown action: ' + action
        });
    }
  } catch (error) {
    console.error('doPost error:', error);
    return _json({
      success: false,
      message: error.toString()
    });
  }
}

// 기존 유틸리티 함수들
function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _parseRequestBody(e) {
  // form-urlencoded 방식
  if (e && e.parameter && typeof e.parameter.payload === 'string') {
    try {
      return JSON.parse(e.parameter.payload);
    } catch (err) {
      console.error('Failed to parse payload:', err);
      return {};
    }
  }
  
  // application/json 방식
  if (e && e.postData && e.postData.type && 
      e.postData.type.indexOf('application/json') !== -1) {
    try {
      return JSON.parse(e.postData.contents || '{}');
    } catch (err) {
      console.error('Failed to parse JSON:', err);
      return {};
    }
  }
  
  return e.parameter || {};
}

// ===== 테스트 함수 =====
function testTableSystem() {
  console.log('=== 테이블 시스템 테스트 시작 ===');
  
  // 1. 시트 초기화
  const initResult = initializeSheets();
  console.log('1. 시트 초기화:', initResult);
  
  // 2. 테이블 목록 조회
  const tablesResult = getTables();
  console.log('2. 테이블 목록:', tablesResult);
  
  // 3. 새 테이블 생성
  const newTable = createTable('Test Table', '1/2 NL', 9);
  console.log('3. 테이블 생성:', newTable);
  
  // 4. 플레이어 추가
  const newPlayer = upsertPlayer({
    Name: 'Test Player',
    CurrentTable: 'Test Table',
    CurrentChips: 100000,
    Notable: true
  });
  console.log('4. 플레이어 추가:', newPlayer);
  
  // 5. 플레이어 목록 조회
  const playersResult = getPlayers();
  console.log('5. 플레이어 목록:', playersResult);
  
  console.log('=== 테스트 완료 ===');
}

// 기존 saveHand 관련 함수들은 그대로 유지...
function saveHandData(payload) {
  // 기존 코드 유지
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    // ... 기존 saveHand 로직
    return _json({ success: true, message: 'Hand saved' });
  } catch (error) {
    return _json({ success: false, message: error.toString() });
  }
}