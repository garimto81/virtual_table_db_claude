// Virtual Table DB - Google Apps Script 완전판 v13.5.10
// updateSheet 액션 포함 + CORS 문제 해결 + G열 업데이트 지원

// ========================================
// 1. 기본 설정
// ========================================
const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// ========================================
// 2. CORS 응답 생성
// ========================================
function createCorsResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// 3. HTTP 메소드 핸들러
// ========================================

// GET 요청 처리
function doGet(e) {
  console.log('📥 GET 요청 수신:', JSON.stringify(e));

  const response = {
    status: 'ok',
    method: 'GET',
    time: new Date().toISOString(),
    version: 'v13.5.10',
    service: 'Virtual Table Sheet Updater',
    features: ['Sheet Update', 'Gemini AI Analysis', 'CORS Support', 'G Column Update'],
    message: '서비스가 정상 작동 중입니다'
  };

  return createCorsResponse(response);
}

// POST 요청 처리
function doPost(e) {
  console.log('📥 POST 요청 수신');

  try {
    let requestData = {};

    // Content-Type에 따른 파싱
    if (e.postData && e.postData.type === 'application/json') {
      requestData = JSON.parse(e.postData.contents);
    } else if (e.postData && e.postData.type === 'text/plain') {
      try {
        requestData = JSON.parse(e.postData.contents);
      } catch (error) {
        requestData = { raw: e.postData.contents };
      }
    } else if (e.parameter) {
      requestData = e.parameter;
    } else if (e.postData && e.postData.contents) {
      try {
        requestData = JSON.parse(e.postData.contents);
      } catch {
        requestData = { raw: e.postData.contents };
      }
    }

    console.log('📋 파싱된 데이터:', JSON.stringify(requestData));
    console.log('📋 action 필드:', requestData.action);

    // 액션 라우팅
    const action = requestData.action || 'unknown';
    let result;

    switch(action) {
      case 'updateSheet':
        result = handleSheetUpdate(requestData);
        break;

      case 'updateHand':
        result = handleHandUpdate(requestData);
        break;

      case 'analyzeHand':
        result = handleHandAnalysis(requestData);
        break;

      case 'updateIndex':
        result = handleIndexUpdate(requestData);
        break;

      case 'batchVerify':
        result = handleBatchVerify(requestData);
        break;

      case 'verifyUpdate':
        result = handleVerifyUpdate(requestData);
        break;

      case 'getHandStatus':
        result = handleGetHandStatus(requestData);
        break;

      case 'test':
        result = {
          status: 'success',
          message: 'Apps Script 연결 성공!',
          timestamp: new Date().toISOString(),
          version: 'v13.5.10',
          receivedData: requestData
        };
        break;

      default:
        result = {
          status: 'error',
          message: `알 수 없는 액션: ${action}`,
          availableActions: ['updateSheet', 'updateHand', 'analyzeHand', 'updateIndex', 'batchVerify', 'verifyUpdate', 'getHandStatus', 'test'],
          receivedAction: action,
          receivedData: requestData
        };
    }

    return createCorsResponse(result);

  } catch (error) {
    console.error('❌ POST 처리 오류:', error);
    return createCorsResponse({
      status: 'error',
      message: error.toString(),
      stack: error.stack
    });
  }
}

// ========================================
// 4. 시트 업데이트 핸들러
// ========================================
function handleSheetUpdate(data) {
  console.log('🔄 시트 업데이트 시작...');

  try {
    const {
      sheetUrl,
      rowNumber,
      handNumber,
      filename,
      gColumnValue,
      aiAnalysis,
      subtitle,
      timestamp,
      indexSheetUrl,
      status
    } = data;

    // 필수 데이터 검증
    if (!sheetUrl) {
      return {
        status: 'error',
        message: '시트 URL이 필요합니다'
      };
    }

    if (!rowNumber || isNaN(parseInt(rowNumber))) {
      return {
        status: 'error',
        message: '유효한 행 번호가 필요합니다'
      };
    }

    if (!filename || !filename.trim()) {
      return {
        status: 'error',
        message: '파일명이 필요합니다'
      };
    }

    console.log(`📊 업데이트 정보:
      - 시트 URL: ${sheetUrl}
      - 행 번호: ${rowNumber}
      - 핸드 번호: ${handNumber}
      - 파일명: ${filename}
      - G열 값: ${gColumnValue || '없음'}
      - 자막: ${subtitle || '없음'}
      - 상태: ${status}`);

    // 시트 열기
    const sheet = openSheetByUrl(sheetUrl);
    if (!sheet) {
      return {
        status: 'error',
        message: '시트를 열 수 없습니다. URL과 권한을 확인하세요.'
      };
    }

    const targetRow = parseInt(rowNumber);
    console.log(`📋 시트 이름: "${sheet.getName()}", 대상 행: ${targetRow}`);

    // 최대 행 수 확인
    const maxRow = sheet.getMaxRows();
    if (targetRow > maxRow) {
      sheet.insertRowsAfter(maxRow, targetRow - maxRow);
      console.log(`📝 행 추가: ${targetRow - maxRow}개`);
    }

    // 데이터 업데이트
    const updates = [];
    const updateTime = new Date();

    try {
      // D열: 핸드 번호
      if (handNumber) {
        sheet.getRange(targetRow, 4).setValue(handNumber);
        updates.push('핸드번호(D열)');
      }

      // E열: 상태값 ('미완료' 또는 '복사완료')
      const statusValue = status || '미완료';
      sheet.getRange(targetRow, 5).setValue(statusValue);
      updates.push(`상태(E열): ${statusValue}`);

      // F열: 파일명
      sheet.getRange(targetRow, 6).setValue(filename);
      updates.push('파일명(F열)');

      // G열: gColumnValue (드롭다운 값)
      if (gColumnValue && gColumnValue.trim()) {
        sheet.getRange(targetRow, 7).setValue(gColumnValue);
        updates.push(`G열(${gColumnValue})`);
        console.log(`✅ G열 업데이트 완료: "${gColumnValue}"`);
      } else {
        console.log(`⚠️ G열 값 없음: "${gColumnValue}"`);
      }

      // H열: AI 분석
      if (aiAnalysis) {
        sheet.getRange(targetRow, 8).setValue(aiAnalysis);
        updates.push('AI분석(H열)');
      }

      // I열: 업데이트 시간
      sheet.getRange(targetRow, 9).setValue(updateTime);
      updates.push('업데이트시간(I열)');

      // J열: 자막 (subtitle)
      if (subtitle && subtitle.trim()) {
        sheet.getRange(targetRow, 10).setValue(subtitle);
        updates.push('자막(J열)');
        console.log(`✅ J열 자막 업데이트 완료: ${subtitle.substring(0, 50)}...`);
      } else {
        console.log(`⚠️ J열 자막 없음 또는 빈값: "${subtitle}"`);
      }

      // 변경사항 저장
      SpreadsheetApp.flush();

    } catch (cellError) {
      console.error('❌ 셀 업데이트 오류:', cellError);
      return {
        status: 'error',
        message: `셀 업데이트 실패: ${cellError.toString()}`,
        updates: updates
      };
    }

    console.log(`✅ 시트 업데이트 완료: ${updates.join(', ')}`);

    return {
      status: 'success',
      message: '시트 업데이트 완료',
      data: {
        sheetName: sheet.getName(),
        rowNumber: targetRow,
        updatedFields: updates,
        filename: filename,
        gColumnValue: gColumnValue,
        aiAnalysis: aiAnalysis,
        subtitle: subtitle,
        updatedAt: updateTime.toISOString()
      }
    };

  } catch (error) {
    console.error('❌ 시트 업데이트 오류:', error);
    return {
      status: 'error',
      message: error.toString(),
      details: '시트 접근 권한을 확인하세요'
    };
  }
}

// ========================================
// 5. 핸드 업데이트 핸들러 (호환성)
// ========================================
function handleHandUpdate(data) {
  console.log('🔄 핸드 업데이트...');

  const convertedData = {
    sheetUrl: data.sheetUrl,
    rowNumber: data.virtualRow || data.rowNumber,
    handNumber: data.handNumber,
    filename: data.filename,
    aiAnalysis: data.aiSummary || data.handAnalysis || '분석 완료',
    timestamp: data.handEditTime || data.timestamp || new Date().toISOString(),
    status: data.status || '미완료'
  };

  return handleSheetUpdate(convertedData);
}

// ========================================
// 6. AI 분석 핸들러
// ========================================
function handleHandAnalysis(data) {
  console.log('🤖 AI 핸드 분석 시작...');

  try {
    const { handNumber, filename, timestamp, handData } = data;

    if (!handNumber && !filename) {
      return {
        status: 'error',
        message: '핸드 번호 또는 파일명이 필요합니다'
      };
    }

    let analysis = generateDefaultAnalysis(data);

    // Gemini API 사용 가능한 경우
    if (GEMINI_API_KEY && GEMINI_API_KEY !== '') {
      try {
        analysis = analyzeWithGemini(data);
      } catch (geminiError) {
        console.error('Gemini 분석 실패:', geminiError);
      }
    }

    return {
      status: 'success',
      message: 'AI 분석 완료',
      data: {
        handNumber: handNumber,
        filename: filename,
        analysis: analysis,
        analyzedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ AI 분석 오류:', error);
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

// ========================================
// 7. Index 시트 업데이트
// ========================================
function handleIndexUpdate(data) {
  console.log('📝 Index 시트 업데이트...');

  try {
    const result = updateIndexSheet(
      data.sheetUrl || data.indexSheetUrl,
      data.handNumber,
      data.filename
    );

    return {
      status: 'success',
      message: 'Index 시트 업데이트 완료',
      data: result
    };

  } catch (error) {
    console.error('❌ Index 업데이트 오류:', error);
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

function updateIndexSheet(indexSheetUrl, handNumber, filename) {
  console.log(`🔍 Index 시트에서 핸드 번호 검색: ${handNumber}`);

  const sheet = openSheetByUrl(indexSheetUrl);
  if (!sheet) {
    throw new Error('Index 시트를 열 수 없습니다');
  }

  console.log(`📋 Index 시트 이름: "${sheet.getName()}"`);

  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();

  let foundRow = -1;
  for (let i = 0; i < values.length; i++) {
    const cellValue = values[i][0]; // A열
    if (cellValue && cellValue.toString().includes(handNumber)) {
      foundRow = i + 1;
      console.log(`✅ 핸드 번호 발견: 행 ${foundRow}`);
      break;
    }
  }

  if (foundRow === -1) {
    throw new Error(`핸드 번호 "${handNumber}"를 찾을 수 없습니다`);
  }

  // E열에 파일명 업데이트
  sheet.getRange(foundRow, 5).setValue(filename);
  SpreadsheetApp.flush();

  console.log(`✅ Index 시트 E${foundRow} 업데이트: "${filename}"`);

  return {
    sheetName: sheet.getName(),
    rowNumber: foundRow,
    handNumber: handNumber,
    filename: filename,
    updatedAt: new Date().toISOString()
  };
}

// ========================================
// 8. 일괄 처리 함수들
// ========================================

function handleBatchVerify(data) {
  console.log('🚀 일괄 상태 확인 시작...');

  try {
    const { sheetUrl, rows } = data;

    if (!sheetUrl || !rows || !Array.isArray(rows)) {
      return {
        status: 'error',
        message: 'sheetUrl과 rows 배열이 필요합니다'
      };
    }

    console.log(`📊 확인할 행 개수: ${rows.length}개`);

    const sheet = openSheetByUrl(sheetUrl);
    if (!sheet) {
      return {
        status: 'error',
        message: '시트를 열 수 없습니다'
      };
    }

    const maxRow = Math.max(...rows.filter(r => !isNaN(r)));
    const minRow = Math.min(...rows.filter(r => !isNaN(r)));
    const rangeRows = maxRow - minRow + 1;
    const range = sheet.getRange(minRow, 1, rangeRows, 9);
    const values = range.getValues();

    const results = {};

    rows.forEach(rowNum => {
      if (isNaN(rowNum) || rowNum < minRow || rowNum > maxRow) {
        results[rowNum] = {
          error: '유효하지 않은 행 번호'
        };
        return;
      }

      const rowIndex = rowNum - minRow;
      const rowData = values[rowIndex];

      results[rowNum] = {
        row: rowNum,
        time: rowData[1] || '',
        status: rowData[4] || '',
        filename: rowData[5] || '',
        analysis: rowData[7] || '',
        lastUpdate: rowData[8] || ''
      };
    });

    return {
      status: 'success',
      message: `${rows.length}개 행 일괄 확인 완료`,
      data: results
    };

  } catch (error) {
    console.error('❌ 일괄 확인 오류:', error);
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

function handleGetHandStatus(data) {
  console.log('🔍 실시간 핸드 상태 확인...');

  try {
    const { sheetUrl, handNumber, handTime } = data;

    if (!sheetUrl || !handNumber || !handTime) {
      return {
        status: 'error',
        message: 'sheetUrl, handNumber, handTime이 모두 필요합니다'
      };
    }

    const sheet = openSheetByUrl(sheetUrl);
    if (!sheet) {
      return {
        status: 'error',
        message: '시트를 열 수 없습니다'
      };
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 1) {
      return {
        status: 'error',
        message: '시트에 데이터가 없습니다'
      };
    }

    const range = sheet.getRange(1, 2, lastRow, 4);
    const values = range.getValues();

    const targetTime = parseInt(handTime);
    let matchedRow = null;
    let matchedStatus = '';

    for (let i = 0; i < values.length; i++) {
      const timeValue = values[i][0];
      if (!timeValue) continue;

      let timestamp;
      if (typeof timeValue === 'number') {
        timestamp = timeValue;
      } else if (timeValue instanceof Date) {
        timestamp = Math.floor(timeValue.getTime() / 1000);
      } else {
        const parsed = parseInt(timeValue.toString());
        if (!isNaN(parsed)) {
          timestamp = parsed;
        } else {
          continue;
        }
      }

      const timeDiff = Math.abs(timestamp - targetTime);
      if (timeDiff <= 180) {
        matchedRow = i + 1;
        matchedStatus = values[i][3] || '';
        console.log(`✅ 매칭 성공: 행 ${matchedRow}, 상태: "${matchedStatus}"`);
        break;
      }
    }

    if (!matchedRow) {
      return {
        status: 'not_found',
        message: '해당 핸드를 찾을 수 없습니다',
        handNumber: handNumber
      };
    }

    return {
      status: 'success',
      data: {
        handNumber: handNumber,
        row: matchedRow,
        handStatus: matchedStatus,
        checkedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ 핸드 상태 확인 오류:', error);
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

function handleVerifyUpdate(data) {
  console.log('📋 단일 행 상태 확인...');

  try {
    const { sheetUrl, rowNumber } = data;

    if (!sheetUrl || !rowNumber) {
      return {
        status: 'error',
        message: 'sheetUrl과 rowNumber가 필요합니다'
      };
    }

    const sheet = openSheetByUrl(sheetUrl);
    if (!sheet) {
      return {
        status: 'error',
        message: '시트를 열 수 없습니다'
      };
    }

    const row = parseInt(rowNumber);
    const rowData = sheet.getRange(row, 1, 1, 9).getValues()[0];

    return {
      status: 'success',
      data: {
        row: row,
        columnE: rowData[4] || '',
        columnF: rowData[5] || '',
        columnH: rowData[7] || ''
      }
    };

  } catch (error) {
    console.error('❌ 상태 확인 오류:', error);
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

// ========================================
// 9. 유틸리티 함수들
// ========================================
function openSheetByUrl(url) {
  try {
    console.log('시트 열기 시도:', url);

    const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!idMatch) {
      console.error('잘못된 시트 URL 형식');
      return null;
    }

    const spreadsheetId = idMatch[1];
    console.log('시트 ID:', spreadsheetId);

    let spreadsheet;
    try {
      spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    } catch (openError) {
      console.error('시트 열기 실패:', openError);
      return null;
    }

    const gidMatch = url.match(/[#&]gid=([0-9]+)/);
    if (gidMatch) {
      const gid = parseInt(gidMatch[1]);
      console.log('GID:', gid);

      const sheets = spreadsheet.getSheets();
      for (const sheet of sheets) {
        if (sheet.getSheetId() === gid) {
          console.log('시트 찾음:', sheet.getName());
          return sheet;
        }
      }
      console.log('GID에 해당하는 시트를 찾을 수 없음, 첫 번째 시트 사용');
    }

    const defaultSheet = spreadsheet.getSheets()[0];
    console.log('기본 시트 사용:', defaultSheet.getName());
    return defaultSheet;

  } catch (error) {
    console.error('시트 열기 실패:', error);
    return null;
  }
}

function generateDefaultAnalysis(params) {
  const { handNumber, filename, timestamp } = params;

  const lines = [
    `핸드 #${handNumber || 'N/A'} 분석`,
    `파일: ${filename || 'unknown.mp4'}`,
    `시간: ${timestamp ? new Date(timestamp).toLocaleString('ko-KR') : new Date().toLocaleString('ko-KR')}`
  ];

  return lines.join('\n');
}

function analyzeWithGemini(params) {
  const { handNumber, filename, handData } = params;

  const prompt = `
포커 핸드를 3줄로 요약해주세요:
- 핸드 번호: ${handNumber}
- 파일명: ${filename}
- 데이터: ${JSON.stringify(handData || {})}

간단명료하게 50자 이내로 작성해주세요.
`;

  const response = UrlFetchApp.fetch(
    `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 100,
        }
      })
    }
  );

  if (response.getResponseCode() !== 200) {
    throw new Error(`Gemini API 오류: ${response.getResponseCode()}`);
  }

  const result = JSON.parse(response.getContentText());
  if (!result.candidates || !result.candidates[0]) {
    throw new Error('Gemini 응답 형식 오류');
  }

  const analysis = result.candidates[0].content.parts[0].text;
  return analysis.trim().substring(0, 100);
}

// ========================================
// 10. 테스트 함수들
// ========================================
function testConnection() {
  console.log('🧪 연결 테스트...');

  try {
    const testSheetId = '1M-LM2KkwLNOTygtrPVdnYLqqBoz4MmZvbglUaptSYqE';
    const spreadsheet = SpreadsheetApp.openById(testSheetId);
    const sheet = spreadsheet.getSheets()[0];

    console.log(`✅ 시트 연결 성공: "${sheet.getName()}"`);

    return {
      status: 'success',
      sheetName: sheet.getName(),
      lastRow: sheet.getLastRow(),
      lastColumn: sheet.getLastColumn(),
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ 연결 테스트 실패:', error);
    return {
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

function testSheetUpdate() {
  const testData = {
    action: 'updateSheet',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1M-LM2KkwLNOTygtrPVdnYLqqBoz4MmZvbglUaptSYqE/edit?gid=561799849',
    rowNumber: 2,
    handNumber: 'TEST_' + new Date().getTime(),
    filename: 'test_' + new Date().getTime() + '.mp4',
    aiAnalysis: '테스트 AI 분석 결과',
    status: '미완료',
    timestamp: new Date().toISOString()
  };

  console.log('🧪 시트 업데이트 테스트 시작...');
  const result = handleSheetUpdate(testData);
  console.log('🧪 테스트 결과:', JSON.stringify(result));

  return result;
}

// ========================================
// 11. 배포 정보
// ========================================
function getDeploymentInfo() {
  const url = ScriptApp.getService().getUrl();

  return {
    version: 'v13.5.10',
    lastUpdated: '2025-09-24',
    description: 'Virtual Table DB - 완전판 + G열 업데이트',
    webAppUrl: url || 'Not deployed yet',
    status: 'active',
    features: [
      'updateSheet 액션 지원',
      'CORS 문제 해결',
      'text/plain Content-Type 지원',
      'Virtual 시트 업데이트',
      'AI 분석 (Gemini API)',
      '일괄 처리 지원',
      'G열 업데이트 지원 (신규)'
    ],
    endpoints: {
      GET: '서비스 상태 확인',
      POST: {
        test: '연결 테스트',
        updateSheet: '시트 업데이트',
        updateHand: '핸드 업데이트',
        analyzeHand: 'AI 분석',
        batchVerify: '일괄 확인',
        getHandStatus: '상태 확인'
      }
    }
  };
}

/**
 * 배포 방법:
 * 1. Google Apps Script 에디터에서 이 코드 전체 복사
 * 2. 배포 > 새 배포
 * 3. 유형: 웹 앱
 * 4. 실행: 나
 * 5. 액세스: 모든 사용자
 * 6. 배포 클릭
 * 7. URL 복사하여 index.html에 설정
 */