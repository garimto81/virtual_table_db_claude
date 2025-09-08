/****************************************************
 * Poker Hand Logger - Apps Script Backend v58
 * Type 시트만 사용하는 간단한 테이블 관리 시스템
 * 
 * Type 시트 구조:
 * A: Camera Preset (사용 안함)
 * B: Player
 * C: Table  
 * D: Notable
 * E: Chips
 * F: UpdatedAt
 * G: Seat
 * H: Status (NEW)
 ****************************************************/

const SHEET_ID = '1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U';

// Type 시트 열 인덱스 (0-based for array)
const TYPE_COLUMNS = {
  CAMERA: 0,      // A열 - Camera Preset
  PLAYER: 1,      // B열 - Player
  TABLE: 2,       // C열 - Table
  NOTABLE: 3,     // D열 - Notable
  CHIPS: 4,       // E열 - Chips
  UPDATED_AT: 5,  // F열 - UpdatedAt
  SEAT: 6,        // G열 - Seat
  STATUS: 7       // H열 - Status
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

// Status 상태값
const PlayerStatus = {
  ACTIVE: 'ACTIVE',     // 플레이 중
  AWAY: 'AWAY',         // 자리 비움
  BREAK: 'BREAK',       // 휴식 중
  OUT: 'OUT',           // 테이블 떠남
  BUSTED: 'BUSTED'      // 올인 후 탈락
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

// ===== 초기화 함수 (Status 열 추가) =====

function initializeStatusColumn() {
  const sheet = _open().getSheetByName('Type');
  if (!sheet) {
    return {success: false, message: 'Type 시트를 찾을 수 없습니다'};
  }
  
  // 헤더 확인
  const headers = sheet.getRange(1, 1, 1, 8).getValues()[0];
  
  // H열에 Status 헤더가 없으면 추가
  if (headers[7] !== 'Status') {
    sheet.getRange(1, 8).setValue('Status');
    
    // 기존 데이터에 기본값 설정
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const dataRange = sheet.getRange(2, 1, lastRow - 1, 8);
      const data = dataRange.getValues();
      
      for (let i = 0; i < data.length; i++) {
        const chips = data[i][TYPE_COLUMNS.CHIPS];
        // 칩이 있으면 ACTIVE, 없으면 OUT
        data[i][TYPE_COLUMNS.STATUS] = chips > 0 ? 'ACTIVE' : 'OUT';
      }
      
      dataRange.setValues(data);
    }
    
    return {success: true, message: 'Status 열이 추가되었습니다'};
  }
  
  return {success: true, message: 'Status 열이 이미 존재합니다'};
}

// ===== 테이블 관리 API =====

function getTableList() {
  try {
    const sheet = _open().getSheetByName('Type');
    if (!sheet) return {success: false, tables: []};
    
    const data = sheet.getDataRange().getValues();
    const tables = new Map();
    
    for (let i = 1; i < data.length; i++) {
      const tableName = data[i][TYPE_COLUMNS.TABLE];
      const status = data[i][TYPE_COLUMNS.STATUS] || 'ACTIVE';
      
      if (tableName && status !== 'OUT' && status !== 'BUSTED') {
        const count = tables.get(tableName) || {active: 0, away: 0, total: 0};
        
        if (status === 'ACTIVE') count.active++;
        else if (status === 'AWAY' || status === 'BREAK') count.away++;
        count.total++;
        
        tables.set(tableName, count);
      }
    }
    
    return {
      success: true,
      tables: Array.from(tables.entries()).map(([name, count]) => ({
        name: name,
        activeCount: count.active,
        awayCount: count.away,
        totalCount: count.total
      }))
    };
  } catch (error) {
    console.error('getTableList error:', error);
    return {success: false, message: error.toString(), tables: []};
  }
}

// ===== 플레이어 관리 API =====

function getPlayersByTable(tableName) {
  try {
    const sheet = _open().getSheetByName('Type');
    if (!sheet) return {success: false, players: []};
    
    const data = sheet.getDataRange().getValues();
    const players = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const table = row[TYPE_COLUMNS.TABLE];
      const status = row[TYPE_COLUMNS.STATUS] || 'ACTIVE';
      
      if (table === tableName && status !== 'OUT' && status !== 'BUSTED') {
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

function upsertPlayer(playerData) {
  try {
    const sheet = _open().getSheetByName('Type');
    if (!sheet) return {success: false, message: 'Type 시트를 찾을 수 없습니다'};
    
    const data = sheet.getDataRange().getValues();
    
    // 기존 플레이어 찾기
    let targetRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][TYPE_COLUMNS.PLAYER] === playerData.name && 
          data[i][TYPE_COLUMNS.TABLE] === playerData.table) {
        targetRow = i + 1;
        break;
      }
    }
    
    const now = new Date();
    
    if (targetRow === -1) {
      // 새 플레이어 추가
      const newRow = new Array(8);
      newRow[TYPE_COLUMNS.CAMERA] = '';
      newRow[TYPE_COLUMNS.PLAYER] = playerData.name;
      newRow[TYPE_COLUMNS.TABLE] = playerData.table;
      newRow[TYPE_COLUMNS.NOTABLE] = playerData.notable ? 'TRUE' : 'FALSE';
      newRow[TYPE_COLUMNS.CHIPS] = playerData.chips || 0;
      newRow[TYPE_COLUMNS.UPDATED_AT] = now;
      newRow[TYPE_COLUMNS.SEAT] = playerData.seat || '';
      newRow[TYPE_COLUMNS.STATUS] = 'ACTIVE';
      
      sheet.appendRow(newRow);
      return {success: true, action: 'created', row: sheet.getLastRow()};
      
    } else {
      // 기존 플레이어 수정
      if (playerData.chips !== undefined) {
        sheet.getRange(targetRow, RANGE_COLUMNS.CHIPS).setValue(playerData.chips);
      }
      if (playerData.seat !== undefined) {
        sheet.getRange(targetRow, RANGE_COLUMNS.SEAT).setValue(playerData.seat);
      }
      if (playerData.status !== undefined) {
        sheet.getRange(targetRow, RANGE_COLUMNS.STATUS).setValue(playerData.status);
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

// Status 변경 함수들
function updatePlayerStatus(playerName, tableName, newStatus) {
  try {
    const sheet = _open().getSheetByName('Type');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][TYPE_COLUMNS.PLAYER] === playerName && 
          data[i][TYPE_COLUMNS.TABLE] === tableName) {
        const row = i + 1;
        
        sheet.getRange(row, RANGE_COLUMNS.STATUS).setValue(newStatus);
        sheet.getRange(row, RANGE_COLUMNS.UPDATED_AT).setValue(new Date());
        
        // OUT 상태면 좌석도 비움
        if (newStatus === 'OUT' || newStatus === 'BUSTED') {
          sheet.getRange(row, RANGE_COLUMNS.SEAT).setValue('');
        }
        
        return {success: true, status: newStatus};
      }
    }
    
    return {success: false, message: '플레이어를 찾을 수 없습니다'};
  } catch (error) {
    console.error('updatePlayerStatus error:', error);
    return {success: false, message: error.toString()};
  }
}

// ===== v56 기존 기능 유지 =====

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

// ===== 메인 핸들러 =====

function doGet(e) {
  return _json({
    status: 'ok',
    method: 'GET',
    time: new Date().toISOString(),
    version: 'v58-simple'
  });
}

function doPost(e) {
  try {
    const body = _parseRequestBody(e) || {};
    
    // 액션 기반 라우팅
    if (body.action) {
      switch(body.action) {
        // 초기화
        case 'initializeStatus':
          return _json(initializeStatusColumn());
        
        // 테이블 관리
        case 'getTableList':
          return _json(getTableList());
        
        // 플레이어 관리
        case 'getPlayersByTable':
          return _json(getPlayersByTable(body.tableName));
        
        case 'upsertPlayer':
          return _json(upsertPlayer(body.playerData));
        
        case 'updatePlayerStatus':
          return _json(updatePlayerStatus(body.playerName, body.tableName, body.status));
        
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
    // ... 기존 v56 핸드 저장 코드 유지 ...
    
    return _json({
      status: 'error',
      message: 'No action specified'
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

function testSimpleSystem() {
  console.log('=== Type 시트 기반 시스템 테스트 ===');
  
  // 1. Status 열 초기화
  const initResult = initializeStatusColumn();
  console.log('1. Status 열 초기화:', initResult);
  
  // 2. 테이블 목록 조회
  const tables = getTableList();
  console.log('2. 테이블 목록:', tables);
  
  // 3. 플레이어 추가
  const newPlayer = upsertPlayer({
    name: 'Test Player',
    table: 'Test Table',
    chips: 100000,
    seat: 1,
    notable: true
  });
  console.log('3. 플레이어 추가:', newPlayer);
  
  // 4. 테이블별 플레이어 조회
  const players = getPlayersByTable('Test Table');
  console.log('4. 플레이어 목록:', players);
  
  // 5. Status 변경 테스트
  const statusUpdate = updatePlayerStatus('Test Player', 'Test Table', 'AWAY');
  console.log('5. Status 변경:', statusUpdate);
  
  console.log('=== 테스트 완료 ===');
}