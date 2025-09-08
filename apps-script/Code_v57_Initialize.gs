/****************************************************
 * Poker Hand Logger - 초기화 전용 스크립트
 * 1회만 실행하여 테이블 관리 시스템 초기화
 * 
 * 실행 방법:
 * 1. Google Apps Script 편집기 열기
 * 2. 이 코드를 새 파일에 복사
 * 3. INIT_SHEET_ID를 본인의 스프레드시트 ID로 수정
 * 4. setupTableManagementSystem 함수 실행
 * 5. 실행 완료 후 이 파일은 삭제 가능
 ****************************************************/

// ⚠️ 여기에 본인의 스프레드시트 ID를 입력하세요
const INIT_SHEET_ID = '1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U';

/**
 * 🚀 메인 초기화 함수 - 이것만 실행하면 됩니다!
 */
function setupTableManagementSystem() {
  console.log('========================================');
  console.log('테이블 관리 시스템 초기화 시작');
  console.log('========================================');
  
  try {
    // 1단계: 시트 생성
    console.log('\n📁 1단계: 필요한 시트 생성 중...');
    const sheetsResult = createRequiredSheets();
    console.log(sheetsResult.message);
    
    // 2단계: 기존 데이터 마이그레이션
    console.log('\n📊 2단계: 기존 데이터 마이그레이션 중...');
    const migrationResult = migrateExistingData();
    console.log(migrationResult.message);
    
    // 3단계: 시스템 검증
    console.log('\n✅ 3단계: 시스템 검증 중...');
    const validationResult = validateSystem();
    console.log(validationResult.message);
    
    // 완료 보고서
    console.log('\n========================================');
    console.log('🎉 초기화 완료!');
    console.log('========================================');
    console.log('\n📋 초기화 결과:');
    console.log(`- Tables 시트: ${sheetsResult.tables ? '✅' : '❌'}`);
    console.log(`- Players 시트: ${sheetsResult.players ? '✅' : '❌'}`);
    console.log(`- TablePlayers 시트: ${sheetsResult.tablePlayers ? '✅' : '❌'}`);
    console.log(`- 마이그레이션된 테이블: ${migrationResult.tablesCount}개`);
    console.log(`- 마이그레이션된 플레이어: ${migrationResult.playersCount}개`);
    console.log('\n다음 단계:');
    console.log('1. Code_v57_Production.gs를 Google Apps Script에 복사');
    console.log('2. 웹 앱으로 배포');
    console.log('3. 웹사이트에서 "관리" 버튼 테스트');
    
    return {
      success: true,
      sheets: sheetsResult,
      migration: migrationResult,
      validation: validationResult
    };
    
  } catch (error) {
    console.error('\n❌ 초기화 실패:', error.message);
    console.error('스택 트레이스:', error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 필요한 시트들을 생성합니다
 */
function createRequiredSheets() {
  const ss = SpreadsheetApp.openById(INIT_SHEET_ID);
  const results = {
    tables: false,
    players: false,
    tablePlayers: false,
    message: ''
  };
  
  // Tables 시트 생성
  let tablesSheet = ss.getSheetByName('Tables');
  if (!tablesSheet) {
    tablesSheet = ss.insertSheet('Tables');
    tablesSheet.getRange(1, 1, 1, 7).setValues([
      ['TableID', 'TableName', 'Stakes', 'MaxPlayers', 'CreatedAt', 'UpdatedAt', 'Active']
    ]);
    // 헤더 스타일링
    tablesSheet.getRange(1, 1, 1, 7)
      .setBackground('#1a1a1a')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    // 열 너비 조정
    tablesSheet.setColumnWidth(1, 300); // TableID
    tablesSheet.setColumnWidth(2, 200); // TableName
    tablesSheet.setColumnWidth(3, 100); // Stakes
    tablesSheet.setColumnWidth(4, 100); // MaxPlayers
    tablesSheet.setColumnWidth(5, 150); // CreatedAt
    tablesSheet.setColumnWidth(6, 150); // UpdatedAt
    tablesSheet.setColumnWidth(7, 80);  // Active
    
    console.log('  ✅ Tables 시트 생성됨');
    results.tables = true;
  } else {
    console.log('  ℹ️ Tables 시트가 이미 존재함');
    results.tables = true;
  }
  
  // Players 시트 생성
  let playersSheet = ss.getSheetByName('Players');
  if (!playersSheet) {
    playersSheet = ss.insertSheet('Players');
    playersSheet.getRange(1, 1, 1, 10).setValues([
      ['PlayerID', 'Name', 'Nickname', 'CurrentTable', 'CurrentChips', 'TotalBuyIn', 'Notable', 'LastSeen', 'CreatedAt', 'Notes']
    ]);
    // 헤더 스타일링
    playersSheet.getRange(1, 1, 1, 10)
      .setBackground('#1a1a1a')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    // 열 너비 조정
    playersSheet.setColumnWidth(1, 300); // PlayerID
    playersSheet.setColumnWidth(2, 150); // Name
    playersSheet.setColumnWidth(3, 150); // Nickname
    playersSheet.setColumnWidth(4, 200); // CurrentTable
    playersSheet.setColumnWidth(5, 120); // CurrentChips
    playersSheet.setColumnWidth(6, 120); // TotalBuyIn
    playersSheet.setColumnWidth(7, 80);  // Notable
    playersSheet.setColumnWidth(8, 150); // LastSeen
    playersSheet.setColumnWidth(9, 150); // CreatedAt
    playersSheet.setColumnWidth(10, 300); // Notes
    
    console.log('  ✅ Players 시트 생성됨');
    results.players = true;
  } else {
    console.log('  ℹ️ Players 시트가 이미 존재함');
    results.players = true;
  }
  
  // TablePlayers 시트 생성
  let tablePlayersSheet = ss.getSheetByName('TablePlayers');
  if (!tablePlayersSheet) {
    tablePlayersSheet = ss.insertSheet('TablePlayers');
    tablePlayersSheet.getRange(1, 1, 1, 8).setValues([
      ['TableID', 'PlayerID', 'SeatNumber', 'Chips', 'BuyIn', 'Status', 'JoinedAt', 'LeftAt']
    ]);
    // 헤더 스타일링
    tablePlayersSheet.getRange(1, 1, 1, 8)
      .setBackground('#1a1a1a')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    // 열 너비 조정
    tablePlayersSheet.setColumnWidth(1, 300); // TableID
    tablePlayersSheet.setColumnWidth(2, 300); // PlayerID
    tablePlayersSheet.setColumnWidth(3, 100); // SeatNumber
    tablePlayersSheet.setColumnWidth(4, 120); // Chips
    tablePlayersSheet.setColumnWidth(5, 120); // BuyIn
    tablePlayersSheet.setColumnWidth(6, 100); // Status
    tablePlayersSheet.setColumnWidth(7, 150); // JoinedAt
    tablePlayersSheet.setColumnWidth(8, 150); // LeftAt
    
    console.log('  ✅ TablePlayers 시트 생성됨');
    results.tablePlayers = true;
  } else {
    console.log('  ℹ️ TablePlayers 시트가 이미 존재함');
    results.tablePlayers = true;
  }
  
  results.message = '모든 필수 시트가 준비되었습니다.';
  return results;
}

/**
 * Type 시트에서 기존 데이터를 마이그레이션합니다
 */
function migrateExistingData() {
  const ss = SpreadsheetApp.openById(INIT_SHEET_ID);
  const typeSheet = ss.getSheetByName('Type');
  const tablesSheet = ss.getSheetByName('Tables');
  const playersSheet = ss.getSheetByName('Players');
  
  const results = {
    tablesCount: 0,
    playersCount: 0,
    message: ''
  };
  
  if (!typeSheet) {
    console.log('  ⚠️ Type 시트가 없어서 마이그레이션 건너뜀');
    results.message = 'Type 시트가 없습니다. 마이그레이션을 건너뜁니다.';
    return results;
  }
  
  const typeData = typeSheet.getDataRange().getValues();
  if (typeData.length <= 1) {
    console.log('  ℹ️ Type 시트에 데이터가 없음');
    results.message = 'Type 시트에 마이그레이션할 데이터가 없습니다.';
    return results;
  }
  
  // 테이블 마이그레이션
  console.log('  📌 테이블 데이터 마이그레이션 중...');
  const existingTables = new Map(); // TableName -> TableID
  const tablesData = tablesSheet.getDataRange().getValues();
  
  // 이미 있는 테이블 확인
  for (let i = 1; i < tablesData.length; i++) {
    existingTables.set(tablesData[i][1], tablesData[i][0]); // TableName -> TableID
  }
  
  // Type 시트에서 고유한 테이블 추출
  const uniqueTables = new Set();
  for (let i = 1; i < typeData.length; i++) {
    const tableName = typeData[i][2]; // C열: Table
    if (tableName && tableName !== '') {
      uniqueTables.add(tableName);
    }
  }
  
  // 새 테이블 추가
  const now = new Date().toISOString();
  uniqueTables.forEach(tableName => {
    if (!existingTables.has(tableName)) {
      const tableId = Utilities.getUuid();
      tablesSheet.appendRow([
        tableId,
        tableName,
        'No Limit',
        9,
        now,
        now,
        true
      ]);
      existingTables.set(tableName, tableId);
      results.tablesCount++;
      console.log(`    ✅ 테이블 추가: ${tableName}`);
    }
  });
  
  // 플레이어 마이그레이션
  console.log('  👥 플레이어 데이터 마이그레이션 중...');
  const playersData = playersSheet.getDataRange().getValues();
  const existingPlayers = new Set();
  
  // 이미 있는 플레이어 확인
  for (let i = 1; i < playersData.length; i++) {
    existingPlayers.add(playersData[i][1]); // Name
  }
  
  // Type 시트에서 플레이어 추가
  const playerMap = new Map(); // 중복 제거를 위한 Map (Name -> 최신 데이터)
  
  for (let i = 1; i < typeData.length; i++) {
    const playerName = typeData[i][1]; // B열: Player
    const tableName = typeData[i][2]; // C열: Table
    const notable = typeData[i][3]; // D열: Notable
    const chips = typeData[i][4]; // E열: Chips
    const updatedAt = typeData[i][5]; // F열: UpdatedAt
    
    if (playerName && playerName !== '') {
      // 같은 플레이어의 최신 정보만 유지
      if (!playerMap.has(playerName) || 
          (updatedAt && playerMap.get(playerName).updatedAt < updatedAt)) {
        playerMap.set(playerName, {
          name: playerName,
          table: tableName,
          notable: notable === true || notable === 'TRUE',
          chips: chips || 0,
          updatedAt: updatedAt || now
        });
      }
    }
  }
  
  // Players 시트에 추가
  playerMap.forEach((playerData, playerName) => {
    if (!existingPlayers.has(playerName)) {
      const playerId = Utilities.getUuid();
      playersSheet.appendRow([
        playerId,
        playerName,
        '', // Nickname (비워둠)
        playerData.table || '',
        playerData.chips,
        playerData.chips, // TotalBuyIn (초기값은 현재 칩과 동일)
        playerData.notable,
        playerData.updatedAt,
        now,
        '' // Notes
      ]);
      results.playersCount++;
      console.log(`    ✅ 플레이어 추가: ${playerName}`);
    }
  });
  
  results.message = `마이그레이션 완료: ${results.tablesCount}개 테이블, ${results.playersCount}명 플레이어`;
  return results;
}

/**
 * 시스템이 올바르게 설정되었는지 검증합니다
 */
function validateSystem() {
  const ss = SpreadsheetApp.openById(INIT_SHEET_ID);
  const errors = [];
  
  // 필수 시트 확인
  const requiredSheets = ['Tables', 'Players', 'TablePlayers', 'Type', 'Hand', 'Index'];
  const existingSheets = ss.getSheets().map(s => s.getName());
  
  requiredSheets.forEach(sheetName => {
    if (!existingSheets.includes(sheetName)) {
      errors.push(`❌ ${sheetName} 시트가 없습니다`);
    } else {
      console.log(`  ✅ ${sheetName} 시트 확인됨`);
    }
  });
  
  // 테이블 데이터 확인
  const tablesSheet = ss.getSheetByName('Tables');
  if (tablesSheet) {
    const tableCount = Math.max(0, tablesSheet.getLastRow() - 1);
    console.log(`  📊 Tables 시트: ${tableCount}개 테이블`);
  }
  
  // 플레이어 데이터 확인
  const playersSheet = ss.getSheetByName('Players');
  if (playersSheet) {
    const playerCount = Math.max(0, playersSheet.getLastRow() - 1);
    console.log(`  👥 Players 시트: ${playerCount}명 플레이어`);
  }
  
  if (errors.length > 0) {
    return {
      success: false,
      message: '검증 실패:\n' + errors.join('\n'),
      errors: errors
    };
  }
  
  return {
    success: true,
    message: '시스템 검증 완료: 모든 구성 요소가 정상입니다.',
    errors: []
  };
}

/**
 * 테스트 데이터를 생성합니다 (선택사항)
 */
function createTestData() {
  console.log('\n🧪 테스트 데이터 생성 중...');
  
  const ss = SpreadsheetApp.openById(INIT_SHEET_ID);
  const tablesSheet = ss.getSheetByName('Tables');
  const playersSheet = ss.getSheetByName('Players');
  
  if (!tablesSheet || !playersSheet) {
    console.error('필수 시트가 없습니다. setupTableManagementSystem을 먼저 실행하세요.');
    return;
  }
  
  const now = new Date().toISOString();
  
  // 테스트 테이블 생성
  const testTableId = Utilities.getUuid();
  tablesSheet.appendRow([
    testTableId,
    'Test Table 1',
    '1/2 NL',
    9,
    now,
    now,
    true
  ]);
  console.log('  ✅ 테스트 테이블 생성됨');
  
  // 테스트 플레이어 생성
  const testPlayers = [
    ['Player A', 'A군', true, 100000],
    ['Player B', 'B양', false, 50000],
    ['Player C', 'C씨', true, 200000]
  ];
  
  testPlayers.forEach(([name, nickname, notable, chips]) => {
    const playerId = Utilities.getUuid();
    playersSheet.appendRow([
      playerId,
      name,
      nickname,
      'Test Table 1',
      chips,
      chips,
      notable,
      now,
      now,
      '테스트 플레이어'
    ]);
    console.log(`  ✅ 테스트 플레이어 생성: ${name}`);
  });
  
  console.log('\n테스트 데이터 생성 완료!');
}

/**
 * 시스템 상태를 확인합니다
 */
function checkSystemStatus() {
  const ss = SpreadsheetApp.openById(INIT_SHEET_ID);
  
  console.log('\n========================================');
  console.log('시스템 상태 확인');
  console.log('========================================\n');
  
  // 시트 존재 여부
  console.log('📁 시트 상태:');
  const sheets = ['Tables', 'Players', 'TablePlayers', 'Type', 'Hand', 'Index'];
  sheets.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      const rowCount = sheet.getLastRow();
      const colCount = sheet.getLastColumn();
      console.log(`  ✅ ${sheetName}: ${rowCount}행 × ${colCount}열`);
    } else {
      console.log(`  ❌ ${sheetName}: 없음`);
    }
  });
  
  // 데이터 통계
  console.log('\n📊 데이터 통계:');
  
  const tablesSheet = ss.getSheetByName('Tables');
  if (tablesSheet && tablesSheet.getLastRow() > 1) {
    const tableData = tablesSheet.getDataRange().getValues();
    console.log(`  - 테이블: ${tableData.length - 1}개`);
    for (let i = 1; i < Math.min(6, tableData.length); i++) {
      console.log(`    ${i}. ${tableData[i][1]} (${tableData[i][2]})`);
    }
    if (tableData.length > 6) {
      console.log(`    ... 외 ${tableData.length - 6}개`);
    }
  }
  
  const playersSheet = ss.getSheetByName('Players');
  if (playersSheet && playersSheet.getLastRow() > 1) {
    const playerData = playersSheet.getDataRange().getValues();
    console.log(`  - 플레이어: ${playerData.length - 1}명`);
    for (let i = 1; i < Math.min(6, playerData.length); i++) {
      const notable = playerData[i][6] ? '⭐' : '';
      console.log(`    ${i}. ${playerData[i][1]} ${notable} (칩: ${playerData[i][4]})`);
    }
    if (playerData.length > 6) {
      console.log(`    ... 외 ${playerData.length - 6}명`);
    }
  }
  
  console.log('\n========================================');
}