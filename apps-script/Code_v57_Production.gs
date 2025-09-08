/****************************************************
 * Poker Hand Logger - Apps Script Backend v57 (Production)
 * 웹 배포용 - 초기화 함수 제외
 * 
 * 기존 기능 (v56):
 * - 핸드 데이터 저장
 * - 체크박스 업데이트 (updateHandEdit)
 * - Index 시트 관리
 * 
 * 추가 기능 (v57):
 * - 테이블 관리 API
 * - 플레이어 관리 API
 * - Type 시트 동기화
 ****************************************************/

const SHEET_ID = '1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U';

// ===== 유틸리티 함수 =====

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _open() {
  return SpreadsheetApp.openById(SHEET_ID);
}

function _parseRequestBody(e) {
  // FormData 방식 (payload 파라미터)
  if (e && e.parameter && e.parameter.payload) {
    try {
      return JSON.parse(e.parameter.payload);
    } catch (err) {
      console.error('FormData 파싱 실패:', err.message);
    }
  }
  
  // JSON Body 방식
  if (e && e.postData && e.postData.type === 'application/json') {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      console.error('JSON 파싱 실패:', err.message);
    }
  }
  
  // URL 파라미터 방식
  if (e && e.parameter) {
    return e.parameter;
  }
  
  return {};
}

// ===== 핸드 편집 상태 업데이트 (v56 기능) =====
function updateHandEditStatus(handNumber, checked) {
  try {
    const spreadsheet = _open();
    const indexSheet = spreadsheet.getSheetByName('Index');
    
    if (!indexSheet) {
      throw new Error('Index 시트를 찾을 수 없습니다');
    }
    
    const data = indexSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(handNumber)) {
        indexSheet.getRange(i + 1, 5).setValue(checked ? 'TRUE' : 'FALSE');
        indexSheet.getRange(i + 1, 6).setValue(new Date());
        
        return {
          success: true,
          handNumber: handNumber,
          checked: checked,
          updatedAt: new Date().toISOString()
        };
      }
    }
    
    throw new Error(`핸드 #${handNumber}를 찾을 수 없습니다`);
    
  } catch (error) {
    console.error('updateHandEditStatus 오류:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

// ===== 테이블 관리 API (v57 기능) =====

function getTables() {
  try {
    const ss = _open();
    const sheet = ss.getSheetByName('Tables');
    
    if (!sheet) {
      return { success: false, message: 'Tables 시트가 없습니다. 초기화를 먼저 실행하세요.', tables: [] };
    }
    
    const data = sheet.getDataRange().getValues();
    
    // 테이블이 없으면 Type 시트에서 가져오기
    if (data.length <= 1) {
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
    const ss = _open();
    const sheet = ss.getSheetByName('Tables');
    
    if (!sheet) {
      return { success: false, message: 'Tables 시트가 없습니다. 초기화를 먼저 실행하세요.' };
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

// ===== 플레이어 관리 API (v57 기능) =====

function getPlayers(tableId = null) {
  try {
    const ss = _open();
    let sheet = ss.getSheetByName('Players');
    
    if (!sheet) {
      return { success: false, message: 'Players 시트가 없습니다. 초기화를 먼저 실행하세요.', players: [] };
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
    const ss = _open();
    let sheet = ss.getSheetByName('Players');
    
    if (!sheet) {
      return { success: false, message: 'Players 시트가 없습니다. 초기화를 먼저 실행하세요.' };
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
    const ss = _open();
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

// ===== 기존 v56 함수들 (그대로 유지) =====

function _padRows(rows) {
  let maxCols = 0;
  for (const row of rows) {
    maxCols = Math.max(maxCols, (row || []).length);
  }
  
  return rows.map(row => {
    const arr = (row || []).slice();
    while (arr.length < maxCols) {
      arr.push('');
    }
    return arr;
  });
}

function _normalizeEventRows(rows) {
  if (!Array.isArray(rows)) return rows;
  
  const output = [];
  const SIMPLE_EVENTS = {
    'FOLDS': 'FOLD',
    'CHECKS': 'CHECK',
    'CALLS': 'CALL',
    'BETS': 'BET'
  };
  
  for (const row of rows) {
    const r = (row || []).slice();
    
    if (r[1] === 'EVENT') {
      let eventType = String(r[2] || '').trim().toUpperCase();
      
      // RAISE 처리
      if (/^(RAISE|RAISES|RAISE TO|RAIES)$/.test(eventType)) {
        eventType = 'RAISE TO';
      }
      // 기타 이벤트 정규화
      else if (SIMPLE_EVENTS[eventType]) {
        eventType = SIMPLE_EVENTS[eventType];
      }
      
      r[2] = eventType;
    }
    
    output.push(r);
  }
  
  return output;
}

function _ensureIndexHeader(sheet) {
  const fullHeaderRow = [
    'handNumber', 'startRow', 'endRow', 'handUpdatedAt', 
    'handEdit', 'handEditTime', 'label', 'table', 
    'tableUpdatedAt', 'Cam', 'CamFile01name', 'CamFile01number',
    'CamFile02name', 'CamFile02number',
    'lastStreet', 'lastAction', 'workStatus'
  ];
  
  if (sheet.getLastRow() < 1) {
    sheet.getRange(1, 1, 1, fullHeaderRow.length).setValues([fullHeaderRow]);
  } else {
    const lastCol = sheet.getLastColumn();
    if (lastCol < 17) {
      sheet.getRange(1, 1, 1, fullHeaderRow.length).setValues([fullHeaderRow]);
    }
  }
}

// ===== 메인 핸들러 =====

function doGet(e) {
  return _json({
    status: 'ok',
    method: 'GET',
    time: new Date().toISOString(),
    version: 'v57-production'
  });
}

function doPost(e) {
  try {
    const body = _parseRequestBody(e) || {};
    
    // 액션 기반 라우팅 (v57 방식)
    if (body.action) {
      switch(body.action) {
        // v56 기능
        case 'updateHandEdit':
          return _json(updateHandEditStatus(body.handNumber, body.checked));
        
        // v57 테이블 관리
        case 'getTables':
          return _json(getTables());
        
        case 'createTable':
          return _json(createTable(body.tableName, body.stakes, body.maxPlayers));
        
        case 'getPlayers':
          return _json(getPlayers(body.tableId));
        
        case 'upsertPlayer':
          return _json(upsertPlayer(body.playerData));
        
        default:
          return _json({
            success: false,
            message: 'Unknown action: ' + body.action
          });
      }
    }
    
    // 액션이 없으면 기존 v56 핸드 저장 로직
    const rowsInput = body.rows;
    const indexMeta = body.indexMeta || {};
    const typeUpdates = Array.isArray(body.typeUpdates) ? body.typeUpdates : [];
    
    if (!Array.isArray(rowsInput) || !rowsInput.length) {
      return _json({
        status: 'error',
        message: 'rows 데이터가 누락되었습니다.'
      });
    }
    
    // 이벤트 정규화 및 패딩
    const rows = _padRows(_normalizeEventRows(rowsInput));
    
    // HAND 정보 추출
    let handNumber = '';
    for (const row of rows) {
      if (row[1] === 'HAND') {
        handNumber = String(row[2] || '');
        break;
      }
    }
    
    // 스프레드시트 열기
    const spreadsheet = _open();
    const handSheet = spreadsheet.getSheetByName('Hand') || spreadsheet.insertSheet('Hand');
    const indexSheet = spreadsheet.getSheetByName('Index') || spreadsheet.insertSheet('Index');
    const typeSheet = spreadsheet.getSheetByName('Type') || spreadsheet.insertSheet('Type');
    
    // Hand 시트에 데이터 기록
    const startRow = handSheet.getLastRow() + 1;
    handSheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
    const endRow = startRow + rows.length - 1;
    
    // Index 시트 업데이트
    _ensureIndexHeader(indexSheet);
    
    // 중복 체크
    const existingData = indexSheet.getDataRange().getValues();
    for (let i = 1; i < existingData.length; i++) {
      if (String(existingData[i][0]) === String(handNumber)) {
        return _json({
          status: 'duplicate',
          message: `핸드 #${handNumber}는 이미 기록되어 있습니다`,
          handNumber: handNumber,
          existingRow: i + 1
        });
      }
    }
    
    // 인덱스 데이터 추가
    const rawDate = indexMeta.handUpdatedAt || new Date().toISOString();
    const updatedAt = String(rawDate).split('T')[0];
    const editTime = new Date();
    
    const indexData = [
      handNumber || String(indexMeta.handNumber || ''),
      startRow,
      endRow,
      updatedAt,
      '',
      editTime,
      indexMeta.label || '',
      indexMeta.table || '',
      indexMeta.tableUpdatedAt || updatedAt,
      indexMeta.cam || '',
      indexMeta.camFile01name || '',
      indexMeta.camFile01number || '',
      indexMeta.camFile02name || '',
      indexMeta.camFile02number || '',
      indexMeta.lastStreet || 'preflop',
      indexMeta.lastAction || '',
      indexMeta.workStatus || '진행중'
    ];
    
    indexSheet.appendRow(indexData);
    
    // Type 시트 업데이트 (칩 정보)
    if (typeUpdates.length > 0) {
      const typeData = typeSheet.getDataRange().getValues();
      
      typeUpdates.forEach(update => {
        const rowIndex = typeData.findIndex((row, idx) => {
          return idx > 0 && row[1] === update.player && row[2] === update.table;
        });
        
        if (rowIndex > 0) {
          typeSheet.getRange(rowIndex + 1, 5).setValue(update.chips || '');
          const updateTime = update.updatedAt ? new Date(update.updatedAt) : new Date();
          typeSheet.getRange(rowIndex + 1, 6).setValue(updateTime);
        }
      });
    }
    
    return _json({
      status: 'success',
      handNumber: handNumber || indexMeta.handNumber || '',
      rowsAdded: rows.length,
      startRow: startRow,
      endRow: endRow,
      updatedAt: updatedAt,
      version: 'v57-production'
    });
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return _json({
      status: 'error',
      message: String(error && error.message || error),
      stack: String(error && error.stack || '')
    });
  }
}