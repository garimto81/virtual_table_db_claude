/****************************************************
 * Virtual Table Sheet Updater - Apps Script v1.0
 * 
 * 기능:
 * - Virtual 시트의 F열(파일명), H열(AI분석) 업데이트
 * - B열 시간 기준으로 매칭된 행에 데이터 업데이트
 * - CORS 정책 우회를 통한 안전한 시트 접근
 ****************************************************/

// ===== 메인 핸들러 =====

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    method: 'GET',
    time: new Date().toISOString(),
    version: 'v1.0',
    service: 'Virtual Table Sheet Updater'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    console.log('📥 Sheet Updater POST 요청 수신:', e);
    
    const body = _parseRequestBody(e) || {};
    console.log('📋 파싱된 요청 데이터:', JSON.stringify(body));
    
    // 빈 요청 체크
    if (!body || Object.keys(body).length === 0) {
      return _json({
        status: 'error',
        message: '요청 데이터가 비어있습니다',
        received: JSON.stringify(e.parameter || {})
      });
    }
    
    const action = body.action;
    
    if (action === 'updateSheet') {
      return handleSheetUpdate(body);
    } else {
      return _json({
        status: 'error',
        message: `지원되지 않는 액션: ${action}`
      });
    }
    
  } catch (error) {
    console.error('❌ doPost 오류:', error);
    return _json({
      status: 'error',
      message: String(error && error.message || error),
      stack: String(error && error.stack || '')
    });
  }
}

// ===== 시트 업데이트 핸들러 =====

function handleSheetUpdate(data) {
  try {
    console.log('🔄 시트 업데이트 시작...');
    
    const {
      sheetUrl,
      rowNumber,
      handNumber,
      filename,
      aiAnalysis,
      timestamp
    } = data;
    
    // 필수 데이터 검증
    if (!sheetUrl) {
      throw new Error('시트 URL이 필요합니다');
    }
    
    if (!rowNumber || isNaN(parseInt(rowNumber))) {
      throw new Error('유효한 행 번호가 필요합니다');
    }
    
    if (!filename || !filename.trim()) {
      throw new Error('파일명이 필요합니다');
    }
    
    console.log(`📊 업데이트 정보:
      - 시트 URL: ${sheetUrl}
      - 행 번호: ${rowNumber}
      - 핸드 번호: ${handNumber}
      - 파일명: ${filename}
      - AI 분석: ${aiAnalysis}`);
    
    // 시트 ID 추출
    const sheetId = _extractSheetId(sheetUrl);
    if (!sheetId) {
      throw new Error('시트 URL에서 ID를 추출할 수 없습니다');
    }
    
    const gid = _extractGid(sheetUrl) || '0';
    console.log(`🔗 시트 ID: ${sheetId}, GID: ${gid}`);
    
    // 스프레드시트 열기
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const sheet = gid === '0' ? 
      spreadsheet.getSheets()[0] : 
      spreadsheet.getSheets().find(s => s.getSheetId() == gid);
    
    if (!sheet) {
      throw new Error(`GID ${gid}에 해당하는 시트를 찾을 수 없습니다`);
    }
    
    console.log(`📋 시트 이름: "${sheet.getName()}"`);
    
    const targetRow = parseInt(rowNumber);
    const maxRow = sheet.getLastRow();
    
    if (targetRow > maxRow) {
      throw new Error(`대상 행 ${targetRow}이 시트 범위(최대 ${maxRow}행)를 초과합니다`);
    }
    
    // F열(6)에 파일명 업데이트
    sheet.getRange(targetRow, 6).setValue(filename);
    console.log(`✅ F${targetRow} 파일명 업데이트: "${filename}"`);
    
    // H열(8)에 AI 분석 업데이트
    sheet.getRange(targetRow, 8).setValue(aiAnalysis || '분석 실패');
    console.log(`✅ H${targetRow} AI 분석 업데이트: "${aiAnalysis}"`);
    
    // 업데이트 시간을 I열(9)에 기록 (선택사항)
    const updateTime = new Date();
    sheet.getRange(targetRow, 9).setValue(updateTime);
    console.log(`✅ I${targetRow} 업데이트 시간: ${updateTime}`);
    
    console.log('✅ 시트 업데이트 완료!');
    
    return _json({
      status: 'success',
      message: '시트 업데이트 완료',
      data: {
        sheetName: sheet.getName(),
        rowNumber: targetRow,
        filename: filename,
        aiAnalysis: aiAnalysis,
        updatedAt: updateTime.toISOString(),
        handNumber: handNumber
      }
    });
    
  } catch (error) {
    console.error('❌ 시트 업데이트 오류:', error);
    return _json({
      status: 'error',
      message: `시트 업데이트 실패: ${error.message}`,
      stack: error.stack
    });
  }
}

// ===== 유틸리티 함수 =====

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _parseRequestBody(e) {
  // 1) form-urlencoded / multipart 방식
  if (e && e.parameter && typeof e.parameter.payload === 'string') {
    try {
      return JSON.parse(e.parameter.payload);
    } catch (err) {
      console.error('payload 파싱 실패:', err);
      return {};
    }
  }
  
  // 2) application/json 방식
  if (e && e.postData && e.postData.type && 
      e.postData.type.indexOf('application/json') !== -1) {
    try {
      return JSON.parse(e.postData.contents || '{}');
    } catch (err) {
      console.error('JSON 파싱 실패:', err);
      return {};
    }
  }
  
  return {};
}

function _extractSheetId(url) {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

function _extractGid(url) {
  const match = url.match(/gid=(\d+)/);
  return match ? match[1] : null;
}

// ===== 테스트 함수 =====

function testSheetUpdate() {
  const testData = {
    action: 'updateSheet',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1M-LM2KkwLNOTygtrPVdnYLqqBoz4MmZvbglUaptSYqE/edit?gid=561799849#gid=561799849',
    rowNumber: 2,
    handNumber: 'TEST_001',
    filename: 'test_hand_001.mp4',
    aiAnalysis: '테스트 분석 결과 - 성공',
    timestamp: new Date().toISOString()
  };
  
  console.log('🧪 시트 업데이트 테스트 시작...');
  const result = handleSheetUpdate(testData);
  console.log('🧪 테스트 결과:', result.getContent());
  
  return JSON.parse(result.getContent());
}

function testConnection() {
  try {
    console.log('🧪 연결 테스트 시작...');
    
    const testSheetId = '1M-LM2KkwLNOTygtrPVdnYLqqBoz4MmZvbglUaptSYqE';
    const spreadsheet = SpreadsheetApp.openById(testSheetId);
    const sheet = spreadsheet.getSheets()[0];
    
    console.log(`✅ 시트 연결 성공: "${sheet.getName()}" (${sheet.getLastRow()}행)`);
    
    return {
      status: 'success',
      sheetName: sheet.getName(),
      lastRow: sheet.getLastRow(),
      lastColumn: sheet.getLastColumn()
    };
    
  } catch (error) {
    console.error('❌ 연결 테스트 실패:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}