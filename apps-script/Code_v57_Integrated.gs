/****************************************************
 * Poker Hand Logger - Apps Script Backend v57
 * v56 기존 기능 + 테이블 관리 시스템 통합
 * 
 * 기존 기능 (v56):
 * - 핸드 데이터 저장
 * - 체크박스 업데이트 (updateHandEdit)
 * - Index 시트 관리
 * 
 * 추가 기능 (v57):
 * - Tables 시트: 테이블 관리
 * - Players 시트: 플레이어 DB
 * - TablePlayers 시트: 테이블-플레이어 관계
 ****************************************************/

const SHEET_ID = '1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U';
const DEBUG = true; // 디버그 모드

// ===== 유틸리티 함수 (v56 그대로 유지) =====

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _open() {
  return SpreadsheetApp.openById(SHEET_ID);
}

function _log(message, data = null) {
  if (DEBUG) {
    if (data) {
      console.log(message, JSON.stringify(data));
    } else {
      console.log(message);
    }
  }
}

// ===== 요청 파싱 함수 (v56 그대로 유지) =====
function _parseRequestBody(e) {
  _log('=== _parseRequestBody 시작 ===');
  
  // e가 없으면 빈 객체 반환
  if (!e) {
    _log('❌ e가 undefined');
    return {};
  }
  
  // 1. FormData 방식 (payload 파라미터)
  if (e.parameter && e.parameter.payload) {
    _log('✅ FormData payload 발견:', e.parameter.payload);
    try {
      const parsed = JSON.parse(e.parameter.payload);
      _log('✅ 파싱 성공:', parsed);
      return parsed;
    } catch (err) {
      _log('❌ FormData 파싱 실패:', err.message);
    }
  }
  
  // 2. JSON Body 방식
  if (e.postData && e.postData.type === 'application/json') {
    _log('✅ JSON body 발견');
    try {
      const parsed = JSON.parse(e.postData.contents);
      _log('✅ JSON 파싱 성공:', parsed);
      return parsed;
    } catch (err) {
      _log('❌ JSON 파싱 실패:', err.message);
    }
  }
  
  // 3. URL 파라미터 방식 (fallback)
  if (e.parameter) {
    _log('URL 파라미터 사용:', e.parameter);
    return e.parameter;
  }
  
  _log('❌ 파싱할 데이터 없음');
  return {};
}

// ===== 핸드 편집 상태 업데이트 함수 (v56 그대로 유지) =====
function updateHandEditStatus(handNumber, checked) {
  _log(`updateHandEditStatus 호출: 핸드 #${handNumber}, 체크: ${checked}`);
  
  try {
    const spreadsheet = _open();
    const indexSheet = spreadsheet.getSheetByName('Index');
    
    if (!indexSheet) {
      throw new Error('Index 시트를 찾을 수 없습니다');
    }
    
    const data = indexSheet.getDataRange().getValues();
    _log(`Index 시트 데이터 행 수: ${data.length}`);
    
    // 헤더 제외하고 검색
    for (let i = 1; i < data.length; i++) {
      const currentHandNumber = String(data[i][0]); // A열: handNumber
      
      if (currentHandNumber === String(handNumber)) {
        _log(`핸드 찾음: 행 ${i + 1}`);
        
        // E열 (5번째): handEdit 체크박스
        const checkboxRange = indexSheet.getRange(i + 1, 5);
        checkboxRange.setValue(checked ? true : false);
        
        // F열 (6번째): handEditTime
        const timeRange = indexSheet.getRange(i + 1, 6);
        if (checked) {
          timeRange.setValue(new Date());
        } else {
          timeRange.setValue('');
        }
        
        _log(`✅ 업데이트 완료`);
        
        return {
          success: true,
          handNumber: handNumber,
          checked: checked,
          editTime: checked ? new Date().toISOString() : null
        };
      }
    }
    
    throw new Error(`핸드 #${handNumber}를 찾을 수 없습니다`);
    
  } catch (error) {
    _log('❌ updateHandEditStatus 에러:', error.message);
    throw error;
  }
}

// ===== 테이블 관리 시스템 (v57 신규) =====

// 시트 초기화 (새로운 시트 생성)
function initializeTableSheets() {
  _log('=== initializeTableSheets 시작 ===');
  
  const ss = _open();
  
  // Tables 시트 생성/초기화
  let tablesSheet = ss.getSheetByName('Tables');
  if (!tablesSheet) {
    tablesSheet = ss.insertSheet('Tables');
    tablesSheet.getRange(1, 1, 1, 7).setValues([
      ['TableID', 'TableName', 'Stakes', 'MaxPlayers', 'CreatedAt', 'UpdatedAt', 'Active']
    ]);
    tablesSheet.getRange(1, 1, 1, 7)
      .setBackground('#1a1a1a')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    _log('✅ Tables 시트 생성됨');
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
    _log('✅ Players 시트 생성됨');
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
    _log('✅ TablePlayers 시트 생성됨');
  }
  
  // 기존 테이블 데이터 마이그레이션
  migrateExistingTables();
  
  return { success: true, message: 'Table sheets initialized successfully' };
}

// 기존 테이블 데이터 마이그레이션
function migrateExistingTables() {
  _log('=== migrateExistingTables 시작 ===');
  
  const ss = _open();
  const typeSheet = ss.getSheetByName('Type');
  const tablesSheet = ss.getSheetByName('Tables');
  
  if (!typeSheet || !tablesSheet) {
    _log('시트가 없어서 마이그레이션 건너뜀');
    return;
  }
  
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
  let addedCount = 0;
  
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
      addedCount++;
    }
  });
  
  _log(`✅ ${addedCount}개 테이블 마이그레이션 완료`);
}

// 테이블 목록 조회
function getTables() {
  _log('=== getTables 시작 ===');
  
  try {
    const ss = _open();
    let sheet = ss.getSheetByName('Tables');
    
    if (!sheet) {
      // Tables 시트가 없으면 생성
      initializeTableSheets();
      sheet = ss.getSheetByName('Tables');
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
        _log(`Type 시트에서 ${tables.length}개 테이블 로드`);
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
    
    _log(`✅ ${tables.length}개 테이블 반환`);
    return { success: true, tables };
    
  } catch (error) {
    _log('❌ getTables 에러:', error.message);
    return { success: false, message: error.toString(), tables: [] };
  }
}

// 테이블 생성
function createTable(tableName, stakes, maxPlayers) {
  _log('=== createTable 시작 ===');
  _log('입력값:', { tableName, stakes, maxPlayers });
  
  try {
    const ss = _open();
    let sheet = ss.getSheetByName('Tables');
    
    if (!sheet) {
      initializeTableSheets();
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
    
    _log('✅ 테이블 생성 완료:', tableId);
    
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
    _log('❌ createTable 에러:', error.message);
    return { success: false, message: error.toString() };
  }
}

// 플레이어 목록 조회
function getPlayers(tableId = null) {
  _log('=== getPlayers 시작 ===');
  _log('tableId:', tableId);
  
  try {
    const ss = _open();
    
    // Players 시트에서 가져오기
    let sheet = ss.getSheetByName('Players');
    if (!sheet) {
      initializeTableSheets();
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
        _log(`Type 시트에서 ${players.length}명 플레이어 로드`);
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
    
    _log(`✅ ${players.length}명 플레이어 반환`);
    return { success: true, players };
    
  } catch (error) {
    _log('❌ getPlayers 에러:', error.message);
    return { success: false, message: error.toString(), players: [] };
  }
}

// 플레이어 생성/업데이트
function upsertPlayer(playerData) {
  _log('=== upsertPlayer 시작 ===');
  _log('입력 데이터:', playerData);
  
  try {
    const ss = _open();
    let sheet = ss.getSheetByName('Players');
    
    if (!sheet) {
      initializeTableSheets();
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
      
      _log('✅ 새 플레이어 생성:', playerId);
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
      
      _log('✅ 플레이어 업데이트:', data[playerRow][0]);
      return { success: true, playerId: data[playerRow][0], action: 'updated' };
    }
    
  } catch (error) {
    _log('❌ upsertPlayer 에러:', error.message);
    return { success: false, message: error.toString() };
  }
}

// ===== 메인 핸들러 (v56 기존 로직 유지 + v57 추가) =====

function doGet(e) {
  _log('=== doGet 호출됨 ===');
  
  return _json({
    status: 'ok',
    version: 'v57',
    timestamp: new Date().toISOString(),
    message: 'Poker Hand Logger API v57 - Ready (v56 + Table Management)'
  });
}

function doPost(e) {
  _log('=== doPost v57 시작 ===');
  
  try {
    // 요청 본문 파싱
    const body = _parseRequestBody(e);
    _log('파싱된 body:', body);
    
    // 빈 요청 체크
    if (!body || Object.keys(body).length === 0) {
      _log('❌ 빈 요청');
      return _json({
        status: 'error',
        message: '요청 데이터가 비어있습니다',
        version: 'v57'
      });
    }
    
    // ===== v56 기존 액션 처리 =====
    
    // updateHandEdit 액션 처리
    if (body.action === 'updateHandEdit') {
      _log('📝 updateHandEdit 액션 감지');
      
      if (!body.handNumber) {
        return _json({
          status: 'error',
          message: 'handNumber가 필요합니다',
          version: 'v57'
        });
      }
      
      try {
        const result = updateHandEditStatus(
          body.handNumber,
          body.checked === true || body.checked === 'true'
        );
        
        _log('✅ updateHandEdit 성공:', result);
        return _json(result);
        
      } catch (error) {
        _log('❌ updateHandEdit 실패:', error.message);
        return _json({
          status: 'error',
          message: error.message,
          version: 'v57'
        });
      }
    }
    
    // ===== v57 테이블 관리 액션 처리 =====
    
    // 테이블 시트 초기화
    if (body.action === 'initializeSheets') {
      _log('📋 initializeSheets 액션');
      const result = initializeTableSheets();
      return _json(result);
    }
    
    // 테이블 목록 조회
    if (body.action === 'getTables') {
      _log('📋 getTables 액션');
      const result = getTables();
      return _json(result);
    }
    
    // 테이블 생성
    if (body.action === 'createTable') {
      _log('📋 createTable 액션');
      const result = createTable(body.tableName, body.stakes, body.maxPlayers);
      return _json(result);
    }
    
    // 플레이어 목록 조회
    if (body.action === 'getPlayers') {
      _log('📋 getPlayers 액션');
      const result = getPlayers(body.tableId);
      return _json(result);
    }
    
    // 플레이어 생성/업데이트
    if (body.action === 'upsertPlayer') {
      _log('📋 upsertPlayer 액션');
      const result = upsertPlayer(body.playerData);
      return _json(result);
    }
    
    // ===== v56 기존 핸드 저장 로직 (action이 없는 경우) =====
    
    _log('기존 핸드 저장 로직 진입');
    
    const rowsInput = body.rows;
    const indexMeta = body.indexMeta || {};
    const typeUpdates = Array.isArray(body.typeUpdates) ? body.typeUpdates : [];
    
    // rows 데이터 검증
    if (!Array.isArray(rowsInput) || rowsInput.length === 0) {
      _log('❌ rows 데이터 누락');
      return _json({
        status: 'error',
        message: 'rows 누락',
        version: 'v57'
      });
    }
    
    // 데이터 처리
    const rows = _padRows(_normalizeEventRows(rowsInput));
    
    // 핸드 정보 추출
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
    
    // Hand 시트에 저장
    const startRow = handSheet.getLastRow() + 1;
    handSheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
    const endRow = startRow + rows.length - 1;
    
    // Index 시트 업데이트
    _ensureIndexHeader(indexSheet);
    
    // 중복 체크
    const existingData = indexSheet.getDataRange().getValues();
    for (let i = 1; i < existingData.length; i++) {
      if (String(existingData[i][0]) === handNumber) {
        return _json({
          status: 'duplicate',
          message: `핸드 #${handNumber}는 이미 존재합니다`,
          handNumber: handNumber,
          version: 'v57'
        });
      }
    }
    
    // Index 데이터 추가
    const indexData = [
      handNumber,
      startRow,
      endRow,
      indexMeta.handUpdatedAt || new Date().toISOString().split('T')[0],
      false, // handEdit 초기값
      '',    // handEditTime 초기값
      indexMeta.label || '',
      indexMeta.table || '',
      indexMeta.tableUpdatedAt || '',
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
    
    _log('✅ 핸드 저장 성공:', handNumber);
    
    return _json({
      status: 'success',
      handNumber: handNumber,
      rowsAdded: rows.length,
      version: 'v57'
    });
    
  } catch (error) {
    _log('❌ doPost 에러:', error.message);
    _log('에러 스택:', error.stack);
    
    return _json({
      status: 'error',
      message: error.message,
      stack: error.stack,
      version: 'v57'
    });
  }
}

// ===== 헬퍼 함수들 (v56 그대로 유지) =====

function _padRows(rows) {
  if (!Array.isArray(rows)) return [];
  
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
    'lastStreet', 'lastAction', 'workStatus'
  ];
  
  if (sheet.getLastRow() < 1) {
    sheet.getRange(1, 1, 1, fullHeaderRow.length).setValues([fullHeaderRow]);
  }
}

// ===== 테스트 함수 =====

// v56 테스트 함수 (그대로 유지)
function testUpdateHandEdit() {
  _log('=== testUpdateHandEdit 시작 ===');
  
  const e = {
    parameter: {
      payload: JSON.stringify({
        action: 'updateHandEdit',
        handNumber: '1',
        checked: true
      })
    }
  };
  
  const result = doPost(e);
  const content = result.getContent();
  
  _log('테스트 결과:', content);
  
  const parsed = JSON.parse(content);
  if (parsed.success === true) {
    _log('✅ 테스트 성공!');
  } else {
    _log('❌ 테스트 실패:', parsed.message);
  }
  
  return parsed;
}

// v57 테이블 시스템 테스트
function testTableSystem() {
  _log('=== testTableSystem 시작 ===');
  
  // 1. 시트 초기화
  const initResult = initializeTableSheets();
  _log('1. 시트 초기화:', initResult);
  
  // 2. 테이블 목록 조회
  const tablesResult = getTables();
  _log('2. 테이블 목록:', tablesResult);
  
  // 3. 새 테이블 생성
  const newTable = createTable('Test Table v57', '1/2 NL', 9);
  _log('3. 테이블 생성:', newTable);
  
  // 4. 플레이어 추가
  const newPlayer = upsertPlayer({
    Name: 'Test Player v57',
    CurrentTable: 'Test Table v57',
    CurrentChips: 100000,
    Notable: true
  });
  _log('4. 플레이어 추가:', newPlayer);
  
  // 5. 플레이어 목록 조회
  const playersResult = getPlayers();
  _log('5. 플레이어 목록:', playersResult);
  
  _log('=== 테스트 완료 ===');
  
  return {
    init: initResult,
    tables: tablesResult,
    newTable: newTable,
    newPlayer: newPlayer,
    players: playersResult
  };
}

// 연결 테스트 (v56 + v57 시트 확인)
function testConnection() {
  try {
    const ss = _open();
    const sheets = ss.getSheets().map(s => s.getName());
    
    _log('연결 성공! 시트 목록:', sheets);
    
    return {
      status: 'success',
      sheets: sheets,
      version: 'v57',
      features: ['v56 핸드 저장', 'v56 체크박스', 'v57 테이블 관리']
    };
  } catch (error) {
    _log('연결 실패:', error.message);
    return {
      status: 'error',
      message: error.message
    };
  }
}