/****************************************************
 * Poker Hand Logger - Apps Script Backend v59
 * Type 시트 기반 - IN/OUT 두 가지 상태만 사용
 * 
 * Type 시트 구조:
 * A: Camera Preset
 * B: Player
 * C: Table  
 * D: Notable
 * E: Chips
 * F: UpdatedAt
 * G: Seat
 * H: Status (IN/OUT만 사용)
 ****************************************************/

const SHEET_ID = '1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U';

// Type 시트 열 인덱스 (0-based for array)
const TYPE_COLUMNS = {
  CAMERA: 0,      // A열
  PLAYER: 1,      // B열
  TABLE: 2,       // C열
  NOTABLE: 3,     // D열
  CHIPS: 4,       // E열
  UPDATED_AT: 5,  // F열
  SEAT: 6,        // G열
  STATUS: 7       // H열 - IN/OUT만 사용
};

// Range용 (1-based)
const RANGE_COLUMNS = {
  CAMERA: 1,
  PLAYER: 2,
  TABLE: 3,
  NOTABLE: 4,
  CHIPS: 5,
  UPDATED_AT: 6,
  SEAT: 7,
  STATUS: 8
};

// ===== 유틸리티 함수 =====

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _open() {
  return SpreadsheetApp.openById(SHEET_ID);
}

function _parseRequestBody(e) {
  // FormData 방식
  if (e && e.parameter && e.parameter.payload) {
    try {
      return JSON.parse(e.parameter.payload);
    } catch (err) {
      console.error('FormData 파싱 실패:', err);
    }
  }
  
  // JSON Body 방식
  if (e && e.postData && e.postData.type === 'application/json') {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      console.error('JSON 파싱 실패:', err);
    }
  }
  
  return e?.parameter || {};
}

// ===== 테이블 관리 API =====

// 테이블 목록 조회
function getTableList() {
  try {
    const sheet = _open().getSheetByName('Type');
    if (!sheet) return {success: false, tables: []};
    
    const data = sheet.getDataRange().getValues();
    const tables = new Map();
    
    for (let i = 1; i < data.length; i++) {
      const tableName = data[i][TYPE_COLUMNS.TABLE];
      const status = data[i][TYPE_COLUMNS.STATUS] || 'IN';
      
      // IN 상태인 플레이어만 카운트
      if (tableName && status === 'IN') {
        const count = tables.get(tableName) || 0;
        tables.set(tableName, count + 1);
      }
    }
    
    return {
      success: true,
      tables: Array.from(tables.entries()).map(([name, count]) => ({
        name: name,
        playerCount: count
      }))
    };
  } catch (error) {
    console.error('getTableList error:', error);
    return {success: false, message: error.toString(), tables: []};
  }
}

// 테이블별 플레이어 조회 (IN 상태만)
function getPlayersByTable(tableName) {
  try {
    const sheet = _open().getSheetByName('Type');
    if (!sheet) return {success: false, players: []};
    
    const data = sheet.getDataRange().getValues();
    const players = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const table = row[TYPE_COLUMNS.TABLE];
      const status = row[TYPE_COLUMNS.STATUS] || 'IN';
      
      // 해당 테이블의 IN 상태 플레이어만
      if (table === tableName && status === 'IN') {
        players.push({
          rowNumber: i + 1,
          name: row[TYPE_COLUMNS.PLAYER],
          table: table,
          notable: row[TYPE_COLUMNS.NOTABLE] === true || row[TYPE_COLUMNS.NOTABLE] === 'TRUE',
          chips: row[TYPE_COLUMNS.CHIPS] || 0,
          seat: row[TYPE_COLUMNS.SEAT] || null,
          status: status,
          updatedAt: row[TYPE_COLUMNS.UPDATED_AT]
        });
      }
    }
    
    // 좌석 번호순 정렬
    players.sort((a, b) => (a.seat || 99) - (b.seat || 99));
    
    return {success: true, players};
  } catch (error) {
    console.error('getPlayersByTable error:', error);
    return {success: false, message: error.toString(), players: []};
  }
}

// 플레이어 추가/수정
function upsertPlayer(playerData) {
  try {
    const sheet = _open().getSheetByName('Type');
    if (!sheet) return {success: false, message: 'Type 시트를 찾을 수 없습니다'};
    
    const data = sheet.getDataRange().getValues();
    
    // 좌석 중복 체크 (같은 테이블, 같은 좌석, IN 상태)
    if (playerData.seat) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][TYPE_COLUMNS.TABLE] === playerData.table &&
            data[i][TYPE_COLUMNS.SEAT] === playerData.seat &&
            data[i][TYPE_COLUMNS.STATUS] === 'IN' &&
            data[i][TYPE_COLUMNS.PLAYER] !== playerData.name) {
          return {success: false, message: `좌석 ${playerData.seat}번은 이미 사용 중입니다`};
        }
      }
    }
    
    // 기존 플레이어 찾기 (같은 이름, 같은 테이블, IN 상태)
    let targetRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][TYPE_COLUMNS.PLAYER] === playerData.name && 
          data[i][TYPE_COLUMNS.TABLE] === playerData.table &&
          data[i][TYPE_COLUMNS.STATUS] === 'IN') {
        targetRow = i + 1;
        break;
      }
    }
    
    const now = new Date();
    
    if (targetRow === -1) {
      // OUT 상태의 기존 데이터가 있는지 확인
      let outRow = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][TYPE_COLUMNS.TABLE] === playerData.table &&
            data[i][TYPE_COLUMNS.STATUS] === 'OUT') {
          outRow = i + 1;
          break;
        }
      }
      
      if (outRow !== -1) {
        // OUT 상태 행을 재사용
        sheet.getRange(outRow, RANGE_COLUMNS.PLAYER).setValue(playerData.name);
        sheet.getRange(outRow, RANGE_COLUMNS.NOTABLE).setValue(playerData.notable ? 'TRUE' : 'FALSE');
        sheet.getRange(outRow, RANGE_COLUMNS.CHIPS).setValue(playerData.chips || 0);
        sheet.getRange(outRow, RANGE_COLUMNS.SEAT).setValue(playerData.seat || '');
        sheet.getRange(outRow, RANGE_COLUMNS.STATUS).setValue('IN');
        sheet.getRange(outRow, RANGE_COLUMNS.UPDATED_AT).setValue(now);
        
        return {success: true, action: 'reused', row: outRow};
      } else {
        // 새 행 추가
        const newRow = new Array(8);
        newRow[TYPE_COLUMNS.CAMERA] = '';
        newRow[TYPE_COLUMNS.PLAYER] = playerData.name;
        newRow[TYPE_COLUMNS.TABLE] = playerData.table;
        newRow[TYPE_COLUMNS.NOTABLE] = playerData.notable ? 'TRUE' : 'FALSE';
        newRow[TYPE_COLUMNS.CHIPS] = playerData.chips || 0;
        newRow[TYPE_COLUMNS.UPDATED_AT] = now;
        newRow[TYPE_COLUMNS.SEAT] = playerData.seat || '';
        newRow[TYPE_COLUMNS.STATUS] = 'IN';
        
        sheet.appendRow(newRow);
        return {success: true, action: 'created', row: sheet.getLastRow()};
      }
      
    } else {
      // 기존 플레이어 수정
      if (playerData.chips !== undefined) {
        sheet.getRange(targetRow, RANGE_COLUMNS.CHIPS).setValue(playerData.chips);
      }
      if (playerData.seat !== undefined) {
        sheet.getRange(targetRow, RANGE_COLUMNS.SEAT).setValue(playerData.seat);
      }
      if (playerData.notable !== undefined) {
        sheet.getRange(targetRow, RANGE_COLUMNS.NOTABLE)
          .setValue(playerData.notable ? 'TRUE' : 'FALSE');
      }
      
      // UpdatedAt 갱신
      sheet.getRange(targetRow, RANGE_COLUMNS.UPDATED_AT).setValue(now);
      
      return {success: true, action: 'updated', row: targetRow};
    }
  } catch (error) {
    console.error('upsertPlayer error:', error);
    return {success: false, message: error.toString()};
  }
}

// 플레이어 OUT 처리 (캐시아웃)
function cashOutPlayer(playerName, tableName, finalChips) {
  try {
    const sheet = _open().getSheetByName('Type');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][TYPE_COLUMNS.PLAYER] === playerName && 
          data[i][TYPE_COLUMNS.TABLE] === tableName &&
          data[i][TYPE_COLUMNS.STATUS] === 'IN') {
        const row = i + 1;
        
        // 최종 칩 업데이트
        if (finalChips !== undefined) {
          sheet.getRange(row, RANGE_COLUMNS.CHIPS).setValue(finalChips);
        }
        
        // Status를 OUT으로 변경
        sheet.getRange(row, RANGE_COLUMNS.STATUS).setValue('OUT');
        sheet.getRange(row, RANGE_COLUMNS.UPDATED_AT).setValue(new Date());
        
        // 좌석 비우기 (선택사항)
        // sheet.getRange(row, RANGE_COLUMNS.SEAT).setValue('');
        
        return {success: true, message: `${playerName} 캐시아웃 완료`};
      }
    }
    
    return {success: false, message: '플레이어를 찾을 수 없습니다'};
  } catch (error) {
    console.error('cashOutPlayer error:', error);
    return {success: false, message: error.toString()};
  }
}

// 플레이어 추가 (새로운 함수)
function addPlayer(playerData) {
  try {
    const sheet = _open().getSheetByName('Type');
    if (!sheet) return {success: false, message: 'Type 시트를 찾을 수 없습니다'};

    const data = sheet.getDataRange().getValues();

    // 좌석 중복 체크
    if (playerData.seat) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][TYPE_COLUMNS.TABLE] === playerData.table &&
            data[i][TYPE_COLUMNS.SEAT] === playerData.seat &&
            data[i][TYPE_COLUMNS.STATUS] === 'IN') {
          return {success: false, message: `좌석 ${playerData.seat}번은 이미 사용 중입니다`};
        }
      }
    }

    // 같은 이름의 플레이어가 이미 있는지 체크
    for (let i = 1; i < data.length; i++) {
      if (data[i][TYPE_COLUMNS.PLAYER] === playerData.name &&
          data[i][TYPE_COLUMNS.TABLE] === playerData.table &&
          data[i][TYPE_COLUMNS.STATUS] === 'IN') {
        return {success: false, message: '이미 존재하는 플레이어입니다'};
      }
    }

    // 새 행 추가
    const newRow = sheet.getLastRow() + 1;
    sheet.getRange(newRow, RANGE_COLUMNS.CAMERA).setValue('');
    sheet.getRange(newRow, RANGE_COLUMNS.PLAYER).setValue(playerData.name);
    sheet.getRange(newRow, RANGE_COLUMNS.TABLE).setValue(playerData.table);
    sheet.getRange(newRow, RANGE_COLUMNS.NOTABLE).setValue('FALSE');
    sheet.getRange(newRow, RANGE_COLUMNS.CHIPS).setValue(playerData.chips || 0);
    sheet.getRange(newRow, RANGE_COLUMNS.UPDATED_AT).setValue(new Date());
    sheet.getRange(newRow, RANGE_COLUMNS.SEAT).setValue(playerData.seat || '');
    sheet.getRange(newRow, RANGE_COLUMNS.STATUS).setValue(playerData.status || 'IN');

    return {success: true, message: '플레이어가 추가되었습니다'};
  } catch (error) {
    console.error('addPlayer error:', error);
    return {success: false, message: error.toString()};
  }
}

// 플레이어 좌석 업데이트
function updatePlayerSeat(playerName, tableName, newSeat) {
  try {
    const sheet = _open().getSheetByName('Type');
    const data = sheet.getDataRange().getValues();

    // 좌석 중복 체크 (새 좌석이 있을 경우)
    if (newSeat) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][TYPE_COLUMNS.TABLE] === tableName &&
            data[i][TYPE_COLUMNS.SEAT] === newSeat &&
            data[i][TYPE_COLUMNS.STATUS] === 'IN' &&
            data[i][TYPE_COLUMNS.PLAYER] !== playerName) {
          return {success: false, message: `좌석 ${newSeat}번은 이미 사용 중입니다`};
        }
      }
    }

    // 플레이어 찾기
    for (let i = 1; i < data.length; i++) {
      if (data[i][TYPE_COLUMNS.PLAYER] === playerName &&
          data[i][TYPE_COLUMNS.TABLE] === tableName &&
          data[i][TYPE_COLUMNS.STATUS] === 'IN') {
        const row = i + 1;
        sheet.getRange(row, RANGE_COLUMNS.SEAT).setValue(newSeat || '');
        sheet.getRange(row, RANGE_COLUMNS.UPDATED_AT).setValue(new Date());
        return {success: true, message: '좌석이 업데이트되었습니다'};
      }
    }

    return {success: false, message: '플레이어를 찾을 수 없습니다'};
  } catch (error) {
    console.error('updatePlayerSeat error:', error);
    return {success: false, message: error.toString()};
  }
}

// 플레이어 칩 업데이트
function updatePlayerChips(playerName, tableName, newChips) {
  try {
    const sheet = _open().getSheetByName('Type');
    const data = sheet.getDataRange().getValues();

    // 플레이어 찾기
    for (let i = 1; i < data.length; i++) {
      if (data[i][TYPE_COLUMNS.PLAYER] === playerName &&
          data[i][TYPE_COLUMNS.TABLE] === tableName &&
          data[i][TYPE_COLUMNS.STATUS] === 'IN') {
        const row = i + 1;
        sheet.getRange(row, RANGE_COLUMNS.CHIPS).setValue(newChips || 0);
        sheet.getRange(row, RANGE_COLUMNS.UPDATED_AT).setValue(new Date());
        return {success: true, message: '칩이 업데이트되었습니다'};
      }
    }

    return {success: false, message: '플레이어를 찾을 수 없습니다'};
  } catch (error) {
    console.error('updatePlayerChips error:', error);
    return {success: false, message: error.toString()};
  }
}

// 플레이어 삭제 (행 자체를 삭제)
function deletePlayer(playerName, tableName) {
  try {
    const sheet = _open().getSheetByName('Type');
    const data = sheet.getDataRange().getValues();
    
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][TYPE_COLUMNS.PLAYER] === playerName && 
          data[i][TYPE_COLUMNS.TABLE] === tableName) {
        sheet.deleteRow(i + 1);
        return {success: true, message: `${playerName} 삭제 완료`};
      }
    }
    
    return {success: false, message: '플레이어를 찾을 수 없습니다'};
  } catch (error) {
    console.error('deletePlayer error:', error);
    return {success: false, message: error.toString()};
  }
}

// ===== 기존 v56 핸드 편집 기능 유지 =====

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

// ===== 기존 핸드 저장 함수들 (v56 유지) =====

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
      
      if (/^(RAISE|RAISES|RAISE TO|RAIES)$/.test(eventType)) {
        eventType = 'RAISE TO';
      }
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
    'lastStreet', 'lastAction', 'workStatus', 'winners'
  ];
  
  if (sheet.getLastRow() < 1) {
    sheet.getRange(1, 1, 1, fullHeaderRow.length).setValues([fullHeaderRow]);
  } else {
    const lastCol = sheet.getLastColumn();
    if (lastCol < 18) {  // 17에서 18로 변경 (winners 열 추가)
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
    version: 'v59-inout'
  });
}

function doPost(e) {
  try {
    const body = _parseRequestBody(e) || {};

    // 액션 기반 라우팅
    if (body.action) {
      switch(body.action) {
        // 테이블 관리
        case 'getTableList':
          return _json(getTableList());

        // 플레이어 관리
        case 'getPlayersByTable':
          return _json(getPlayersByTable(body.tableName));

        case 'upsertPlayer':
          return _json(upsertPlayer(body.playerData));

        case 'cashOutPlayer':
          return _json(cashOutPlayer(body.playerName, body.tableName, body.finalChips));

        case 'deletePlayer':
          return _json(deletePlayer(body.player, body.table));

        case 'addPlayer':
          return _json(addPlayer({
            name: body.player,
            table: body.table,
            seat: body.seat,
            chips: body.chips,
            status: body.status || 'IN'
          }));

        case 'updateSeat':
          return _json(updatePlayerSeat(body.player, body.table, body.seat));

        case 'updateChips':
          return _json(updatePlayerChips(body.player, body.table, body.chips));
        
        // v56 기능
        case 'updateHandEdit':
          return _json(updateHandEditStatus(body.handNumber, body.checked));
        
        default:
          return _json({
            success: false,
            message: 'Unknown action: ' + body.action
          });
      }
    }
    
    // 기존 핸드 저장 로직 (action이 없는 경우)
    const rowsInput = body.rows;
    const indexMeta = body.indexMeta || {};
    const typeUpdates = Array.isArray(body.typeUpdates) ? body.typeUpdates : [];
    
    if (!Array.isArray(rowsInput) || !rowsInput.length) {
      return _json({
        status: 'error',
        message: 'rows 데이터가 누락되었습니다.'
      });
    }
    
    const rows = _padRows(_normalizeEventRows(rowsInput));
    
    let handNumber = '';
    for (const row of rows) {
      if (row[1] === 'HAND') {
        handNumber = String(row[2] || '');
        break;
      }
    }
    
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
      indexMeta.workStatus || '진행중',
      indexMeta.winners || ''  // R열: 승자 정보 추가
    ];
    
    indexSheet.appendRow(indexData);
    
    // Type 시트 업데이트 (칩 정보)
    if (typeUpdates.length > 0) {
      const typeData = typeSheet.getDataRange().getValues();
      
      typeUpdates.forEach(update => {
        // Type 시트에서 플레이어 찾기 (Player와 Table 매칭)
        const rowIndex = typeData.findIndex((row, idx) => {
          return idx > 0 && 
                 row[TYPE_COLUMNS.PLAYER] === update.player && 
                 row[TYPE_COLUMNS.TABLE] === update.table;
        });
        
        if (rowIndex > 0) {
          // 칩 업데이트 (E열)
          typeSheet.getRange(rowIndex + 1, RANGE_COLUMNS.CHIPS).setValue(update.chips || 0);
          // UpdatedAt 업데이트 (F열)
          const updateTime = update.updatedAt ? new Date(update.updatedAt) : new Date();
          typeSheet.getRange(rowIndex + 1, RANGE_COLUMNS.UPDATED_AT).setValue(updateTime);
          
          // Status가 OUT인 경우 IN으로 변경 (플레이어가 다시 활동 중)
          const currentStatus = typeData[rowIndex][TYPE_COLUMNS.STATUS];
          if (currentStatus === 'OUT' || !currentStatus) {
            typeSheet.getRange(rowIndex + 1, RANGE_COLUMNS.STATUS).setValue('IN');
          }
          
          console.log(`Type 시트 업데이트: ${update.player} - ${update.chips} 칩`);
        } else {
          // 플레이어가 Type 시트에 없는 경우 새로 추가
          console.log(`Type 시트에 ${update.player} 추가`);
          const newRow = new Array(8);
          newRow[TYPE_COLUMNS.CAMERA] = '';
          newRow[TYPE_COLUMNS.PLAYER] = update.player;
          newRow[TYPE_COLUMNS.TABLE] = update.table;
          newRow[TYPE_COLUMNS.NOTABLE] = 'FALSE';
          newRow[TYPE_COLUMNS.CHIPS] = update.chips || 0;
          newRow[TYPE_COLUMNS.UPDATED_AT] = new Date();
          newRow[TYPE_COLUMNS.SEAT] = '';
          newRow[TYPE_COLUMNS.STATUS] = 'IN';
          
          typeSheet.appendRow(newRow);
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
      version: 'v59-inout'
    });
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return _json({
      status: 'error',
      message: error.toString()
    });
  }
}

// ===== 테스트 함수 =====

function testInOutSystem() {
  console.log('=== IN/OUT 시스템 테스트 ===');
  
  // 1. 테이블 목록 조회
  const tables = getTableList();
  console.log('1. 테이블 목록:', tables);
  
  // 2. 플레이어 추가
  const newPlayer = upsertPlayer({
    name: 'Test Player',
    table: 'Test Table',
    chips: 100000,
    seat: 1,
    notable: true
  });
  console.log('2. 플레이어 추가:', newPlayer);
  
  // 3. 테이블별 플레이어 조회
  const players = getPlayersByTable('Test Table');
  console.log('3. 플레이어 목록:', players);
  
  // 4. 캐시아웃
  const cashOut = cashOutPlayer('Test Player', 'Test Table', 150000);
  console.log('4. 캐시아웃:', cashOut);
  
  console.log('=== 테스트 완료 ===');
}