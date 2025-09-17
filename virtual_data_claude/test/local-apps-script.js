/**
 * 로컬 테스트용 Apps Script 코드 (Code_v62_InOut.gs 기반)
 * Mock 환경에서 실행 가능하도록 수정
 */

// Mock 환경에서 SHEET_ID 설정
const SHEET_ID = 'mock-spreadsheet-id';

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
  // FormData 방식 - e.parameter에 직접 접근
  if (e && e.parameter) {
    // payload가 있으면 payload 파싱 시도 (구버전 호환)
    if (e.parameter.payload) {
      try {
        return JSON.parse(e.parameter.payload);
      } catch (err) {
        console.error('Payload 파싱 실패:', err);
      }
    }
    // FormData로 전송된 경우 parameter 직접 반환
    return e.parameter;
  }

  // JSON Body 방식
  if (e && e.postData && e.postData.type === 'application/json') {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      console.error('JSON 파싱 실패:', err);
    }
  }

  return {};
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

// 일괄 업데이트 함수
function batchUpdatePlayers(tableName, playersJson, deletedJson) {
  try {
    const sheet = _open().getSheetByName('Type');
    const players = typeof playersJson === 'string' ? JSON.parse(playersJson) : playersJson;
    const deleted = typeof deletedJson === 'string' ? JSON.parse(deletedJson) : deletedJson;

    console.log(`[batchUpdate 시작] 테이블: ${tableName}`);
    console.log(`[batchUpdate] 플레이어: ${JSON.stringify(players)}`);
    console.log(`[batchUpdate] 삭제 대상: ${JSON.stringify(deleted)}`);

    if (!sheet) return {success: false, message: 'Type 시트를 찾을 수 없습니다'};

    const data = sheet.getDataRange().getValues();
    const now = new Date();
    const rowsToDelete = [];

    console.log(`[시트 데이터] 총 ${data.length}개 행`);

    // 1. 삭제 처리 - 실제 행 삭제 (조건 완화)
    for (const playerName of deleted) {
      console.log(`[삭제 검색] ${playerName} in ${tableName}`);

      for (let i = 1; i < data.length; i++) {
        const rowData = data[i];
        const rowPlayer = rowData[TYPE_COLUMNS.PLAYER];
        const rowTable = rowData[TYPE_COLUMNS.TABLE];
        const rowStatus = rowData[TYPE_COLUMNS.STATUS];

        console.log(`[삭제 비교] Row ${i + 1}: ${rowPlayer} | ${rowTable} | ${rowStatus}`);

        // 조건 완화: 이름과 테이블만 매칭 (STATUS 조건 제거)
        if (rowPlayer === playerName && rowTable === tableName) {
          rowsToDelete.push(i + 1); // 1-based row number
          console.log(`[삭제 대상 선정] ${playerName} - Row ${i + 1}`);
          break;
        }
      }
    }

    // 삭제할 행들을 내림차순으로 정렬하여 삭제 (인덱스 변경 방지)
    rowsToDelete.sort((a, b) => b - a);

    for (const rowIndex of rowsToDelete) {
      console.log(`[행 삭제] Row ${rowIndex}`);
      sheet.deleteRow(rowIndex);
    }

    console.log(`[삭제 완료] ${rowsToDelete.length}개 행 삭제됨`);

    // 데이터 재로드 (삭제 후)
    const updatedData = sheet.getDataRange().getValues();

    // 2. 업데이트 및 추가 처리
    for (const player of players) {
      let found = false;

      // 기존 플레이어 찾기 (업데이트된 데이터 사용)
      for (let i = 1; i < updatedData.length; i++) {
        if (updatedData[i][TYPE_COLUMNS.PLAYER] === player.name &&
            updatedData[i][TYPE_COLUMNS.TABLE] === tableName &&
            updatedData[i][TYPE_COLUMNS.STATUS] === 'IN') {
          // 업데이트
          const row = i + 1;
          sheet.getRange(row, RANGE_COLUMNS.SEAT).setValue(player.seat || '');
          sheet.getRange(row, RANGE_COLUMNS.CHIPS).setValue(player.chips || 0);
          sheet.getRange(row, RANGE_COLUMNS.UPDATED_AT).setValue(now);
          console.log(`[업데이트] ${player.name} - Row ${row}`);
          found = true;
          break;
        }
      }

      // 새 플레이어 추가
      if (!found) {
        const newRow = sheet.getLastRow() + 1;
        sheet.getRange(newRow, RANGE_COLUMNS.CAMERA).setValue('');
        sheet.getRange(newRow, RANGE_COLUMNS.PLAYER).setValue(player.name);
        sheet.getRange(newRow, RANGE_COLUMNS.TABLE).setValue(tableName);
        sheet.getRange(newRow, RANGE_COLUMNS.NOTABLE).setValue(player.notable ? 'TRUE' : 'FALSE');
        sheet.getRange(newRow, RANGE_COLUMNS.CHIPS).setValue(player.chips || 0);
        sheet.getRange(newRow, RANGE_COLUMNS.UPDATED_AT).setValue(now);
        sheet.getRange(newRow, RANGE_COLUMNS.SEAT).setValue(player.seat || '');
        sheet.getRange(newRow, RANGE_COLUMNS.STATUS).setValue('IN');
        console.log(`[추가] ${player.name} - Row ${newRow}`);
      }
    }

    // 3. 시트 정렬 수행
    const sortResult = sortTypeSheet();
    console.log(`[정렬 결과] ${sortResult ? '성공' : '실패'}`);

    const result = {
      success: true,
      message: '일괄 업데이트, 삭제 및 정렬 완료',
      processed: {
        updated: players.length,
        deleted: deleted.length,
        deletedRows: rowsToDelete.length
      }
    };

    console.log(`[batchUpdate 완료] ${JSON.stringify(result)}`);
    return result;
  } catch (error) {
    console.error(`[batchUpdate 오류] ${error.toString()}`);
    console.error(`[batchUpdate 오류] Stack: ${error.stack}`);
    return {
      success: false,
      message: `오류: ${error.toString()}`,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    };
  }
}

// Type 시트 정렬 함수
function sortTypeSheet() {
  try {
    const sheet = _open().getSheetByName('Type');
    if (!sheet) return false;

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    // 헤더 행을 제외한 데이터 범위
    if (lastRow > 1) {
      const range = sheet.getRange(2, 1, lastRow - 1, lastCol);

      // 정렬 기준:
      // 1순위: Table (C열 = 3) - 오름차순
      // 2순위: Seat (G열 = 7) - 오름차순

      range.sort([
        {column: 3, ascending: true},  // Table: 오름차순
        {column: 7, ascending: true}   // Seat: 오름차순
      ]);
    }

    return true;
  } catch (error) {
    console.error('sortTypeSheet error:', error);
    return false;
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

// 테스트용 함수
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

  console.log('=== 테스트 완료 ===');
}

// 로컬 테스트용 함수들 내보내기
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getTableList,
    getPlayersByTable,
    upsertPlayer,
    batchUpdatePlayers,
    sortTypeSheet,
    deletePlayer,
    addPlayer,
    testInOutSystem,
    TYPE_COLUMNS,
    RANGE_COLUMNS
  };
}