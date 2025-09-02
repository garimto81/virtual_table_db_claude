/****************************************************
 * Poker Hand Logger - Apps Script Backend v54
 * 
 * 스프레드시트 구조:
 * - Hand 시트: 포커 핸드 로우 데이터
 * - Index 시트: 핸드 인덱스 (확장된 17개 열 구조)
 * - Type 시트: 플레이어 정보 (A:설정, B:Player, C:Table, D:Notable, E:Chips, F:UpdatedAt)
 * 
 * PLAYER 행 구조 (v54):
 * A:행번호, B:PLAYER, C:이름, D:좌석, E:0, F:시작칩, G:종료칩, H:카드
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

/**
 * 모든 행을 동일한 열 개수로 패딩
 */
function _padRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  
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

/**
 * EVENT 행의 액션 타입 정규화
 */
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
      
      // RAISE 변형들 통일
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

/**
 * PLAYER 행 검증 및 수정 (v54 신규)
 * 잘못된 형식의 PLAYER 행을 올바른 형식으로 수정
 */
function _fixPlayerRows(rows) {
  if (!Array.isArray(rows)) return rows;
  
  const output = [];
  
  for (const row of rows) {
    const r = (row || []).slice();
    
    if (r[1] === 'PLAYER') {
      // 현재 구조 분석
      const name = r[2];
      const seat = r[3];
      
      // 잘못된 형식: 0이 두 개 있는 경우 (D, E열에 0)
      if (r[4] === 0 || r[4] === '0') {
        if (r[5] === 0 || r[5] === '0') {
          // 0이 두 개: F, G가 칩, H가 카드
          const initialChips = r[6];
          const finalChips = r[7];
          const cards = r[8] || '';
          
          // 올바른 형식으로 재구성: D열에 0 하나, E-F가 칩, G가 카드
          output.push([r[0], 'PLAYER', name, seat, 0, initialChips, finalChips, cards]);
          
          console.log(`PLAYER 행 수정: ${name} - 0 두개 제거`);
        } else {
          // 0이 하나만: 이미 올바른 형식
          output.push(r);
        }
      } else {
        // D열에 0이 없는 경우: 0 추가 필요
        const initialChips = r[4];
        const finalChips = r[5];
        const cards = r[6] || '';
        
        output.push([r[0], 'PLAYER', name, seat, 0, initialChips, finalChips, cards]);
        
        console.log(`PLAYER 행 수정: ${name} - 0 추가`);
      }
    } else {
      // PLAYER가 아닌 행은 그대로
      output.push(r);
    }
  }
  
  return output;
}

/**
 * 요청 본문 파싱
 */
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

/**
 * Index 시트 헤더 확인 및 생성
 */
function _ensureIndexHeader(sheet) {
  const fullHeaderRow = [
    'handNumber', 'startRow', 'endRow', 'handUpdatedAt', 
    'handEdit', 'handEditTime', 'label', 'table', 
    'tableUpdatedAt', 'Cam', 'CamFile01name', 'CamFile01number',
    'CamFile02name', 'CamFile02number',
    'lastStreet', 'lastAction', 'workStatus'
  ];
  
  if (sheet.getLastRow() < 1) {
    // 헤더가 없으면 생성
    sheet.getRange(1, 1, 1, fullHeaderRow.length).setValues([fullHeaderRow]);
  } else {
    // 헤더가 있으면 열 개수 확인
    const lastCol = sheet.getLastColumn();
    if (lastCol < 17) {
      // 필요한 열이 부족하면 전체 헤더 재설정
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
    version: 'v54'
  });
}

function doPost(e) {
  try {
    console.log('=== doPost v54 시작 ===');
    console.log('Request:', JSON.stringify(e));
    
    const body = _parseRequestBody(e) || {};
    
    // 요청 데이터 검증
    if (!body || Object.keys(body).length === 0) {
      return _json({
        status: 'error',
        message: '요청 데이터가 비어있습니다',
        received: JSON.stringify(e.parameter || {})
      });
    }
    
    const rowsInput = body.rows;
    const indexMeta = body.indexMeta || {};
    const typeUpdates = Array.isArray(body.typeUpdates) ? body.typeUpdates : [];
    
    // rows 데이터 검증
    if (!Array.isArray(rowsInput) || !rowsInput.length) {
      return _json({
        status: 'error',
        message: 'rows 데이터가 누락되었습니다.'
      });
    }
    
    // 데이터 처리 파이프라인
    console.log('원본 rows 개수:', rowsInput.length);
    
    // 1. 이벤트 정규화
    let rows = _normalizeEventRows(rowsInput);
    console.log('이벤트 정규화 후:', rows.length);
    
    // 2. PLAYER 행 수정 (v54 핵심)
    rows = _fixPlayerRows(rows);
    console.log('PLAYER 행 수정 후:', rows.length);
    
    // 3. 패딩 처리
    rows = _padRows(rows);
    console.log('패딩 처리 후:', rows.length);
    
    // HAND 정보 추출
    let handNumber = '';
    let handCode = '';
    
    for (const row of rows) {
      if (row[1] === 'HAND') {
        handNumber = String(row[2] || '');
        handCode = String(row[3] || '');
        console.log(`핸드 정보: #${handNumber}, code: ${handCode}`);
        break;
      }
    }
    
    // 스프레드시트 열기
    const spreadsheet = _open();
    const handSheet = spreadsheet.getSheetByName('Hand') || spreadsheet.insertSheet('Hand');
    const indexSheet = spreadsheet.getSheetByName('Index') || spreadsheet.insertSheet('Index');
    const typeSheet = spreadsheet.getSheetByName('Type') || spreadsheet.insertSheet('Type');
    
    // ===== 1) Hand 시트에 데이터 기록 =====
    const startRow = handSheet.getLastRow() + 1;
    
    // 최대 열 개수 계산
    let maxCols = 0;
    for (const row of rows) {
      maxCols = Math.max(maxCols, (row || []).length);
    }
    
    console.log(`Hand 시트 저장: ${startRow}행부터 ${rows.length}개 행, ${maxCols}개 열`);
    
    // 디버깅: 첫 PLAYER 행 출력
    for (const row of rows) {
      if (row[1] === 'PLAYER') {
        console.log('PLAYER 행 예시:', JSON.stringify(row));
        break;
      }
    }
    
    handSheet.getRange(startRow, 1, rows.length, maxCols).setValues(rows);
    const endRow = startRow + rows.length - 1;
    
    // ===== 2) Index 시트 업데이트 =====
    _ensureIndexHeader(indexSheet);
    
    // 중복 체크
    const existingData = indexSheet.getDataRange().getValues();
    const handNumberColIndex = 0; // A열: handNumber
    
    for (let i = 1; i < existingData.length; i++) {
      if (String(existingData[i][handNumberColIndex]) === String(handNumber)) {
        console.log(`핸드 #${handNumber}는 이미 존재합니다.`);
        return _json({
          status: 'duplicate',
          message: `핸드 #${handNumber}는 이미 기록되어 있습니다`,
          handNumber: handNumber,
          existingRow: i + 1
        });
      }
    }
    
    // Index 데이터 준비
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
    
    console.log('Index 데이터:', JSON.stringify(indexData));
    
    indexSheet.appendRow(indexData);
    console.log('Index 행 추가 완료');
    
    // ===== 3) Type 시트 업데이트 (칩 정보) =====
    if (typeUpdates.length > 0) {
      const typeData = typeSheet.getDataRange().getValues();
      const playerColIndex = 1; // B열: Player
      const tableColIndex = 2;  // C열: Table
      const chipsColIndex = 4;  // E열: Chips
      const updatedAtColIndex = 5; // F열: UpdatedAt
      
      typeUpdates.forEach(update => {
        const rowIndex = typeData.findIndex((row, idx) => {
          return idx > 0 && 
                 row[playerColIndex] === update.player &&
                 row[tableColIndex] === update.table;
        });
        
        if (rowIndex > 0) {
          typeSheet.getRange(rowIndex + 1, chipsColIndex + 1).setValue(update.chips || '');
          const updateTime = update.updatedAt ? new Date(update.updatedAt) : new Date();
          typeSheet.getRange(rowIndex + 1, updatedAtColIndex + 1).setValue(updateTime);
          console.log(`Type 업데이트: ${update.player} - ${update.chips}`);
        }
      });
    }
    
    // 성공 응답
    return _json({
      status: 'success',
      handNumber: handNumber || indexMeta.handNumber || '',
      rowsAdded: rows.length,
      startRow: startRow,
      endRow: endRow,
      updatedAt: updatedAt,
      version: 'v54',
      message: 'PLAYER 행 형식 자동 수정 적용됨'
    });
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return _json({
      status: 'error',
      message: String(error && error.message || error),
      stack: String(error && error.stack || ''),
      version: 'v54'
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
      spreadsheetId: SHEET_ID,
      version: 'v54'
    };
  } catch (error) {
    console.error('연결 실패:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}

function testPlayerRowFix() {
  // 테스트 데이터: 잘못된 형식의 PLAYER 행
  const testRows = [
    [1, 'GAME', 'Test'],
    [2, 'HAND', '1234'],
    [3, 'PLAYER', 'Mike', 1, 0, 0, 100000, 95000, 'As Ac'],  // 잘못된 형식 (0 두개)
    [4, 'PLAYER', 'Jane', 2, 0, 200000, 180000, 'Kh Kd'],   // 올바른 형식
    [5, 'PLAYER', 'Bob', 3, 150000, 145000, 'Qc Qd'],       // 0 없음
    [6, 'EVENT', 'FOLD', 1]
  ];
  
  console.log('=== 테스트 시작 ===');
  console.log('원본 데이터:', JSON.stringify(testRows));
  
  const fixed = _fixPlayerRows(testRows);
  
  console.log('=== 수정 후 ===');
  for (const row of fixed) {
    if (row[1] === 'PLAYER') {
      console.log(JSON.stringify(row));
    }
  }
  
  return {
    original: testRows,
    fixed: fixed
  };
}

function testFullPipeline() {
  const testPayload = {
    rows: [
      [1, 'GAME', 'Test'],
      [2, 'HAND', '9999', 'epoch123'],
      [3, 'PLAYER', 'TestPlayer', 1, 0, 0, 500000, 480000, 'Ah Ad'],
      [4, 'EVENT', 'RAISES', 1, 10000]
    ],
    indexMeta: {
      handNumber: '9999',
      table: 'TestTable'
    }
  };
  
  console.log('테스트 페이로드:', JSON.stringify(testPayload));
  
  // doPost 시뮬레이션
  const e = {
    parameter: {
      payload: JSON.stringify(testPayload)
    }
  };
  
  const result = doPost(e);
  console.log('결과:', result.getContent());
  
  return JSON.parse(result.getContent());
}