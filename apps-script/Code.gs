/****************************************************
 * Poker Hand Logger - Apps Script Backend v52
 * 
 * 스프레드시트 구조:
 * - Hand 시트: 포커 핸드 로우 데이터
 * - Index 시트: 핸드 인덱스 (확장된 14개 열 구조)
 * - Type 시트: 플레이어 정보 (A:설정, B:Player, C:Table, D:Notable, E:Chips, F:UpdatedAt)
 * - Note 시트: 핸드 노트 (A:Timestamp, B:HandNumber, C:Note)
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

function _parseRequestBody(e) {
  // 1) form-urlencoded / multipart 방식
  if (e && e.parameter && typeof e.parameter.payload === 'string') {
    try {
      return JSON.parse(e.parameter.payload);
    } catch (err) {
      console.error('Failed to parse payload:', err);
      return {};
    }
  }
  
  // 2) application/json 방식
  if (e && e.postData && e.postData.type && 
      e.postData.type.indexOf('application/json') !== -1) {
    try {
      return JSON.parse(e.postData.contents || '{}');
    } catch (err) {
      console.error('Failed to parse JSON:', err);
      return {};
    }
  }
  
  return {};
}

// ===== 시트 헤더 관리 =====

function _ensureIndexHeader(sheet) {
  if (sheet.getLastRow() < 1) {
    // 헤더가 없으면 생성
    const headerRow = [
      'handNumber', 'startRow', 'endRow', 'handUpdatedAt', 
      'handEdit', 'handEditTime', 'label', 'table', 
      'tableUpdatedAt', 'Cam', 'CamFile01name', 'CamFile01number',
      'CamFile02name', 'CamFile02number'
    ];
    sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
  } else {
    // 헤더 검증 - 최소한 필수 열들이 존재하는지 확인
    const lastCol = sheet.getLastColumn();
    if (lastCol < 14) {
      // 필요한 열이 부족하면 확장
      const headerRow = [
        'handNumber', 'startRow', 'endRow', 'handUpdatedAt', 
        'handEdit', 'handEditTime', 'label', 'table', 
        'tableUpdatedAt', 'Cam', 'CamFile01name', 'CamFile01number',
        'CamFile02name', 'CamFile02number'
      ];
      sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
    }
  }
}

function _ensureNoteHeader(sheet) {
  if (sheet.getLastRow() < 1) {
    // 헤더가 없으면 생성
    sheet.getRange(1, 1, 1, 3).setValues([[
      'Timestamp', 'HandNumber', 'Note'
    ]]);
  } else {
    // 헤더 검증 및 수정
    const header = sheet.getRange(1, 1, 1, 3).getValues()[0] || [];
    const expectedHeader = ['Timestamp', 'HandNumber', 'Note'];
    
    let needsUpdate = false;
    for (let i = 0; i < 3; i++) {
      if (String(header[i] || '') !== expectedHeader[i]) {
        needsUpdate = true;
        break;
      }
    }
    
    if (needsUpdate) {
      sheet.getRange(1, 1, 1, 3).setValues([expectedHeader]);
    }
  }
}

// ===== 메인 핸들러 =====

function doGet(e) {
  return _json({
    status: 'ok',
    method: 'GET',
    time: new Date().toISOString(),
    version: 'v52'
  });
}

function doPost(e) {
  try {
    const body = _parseRequestBody(e) || {};
    const rowsInput = body.rows;
    const indexMeta = body.indexMeta || {};
    const typeUpdates = Array.isArray(body.typeUpdates) ? body.typeUpdates : [];
    // 노트는 선택적 (프론트엔드에서 노트 기능 제거됨)
    const noteData = body.note && String(body.note?.text || '').trim() ? body.note : null;
    
    // 데이터 검증
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
    let handCode = '';
    let epochTimestamp = '';
    
    for (const row of rows) {
      if (row[1] === 'HAND') {
        handNumber = String(row[2] || '');
        handCode = String(row[3] || '');
        epochTimestamp = String(row[3] || ''); // D열: 타임코드
        break;
      }
    }
    
    // 스프레드시트 열기
    const spreadsheet = _open();
    const handSheet = spreadsheet.getSheetByName('Hand') || spreadsheet.insertSheet('Hand');
    // Index 시트를 사용 (HandIndex가 아닌 Index)
    const indexSheet = spreadsheet.getSheetByName('Index') || spreadsheet.insertSheet('Index');
    const typeSheet = spreadsheet.getSheetByName('Type') || spreadsheet.insertSheet('Type');
    const noteSheet = spreadsheet.getSheetByName('Note') || spreadsheet.insertSheet('Note');
    
    // ===== 1) Hand 시트에 데이터 기록 =====
    const startRow = handSheet.getLastRow() + 1;
    handSheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
    const endRow = startRow + rows.length - 1;
    
    // ===== 2) Index 시트 업데이트 =====
    _ensureIndexHeader(indexSheet);
    
    // handUpdatedAt은 날짜만 (YYYY-MM-DD 형식)
    const rawDate = indexMeta.handUpdatedAt || new Date().toISOString();
    const updatedAt = String(rawDate).split('T')[0]; // YYYY-MM-DD 형식으로 변환
    const editTime = new Date();
    
    // 디버깅: 받은 데이터 로깅
    console.log('IndexMeta received:', JSON.stringify(indexMeta));
    console.log('HandNumber from rows:', handNumber);
    
    // Index 시트 열 구조에 맞게 데이터 준비
    // A:handNumber, B:startRow, C:endRow, D:handUpdatedAt, 
    // E:handEdit, F:handEditTime, G:label, H:table, 
    // I:tableUpdatedAt, J:Cam, K:CamFile01name, L:CamFile01number,
    // M:CamFile02name, N:CamFile02number
    const indexData = [
      handNumber || String(indexMeta.handNumber || ''),     // A: handNumber
      startRow,                                              // B: startRow
      endRow,                                                // C: endRow
      updatedAt,                                             // D: handUpdatedAt
      '',                                                    // E: handEdit (비워둠)
      editTime,                                              // F: handEditTime
      indexMeta.label || '',                                // G: label
      indexMeta.table || '',                                // H: table
      indexMeta.tableUpdatedAt || updatedAt,                // I: tableUpdatedAt (YYYY-MM-DD)
      indexMeta.cam || '',                                   // J: Cam
      indexMeta.camFile01name || '',                        // K: CamFile01name
      indexMeta.camFile01number || '',                      // L: CamFile01number
      indexMeta.camFile02name || '',                        // M: CamFile02name
      indexMeta.camFile02number || ''                       // N: CamFile02number
    ];
    
    // 디버깅: 저장할 데이터 로깅
    console.log('IndexData to save:', JSON.stringify(indexData));
    
    try {
      indexSheet.appendRow(indexData);
      console.log('Index row added successfully');
    } catch (error) {
      console.error('Failed to append Index row:', error);
      throw error;
    }
    
    // ===== 3) Type 시트 업데이트 (칩 정보) =====
    if (typeUpdates.length > 0) {
      const typeData = typeSheet.getDataRange().getValues();
      const playerColIndex = 1; // B열: Player
      const tableColIndex = 2;  // C열: Table
      const chipsColIndex = 4;  // E열: Chips
      const updatedAtColIndex = 5; // F열: UpdatedAt
      
      typeUpdates.forEach(update => {
        // 해당 플레이어 찾기
        const rowIndex = typeData.findIndex((row, idx) => {
          return idx > 0 && // 헤더 제외
                 row[playerColIndex] === update.player &&
                 row[tableColIndex] === update.table;
        });
        
        if (rowIndex > 0) {
          // 칩 업데이트
          typeSheet.getRange(rowIndex + 1, chipsColIndex + 1).setValue(update.chips || '');
          // 업데이트 시간
          const updateTime = update.updatedAt ? new Date(update.updatedAt) : new Date();
          typeSheet.getRange(rowIndex + 1, updatedAtColIndex + 1).setValue(updateTime);
        }
      });
    }
    
    // ===== 4) Note 시트에 노트 추가 =====
    if (noteData) {
      _ensureNoteHeader(noteSheet);
      
      // Note 시트 스키마: A:Timestamp, B:HandNumber, C:Note
      const timestampValue = noteData.code || epochTimestamp || Math.floor(Date.now() / 1000);
      const noteRow = [
        String(timestampValue),                             // A열: Timestamp
        handNumber || String(noteData.handNumber || ''),    // B열: HandNumber
        String(noteData.text || '')                        // C열: Note
      ];
      
      noteSheet.appendRow(noteRow);
    }
    
    // 성공 응답
    return _json({
      status: 'success',
      handNumber: handNumber || indexMeta.handNumber || '',
      rowsAdded: rows.length,
      startRow: startRow,
      endRow: endRow,
      updatedAt: updatedAt,
      noteAdded: !!noteData,
      version: 'v52'
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

// ===== 테스트 함수 =====

function testConnection() {
  try {
    const ss = _open();
    const sheets = ss.getSheets().map(s => s.getName());
    
    console.log('연결 성공!');
    console.log('시트 목록:', sheets);
    
    return {
      status: 'success',
      sheets: sheets,
      spreadsheetId: SHEET_ID
    };
  } catch (error) {
    console.error('연결 실패:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}

function testDataStructure() {
  const ss = _open();
  
  // 각 시트의 헤더 확인
  const sheets = ['Hand', 'Index', 'Type', 'Note'];
  const result = {};
  
  sheets.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet && sheet.getLastRow() > 0) {
      const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      result[sheetName] = {
        exists: true,
        header: header,
        rows: sheet.getLastRow()
      };
    } else {
      result[sheetName] = {
        exists: !!sheet,
        header: [],
        rows: 0
      };
    }
  });
  
  console.log('시트 구조:', JSON.stringify(result, null, 2));
  return result;
}

function testIndexUpdate() {
  const ss = _open();
  const indexSheet = ss.getSheetByName('Index');
  
  if (!indexSheet) {
    console.log('Index 시트가 없습니다');
    return;
  }
  
  // 현재 Index 시트 상태 확인
  const lastRow = indexSheet.getLastRow();
  const lastCol = indexSheet.getLastColumn();
  
  console.log('Index 시트 상태:');
  console.log('- 마지막 행:', lastRow);
  console.log('- 마지막 열:', lastCol);
  
  if (lastRow > 0) {
    const header = indexSheet.getRange(1, 1, 1, Math.min(lastCol, 14)).getValues()[0];
    console.log('- 헤더:', header);
    
    if (lastRow > 1) {
      const lastData = indexSheet.getRange(lastRow, 1, 1, Math.min(lastCol, 14)).getValues()[0];
      console.log('- 마지막 데이터:', lastData);
    }
  }
  
  // 테스트 데이터 추가
  const testData = [
    'TEST_' + new Date().getTime(), // handNumber
    999,                             // startRow
    1099,                            // endRow
    new Date().toISOString().split('T')[0], // handUpdatedAt
    '',                              // handEdit
    new Date(),                      // handEditTime
    'TEST',                          // label
    'Table 1',                       // table
    new Date().toISOString().split('T')[0], // tableUpdatedAt
    'cam1+cam2',                     // Cam
    'cam1',                          // CamFile01name
    '0001',                          // CamFile01number
    'cam2',                          // CamFile02name
    '0002'                           // CamFile02number
  ];
  
  try {
    indexSheet.appendRow(testData);
    console.log('테스트 데이터 추가 성공');
  } catch (error) {
    console.error('테스트 데이터 추가 실패:', error);
  }
}