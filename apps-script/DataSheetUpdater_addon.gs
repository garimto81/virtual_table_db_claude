/****************************************************
 * Data Sheet Updater Addon - 기존 앱스크립트에 추가할 함수들
 * 
 * 기능:
 * - Virtual_Table_Data 시트의 A열에서 핸드 번호 검색
 * - 해당 행의 E열에 파일명 업데이트
 * - 기존 v59 앱스크립트와 함께 사용
 ****************************************************/

// ===== 기존 앱스크립트에 추가할 함수 =====

/**
 * A열에서 핸드 번호를 검색하고 E열에 파일명을 업데이트하는 함수
 * 기존 updateHandEditStatus 함수와 유사한 구조로 작성
 */
function updateDataSheetFilename(handNumber, filename) {
  try {
    console.log(`🔍 데이터 시트에서 핸드 번호 ${handNumber} 검색 시작`);
    
    const spreadsheet = _open();
    const indexSheet = spreadsheet.getSheetByName('Index');
    
    if (!indexSheet) {
      throw new Error('Index 시트를 찾을 수 없습니다');
    }
    
    const data = indexSheet.getDataRange().getValues();
    console.log(`📊 Index 시트 데이터: ${data.length}개 행`);
    
    // A열에서 핸드 번호 검색
    let foundRow = -1;
    for (let i = 1; i < data.length; i++) { // 헤더 제외
      const cellValue = data[i][0]; // A열 (인덱스 0)
      
      // 핸드 번호 매칭 (부분 일치 또는 정확 일치)
      if (cellValue && cellValue.toString().includes(handNumber.toString())) {
        foundRow = i + 1; // 1-based row number
        console.log(`✅ 핸드 번호 발견: 행 ${foundRow}, A열 값: "${cellValue}"`);
        break;
      }
    }
    
    if (foundRow === -1) {
      throw new Error(`핸드 번호 ${handNumber}를 A열에서 찾을 수 없습니다`);
    }
    
    // E열에 파일명 업데이트 (E열은 5번째 열)
    const targetRange = indexSheet.getRange(foundRow, 5);
    targetRange.setValue(filename);
    
    // 업데이트 시간도 기록 (F열)
    const timeRange = indexSheet.getRange(foundRow, 6);
    timeRange.setValue(new Date());
    
    console.log(`📝 E열 업데이트 완료: 행 ${foundRow}, 파일명: "${filename}"`);
    
    return {
      success: true,
      handNumber: handNumber,
      filename: filename,
      rowNumber: foundRow,
      updatedAt: new Date().toISOString(),
      message: `데이터 시트 행 ${foundRow} E열 업데이트 완료`
    };
    
  } catch (error) {
    console.error('❌ 데이터 시트 파일명 업데이트 실패:', error);
    return {
      success: false,
      handNumber: handNumber,
      filename: filename,
      message: error.message,
      error: error.toString()
    };
  }
}

/**
 * doPost 함수에 추가할 액션 핸들러
 * 기존 doPost의 switch 문에 다음 case를 추가:
 * 
 * case 'updateDataSheetFilename':
 *   return _json(updateDataSheetFilename(body.handNumber, body.filename));
 */

// ===== 연동 테스트 함수 =====

function testDataSheetUpdate() {
  console.log('=== 데이터 시트 업데이트 테스트 ===');
  
  // 테스트용 핸드 번호와 파일명
  const testHandNumber = '001'; // 실제 데이터에 맞게 수정 필요
  const testFilename = 'test_hand_001.mp4';
  
  const result = updateDataSheetFilename(testHandNumber, testFilename);
  console.log('테스트 결과:', JSON.stringify(result, null, 2));
  
  console.log('=== 테스트 완료 ===');
}

/**
 * 기존 앱스크립트 수정 가이드:
 * 
 * 1. doPost 함수의 switch 문에 다음 case 추가:
 * 
 *    case 'updateDataSheetFilename':
 *      return _json(updateDataSheetFilename(body.handNumber, body.filename));
 * 
 * 2. 위의 updateDataSheetFilename 함수를 기존 코드에 복사
 * 
 * 3. doGet 함수의 features 배열에 'Data Sheet Filename Update' 추가
 */