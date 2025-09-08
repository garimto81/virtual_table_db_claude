/****************************************************
 * Type 시트 Status 열 초기화 - 1회용 스크립트
 * 
 * 실행 방법:
 * 1. Google Apps Script 편집기에서 이 코드 복사
 * 2. initializeStatusColumn() 함수 실행
 * 3. 실행 완료 후 이 파일 삭제 가능
 ****************************************************/

const SHEET_ID = '1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U';

/**
 * 🚀 메인 초기화 함수 - Status 열 추가 및 기본값 설정
 */
function initializeStatusColumn() {
  console.log('========================================');
  console.log('Status 열 초기화 시작');
  console.log('========================================');
  
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName('Type');
    
    if (!sheet) {
      console.error('❌ Type 시트를 찾을 수 없습니다');
      return {success: false, message: 'Type 시트를 찾을 수 없습니다'};
    }
    
    // 현재 데이터 범위 확인
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    console.log(`📊 현재 Type 시트: ${lastRow}행 × ${lastCol}열`);
    
    // 헤더 확인
    let headers = [];
    if (lastRow > 0) {
      headers = sheet.getRange(1, 1, 1, Math.max(8, lastCol)).getValues()[0];
    }
    
    // H열(8번째 열)에 Status 헤더 추가
    if (headers[7] !== 'Status') {
      console.log('📝 H열에 Status 헤더 추가 중...');
      sheet.getRange(1, 8).setValue('Status');
      
      // 헤더 스타일 적용
      sheet.getRange(1, 8)
        .setBackground('#1a1a1a')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      
      console.log('✅ Status 헤더 추가 완료');
    } else {
      console.log('ℹ️ Status 헤더가 이미 존재합니다');
    }
    
    // 기존 데이터에 IN/OUT 기본값 설정
    if (lastRow > 1) {
      console.log(`🔄 ${lastRow - 1}개 행에 Status 값 설정 중...`);
      
      const dataRange = sheet.getRange(2, 1, lastRow - 1, 8);
      const data = dataRange.getValues();
      
      let inCount = 0;
      let outCount = 0;
      let updatedCount = 0;
      
      for (let i = 0; i < data.length; i++) {
        const chips = data[i][4]; // E열: Chips
        const currentStatus = data[i][7]; // H열: 현재 Status
        
        // Status가 비어있거나 IN/OUT이 아닌 경우만 업데이트
        if (!currentStatus || (currentStatus !== 'IN' && currentStatus !== 'OUT')) {
          // 칩이 0보다 크면 IN, 0이하면 OUT
          const newStatus = (chips > 0) ? 'IN' : 'OUT';
          data[i][7] = newStatus;
          
          if (newStatus === 'IN') inCount++;
          else outCount++;
          updatedCount++;
        } else {
          // 이미 IN/OUT 값이 있는 경우 유지
          if (currentStatus === 'IN') inCount++;
          else if (currentStatus === 'OUT') outCount++;
        }
      }
      
      // 변경사항 저장
      if (updatedCount > 0) {
        dataRange.setValues(data);
        console.log(`✅ ${updatedCount}개 행 업데이트 완료`);
      }
      
      console.log(`📊 Status 통계:`);
      console.log(`  - IN: ${inCount}명`);
      console.log(`  - OUT: ${outCount}명`);
      console.log(`  - 총: ${inCount + outCount}명`);
      
    } else {
      console.log('ℹ️ 데이터가 없어서 Status 설정을 건너뜁니다');
    }
    
    // 열 너비 조정
    sheet.setColumnWidth(8, 80);
    
    console.log('\n========================================');
    console.log('🎉 Status 열 초기화 완료!');
    console.log('========================================');
    console.log('\n다음 단계:');
    console.log('1. Code_v59_InOut.gs를 Google Apps Script에 복사');
    console.log('2. 웹 앱 재배포');
    console.log('3. 이 초기화 스크립트는 삭제 가능');
    
    return {
      success: true,
      message: 'Status 열 초기화 완료',
      stats: {
        totalRows: lastRow - 1,
        inCount: inCount,
        outCount: outCount
      }
    };
    
  } catch (error) {
    console.error('❌ 초기화 실패:', error);
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * 기존 Status 값을 IN/OUT으로 변환 (이미 다른 값이 있는 경우)
 */
function convertExistingStatus() {
  console.log('========================================');
  console.log('기존 Status 값 변환 시작');
  console.log('========================================');
  
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName('Type');
    
    if (!sheet) {
      console.error('❌ Type 시트를 찾을 수 없습니다');
      return;
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      console.log('ℹ️ 변환할 데이터가 없습니다');
      return;
    }
    
    const statusRange = sheet.getRange(2, 8, lastRow - 1, 1);
    const statusValues = statusRange.getValues();
    const chipsRange = sheet.getRange(2, 5, lastRow - 1, 1);
    const chipsValues = chipsRange.getValues();
    
    let convertCount = 0;
    const conversionMap = {
      'ACTIVE': 'IN',
      'AWAY': 'IN',      // 자리비움도 IN으로
      'BREAK': 'IN',     // 휴식도 IN으로
      'OUT': 'OUT',
      'BUSTED': 'OUT',
      '': ''             // 빈 값은 그대로
    };
    
    for (let i = 0; i < statusValues.length; i++) {
      const currentStatus = statusValues[i][0];
      let newStatus = conversionMap[currentStatus];
      
      // 매핑되지 않은 값이나 빈 값은 칩으로 판단
      if (newStatus === undefined || newStatus === '') {
        newStatus = (chipsValues[i][0] > 0) ? 'IN' : 'OUT';
        convertCount++;
      } else if (currentStatus !== newStatus) {
        convertCount++;
      }
      
      statusValues[i][0] = newStatus;
    }
    
    if (convertCount > 0) {
      statusRange.setValues(statusValues);
      console.log(`✅ ${convertCount}개 Status 값 변환 완료`);
    } else {
      console.log('ℹ️ 변환할 Status 값이 없습니다');
    }
    
    // 최종 통계
    let inCount = 0;
    let outCount = 0;
    statusValues.forEach(row => {
      if (row[0] === 'IN') inCount++;
      else if (row[0] === 'OUT') outCount++;
    });
    
    console.log(`\n📊 최종 Status 통계:`);
    console.log(`  - IN: ${inCount}명`);
    console.log(`  - OUT: ${outCount}명`);
    
    console.log('\n========================================');
    console.log('🎉 Status 변환 완료!');
    console.log('========================================');
    
  } catch (error) {
    console.error('❌ 변환 실패:', error);
  }
}

/**
 * 현재 Status 상태 확인
 */
function checkStatusColumn() {
  console.log('========================================');
  console.log('Type 시트 Status 열 상태 확인');
  console.log('========================================');
  
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName('Type');
    
    if (!sheet) {
      console.error('❌ Type 시트를 찾을 수 없습니다');
      return;
    }
    
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    console.log(`📊 Type 시트: ${lastRow}행 × ${lastCol}열`);
    
    // 헤더 확인
    if (lastRow > 0) {
      const headers = sheet.getRange(1, 1, 1, Math.min(lastCol, 8)).getValues()[0];
      console.log('\n📋 헤더 구조:');
      headers.forEach((header, index) => {
        const colLetter = String.fromCharCode(65 + index); // A, B, C...
        console.log(`  ${colLetter}열: ${header || '(비어있음)'}`);
      });
    }
    
    // Status 열 데이터 확인
    if (lastRow > 1 && lastCol >= 8) {
      const statusData = sheet.getRange(2, 8, Math.min(10, lastRow - 1), 1).getValues();
      const statusCounts = {};
      
      sheet.getRange(2, 8, lastRow - 1, 1).getValues().forEach(row => {
        const status = row[0] || '(빈값)';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      console.log('\n📊 Status 값 분포:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}개`);
      });
      
      console.log('\n📝 샘플 데이터 (최대 5행):');
      const sampleData = sheet.getRange(2, 2, Math.min(5, lastRow - 1), 7).getValues();
      sampleData.forEach((row, index) => {
        console.log(`  ${index + 2}행: ${row[0]} | ${row[1]} | 칩:${row[3]} | Status:${statusData[index][0] || '(빈값)'}`);
      });
    }
    
    console.log('\n========================================');
    
  } catch (error) {
    console.error('❌ 상태 확인 실패:', error);
  }
}

/**
 * OUT 상태 플레이어 정리 (선택사항)
 */
function cleanupOutPlayers(daysToKeep = 7) {
  console.log('========================================');
  console.log(`OUT 상태 플레이어 정리 (${daysToKeep}일 이상 경과)`);
  console.log('========================================');
  
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName('Type');
    
    if (!sheet) {
      console.error('❌ Type 시트를 찾을 수 없습니다');
      return;
    }
    
    const data = sheet.getDataRange().getValues();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    let deletedCount = 0;
    const rowsToDelete = [];
    
    // 삭제할 행 찾기
    for (let i = data.length - 1; i >= 1; i--) {
      const status = data[i][7]; // H열: Status
      const updatedAt = data[i][5]; // F열: UpdatedAt
      
      if (status === 'OUT' && updatedAt) {
        const updateDate = new Date(updatedAt);
        if (updateDate < cutoffDate) {
          rowsToDelete.push({
            row: i + 1,
            player: data[i][1],
            table: data[i][2],
            date: updateDate.toLocaleDateString()
          });
        }
      }
    }
    
    if (rowsToDelete.length > 0) {
      console.log(`🗑️ 삭제 예정 ${rowsToDelete.length}개 행:`);
      rowsToDelete.forEach(item => {
        console.log(`  - ${item.player} (${item.table}) - ${item.date}`);
      });
      
      // 확인 후 삭제 (실제로 삭제하려면 주석 해제)
      /*
      rowsToDelete.forEach(item => {
        sheet.deleteRow(item.row);
        deletedCount++;
      });
      console.log(`✅ ${deletedCount}개 행 삭제 완료`);
      */
      
      console.log('\n⚠️ 실제로 삭제하려면 코드에서 주석을 해제하세요');
    } else {
      console.log('ℹ️ 삭제할 OUT 플레이어가 없습니다');
    }
    
    console.log('\n========================================');
    
  } catch (error) {
    console.error('❌ 정리 실패:', error);
  }
}