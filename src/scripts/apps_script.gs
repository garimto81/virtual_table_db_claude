// Virtual Table DB - Google Apps Script v3.4.5 (E열 검증 규칙 준수)
// E열 드롭다운 및 상태 관리 시스템 포함 + 검증 규칙 오류 수정

// ========================================
// 1. 기본 설정
// ========================================
const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// ========================================
// 2. CORS 응답 생성 (수정된 방식)
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
  
  // 서비스 상태 확인
  const response = {
    status: 'ok',
    method: 'GET',
    time: new Date().toISOString(),
    version: 'v3.4.5',
    service: 'Virtual Table Sheet Updater',
    features: ['Sheet Update', 'Gemini AI Analysis', 'Auto Analysis', 'Index Sheet Support', 'text/plain Support'],
    gemini_enabled: !!GEMINI_API_KEY,
    message: '서비스가 정상 작동 중입니다',
    cors: 'enabled'
  };
  
  return createCorsResponse(response);
}

// POST 요청 처리 (text/plain 파싱 개선)
function doPost(e) {
  console.log('📥 POST 요청 수신');
  
  try {
    // 요청 데이터 파싱
    let requestData = {};
    
    // 1. JSON 형식 (application/json)
    if (e.postData && e.postData.type === 'application/json') {
      requestData = JSON.parse(e.postData.contents);
      console.log('✅ application/json 파싱 성공');
    }
    // 2. Text/Plain 형식 (CORS 회피용) - 개선된 파싱
    else if (e.postData && e.postData.type === 'text/plain') {
      try {
        // text/plain으로 전송된 JSON 데이터 파싱
        requestData = JSON.parse(e.postData.contents);
        console.log('✅ text/plain JSON 파싱 성공');
      } catch (error) {
        console.error('❌ text/plain 파싱 실패:', error);
        requestData = { raw: e.postData.contents };
      }
    }
    // 3. Form 형식
    else if (e.parameter) {
      if (e.parameter.payload) {
        try {
          requestData = JSON.parse(e.parameter.payload);
        } catch {
          requestData = e.parameter;
        }
      } else {
        requestData = e.parameter;
      }
    }
    // 4. 기타 형식
    else if (e.postData && e.postData.contents) {
      try {
        requestData = JSON.parse(e.postData.contents);
      } catch {
        requestData = { raw: e.postData.contents };
      }
    }
    
    console.log('📋 요청 타입:', e.postData ? e.postData.type : 'unknown');
    console.log('📋 파싱된 데이터:', JSON.stringify(requestData));
    console.log('📋 action 필드:', requestData.action || 'undefined');
    
    // 액션 라우팅
    const action = requestData.action || 'unknown';
    let result;
    
    switch(action) {
      case 'updateSheet':
        result = handleSheetUpdate(requestData);
        break;
        
      case 'updateHand':
        // 기존 버전 호환성
        result = handleHandUpdate(requestData);
        break;
        
      case 'analyzeHand':
        result = handleHandAnalysis(requestData);
        break;
        
      case 'updateIndex':
        result = handleIndexUpdate(requestData);
        break;
        
      case 'batchVerify':
        // 일괄 상태 확인 - Phase 1 성능 최적화
        result = handleBatchVerify(requestData);
        break;

      case 'verifyUpdate':
        // 단일 행 상태 확인 (기존 호환성)
        result = handleVerifyUpdate(requestData);
        break;

      case 'getHandStatus':
        // 실시간 핸드 상태 확인 (CSV 캐싱 우회)
        result = handleGetHandStatus(requestData);
        break;

      case 'test':
        result = {
          status: 'success',
          message: 'Apps Script 연결 성공!',
          timestamp: new Date().toISOString(),
          version: 'v3.5.0',
          receivedData: requestData
        };
        break;

      default:
        result = {
          status: 'error',
          message: `알 수 없는 액션: ${action}`,
          availableActions: ['updateSheet', 'updateHand', 'analyzeHand', 'updateIndex', 'batchVerify', 'verifyUpdate', 'test']
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
// 4. 시트 업데이트 핸들러 (기존 로직 유지)
// ========================================
function handleSheetUpdate(data) {
  console.log('🔄 시트 업데이트 시작...');
  
  try {
    const {
      sheetUrl,
      rowNumber,
      handNumber,
      filename,
      aiAnalysis,
      timestamp,
      indexSheetUrl
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
      - 파일명: ${filename}`);
    
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
      // 행 추가가 필요한 경우
      sheet.insertRowsAfter(maxRow, targetRow - maxRow);
      console.log(`📝 행 추가: ${targetRow - maxRow}개`);
    }
    
    // 데이터 업데이트
    const updates = [];
    let finalAnalysis = aiAnalysis;  // finalAnalysis를 try 블록 밖에서 선언
    const updateTime = new Date();   // updateTime도 try 블록 밖에서 선언
    
    try {
      // D열: 핸드 번호 (선택사항)
      if (handNumber) {
        sheet.getRange(targetRow, 4).setValue(handNumber);
        updates.push('핸드번호(D열)');
      }
      
      // E열: 상태값 (드롭다운 검증 규칙 준수)
      const statusValue = data.status || '미완료'; // 기본값은 '미완료'
      if (statusValue === '미완료' || statusValue === '복사완료') {
        sheet.getRange(targetRow, 5).setValue(statusValue);
        updates.push(`상태(E열): ${statusValue}`);
      } else {
        console.warn(`⚠️ 잘못된 E열 상태값: "${statusValue}", 기본값 "미완료" 사용`);
        sheet.getRange(targetRow, 5).setValue('미완료');
        updates.push('상태(E열): 미완료');
      }
      
      // F열: 파일명 (호환성)
      sheet.getRange(targetRow, 6).setValue(filename);
      updates.push('파일명(F열)');
      
      // AI 분석 처리
      if (!finalAnalysis || finalAnalysis === '분석 실패' || finalAnalysis.trim() === '') {
        // AI 분석이 없으면 자동 생성
        finalAnalysis = generateDefaultAnalysis({
          handNumber: handNumber,
          filename: filename,
          timestamp: timestamp
        });
      }
      
      // H열: AI 분석
      sheet.getRange(targetRow, 8).setValue(finalAnalysis);
      updates.push('AI분석(H열)');
      
      // I열: 업데이트 시간
      sheet.getRange(targetRow, 9).setValue(updateTime);
      updates.push('업데이트시간(I열)');
      
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
    
    // Index 시트 업데이트 (있는 경우)
    let indexResult = null;
    if (indexSheetUrl && handNumber) {
      try {
        indexResult = updateIndexSheet(indexSheetUrl, handNumber, filename);
        console.log('✅ Index 시트도 업데이트됨');
      } catch (indexError) {
        console.error('⚠️ Index 시트 업데이트 실패:', indexError);
        // Index 실패해도 메인 작업은 성공으로 처리
      }
    }
    
    return {
      status: 'success',
      message: '시트 업데이트 완료',
      data: {
        sheetName: sheet.getName(),
        rowNumber: targetRow,
        updatedFields: updates,
        filename: filename,
        aiAnalysis: finalAnalysis,
        updatedAt: updateTime.toISOString(),
        indexUpdate: indexResult
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
// 5. 핸드 업데이트 핸들러 (기존 버전 호환)
// ========================================
function handleHandUpdate(data) {
  console.log('🔄 핸드 업데이트 (레거시 모드)...');
  
  // updateSheet 형식으로 변환
  const convertedData = {
    sheetUrl: data.sheetUrl,
    rowNumber: data.virtualRow || data.rowNumber,
    handNumber: data.handNumber,
    filename: data.filename,
    aiAnalysis: data.aiSummary || data.handAnalysis || '분석 완료',
    timestamp: data.handEditTime || data.timestamp || new Date().toISOString()
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
    
    let analysis;
    
    // Gemini API 사용 가능한 경우
    if (GEMINI_API_KEY && GEMINI_API_KEY !== '' && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY') {
      try {
        analysis = analyzeWithGemini(data);
      } catch (geminiError) {
        console.error('Gemini 분석 실패, 기본 분석 사용:', geminiError);
        analysis = generateDefaultAnalysis(data);
      }
    } else {
      // 기본 분석 사용
      analysis = generateDefaultAnalysis(data);
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
      message: error.toString(),
      analysis: '분석 실패'
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
  
  // A열에서 핸드 번호 검색
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
// 8. Phase 1 성능 최적화 - 일괄 처리 함수들
// ========================================

/**
 * 여러 행의 상태를 한 번에 확인하는 일괄 처리 함수
 * @param {Object} data - { sheetUrl, rows: [행번호 배열] }
 * @returns {Object} 각 행의 상태 정보
 */
function handleBatchVerify(data) {
  console.log('🚀 [Phase 1] 일괄 상태 확인 시작...');

  try {
    const { sheetUrl, rows } = data;

    if (!sheetUrl || !rows || !Array.isArray(rows)) {
      return {
        status: 'error',
        message: 'sheetUrl과 rows 배열이 필요합니다'
      };
    }

    console.log(`📊 확인할 행 개수: ${rows.length}개`);
    const startTime = new Date().getTime();

    // 시트 열기
    const sheet = openSheetByUrl(sheetUrl);
    if (!sheet) {
      return {
        status: 'error',
        message: '시트를 열 수 없습니다'
      };
    }

    // 전체 데이터를 한 번에 가져오기 (성능 최적화)
    const maxRow = Math.max(...rows.filter(r => !isNaN(r)));
    const minRow = Math.min(...rows.filter(r => !isNaN(r)));

    // 범위 최적화: 필요한 범위만 가져오기
    const rangeRows = maxRow - minRow + 1;
    const range = sheet.getRange(minRow, 1, rangeRows, 9); // A-I열
    const values = range.getValues();

    // 결과 객체 생성
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
        time: rowData[1] || '',        // B열: 시간
        status: rowData[4] || '',       // E열: 상태 (빈값/미완료/복사완료)
        filename: rowData[5] || '',     // F열: 파일명
        analysis: rowData[7] || '',     // H열: AI 분석
        lastUpdate: rowData[8] || ''    // I열: 업데이트 시간
      };
    });

    const endTime = new Date().getTime();
    const duration = endTime - startTime;

    console.log(`✅ 일괄 확인 완료: ${duration}ms`);

    return {
      status: 'success',
      message: `${rows.length}개 행 일괄 확인 완료`,
      data: results,
      performance: {
        duration: duration,
        rowsChecked: rows.length,
        avgTimePerRow: Math.round(duration / rows.length)
      }
    };

  } catch (error) {
    console.error('❌ 일괄 확인 오류:', error);
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

/**
 * 실시간 핸드 상태 확인 (CSV 캐싱 우회)
 * 특정 핸드 번호의 E열 상태를 직접 읽어옴
 * @param {Object} data - { sheetUrl, handNumber, handTime }
 * @returns {Object} 핸드의 상태 정보
 */
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

    // 시트 열기
    const sheet = openSheetByUrl(sheetUrl);
    if (!sheet) {
      return {
        status: 'error',
        message: '시트를 열 수 없습니다'
      };
    }

    // 전체 데이터 가져오기 (B열과 E열만 필요)
    const lastRow = sheet.getLastRow();
    if (lastRow < 1) {
      return {
        status: 'error',
        message: '시트에 데이터가 없습니다'
      };
    }

    // B열(시간)과 E열(상태) 데이터 가져오기
    const range = sheet.getRange(1, 2, lastRow, 4); // B열부터 E열까지
    const values = range.getValues();

    // 타임스탬프로 매칭 (±180초 허용)
    const targetTime = parseInt(handTime);
    let matchedRow = null;
    let matchedStatus = '';

    for (let i = 0; i < values.length; i++) {
      const timeValue = values[i][0]; // B열
      if (!timeValue) continue;

      // 타임스탬프 파싱
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

      // 시간 차이 확인 (±180초)
      const timeDiff = Math.abs(timestamp - targetTime);
      if (timeDiff <= 180) {
        matchedRow = i + 1;
        matchedStatus = values[i][3] || ''; // E열 (인덱스 3)
        console.log(`✅ 매칭 성공: 행 ${matchedRow}, 상태: "${matchedStatus}"`);
        break;
      }
    }

    if (!matchedRow) {
      return {
        status: 'not_found',
        message: '해당 핸드를 찾을 수 없습니다',
        handNumber: handNumber,
        searchedTime: targetTime
      };
    }

    // 상태 정규화
    let normalizedStatus = '';
    if (matchedStatus === '미완료' || matchedStatus === '"미완료"') {
      normalizedStatus = '미완료';
    } else if (matchedStatus === '복사완료' || matchedStatus === '"복사완료"') {
      normalizedStatus = '복사완료';
    } else if (!matchedStatus || matchedStatus.trim() === '') {
      normalizedStatus = '';
    } else {
      normalizedStatus = matchedStatus.trim();
    }

    console.log(`📋 핸드 #${handNumber}: 행 ${matchedRow}, 원본 상태: "${matchedStatus}", 정규화: "${normalizedStatus}"`);

    return {
      status: 'success',
      data: {
        handNumber: handNumber,
        row: matchedRow,
        handStatus: normalizedStatus,
        rawStatus: matchedStatus,
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

/**
 * 단일 행 상태 확인 (기존 호환성 유지)
 * @param {Object} data - { sheetUrl, rowNumber }
 * @returns {Object} 행의 상태 정보
 */
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
        columnE: rowData[4] || '',  // E열 상태
        columnF: rowData[5] || '',  // F열 파일명
        columnH: rowData[7] || ''   // H열 AI 분석
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
// 9. 유틸리티 함수들 (기존)
// ========================================
function openSheetByUrl(url) {
  try {
    console.log('시트 열기 시도:', url);
    
    // URL에서 시트 ID 추출
    const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!idMatch) {
      console.error('잘못된 시트 URL 형식');
      return null;
    }
    
    const spreadsheetId = idMatch[1];
    console.log('시트 ID:', spreadsheetId);
    
    // 스프레드시트 열기
    let spreadsheet;
    try {
      spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    } catch (openError) {
      console.error('시트 열기 실패:', openError);
      return null;
    }
    
    // GID가 있으면 해당 시트 선택
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
    
    // GID가 없으면 첫 번째 시트 반환
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
// 9. 테스트 함수들
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
    timestamp: new Date().toISOString()
  };
  
  console.log('🧪 시트 업데이트 테스트 시작...');
  const result = handleSheetUpdate(testData);
  console.log('🧪 테스트 결과:', JSON.stringify(result));
  
  return result;
}

function testGet() {
  const result = doGet({});
  const content = result.getContent();
  console.log('GET 테스트 결과:', content);
  return JSON.parse(content);
}

function testPost() {
  const e = {
    postData: {
      type: 'text/plain',  // text/plain 테스트
      contents: JSON.stringify({
        action: 'test',
        message: '테스트 메시지'
      })
    }
  };
  
  const result = doPost(e);
  const content = result.getContent();
  console.log('POST 테스트 결과:', content);
  return JSON.parse(content);
}

// ========================================
// 10. 배포 정보
// ========================================
function getDeploymentInfo() {
  const url = ScriptApp.getService().getUrl();
  
  return {
    version: '3.4.1',
    lastUpdated: '2025-09-15',
    description: 'text/plain 파싱 개선 버전',
    webAppUrl: url || 'Not deployed yet',
    author: 'Virtual Table DB Team',
    status: 'active',
    features: [
      'Google Apps Script 최신 문법 적용',
      'text/plain Content-Type 완벽 지원',
      'CORS 자동 처리 (Apps Script 기본)',
      '기존 로직 100% 호환',
      'Virtual 시트 업데이트 (D, E, F, H, I열)',
      'Index 시트 업데이트 지원',
      'AI 분석 (Gemini API)',
      '상세한 에러 처리',
      '디버그 로그 강화'
    ],
    endpoints: {
      GET: '서비스 상태 확인',
      POST: {
        test: '{action: "test"}',
        updateSheet: '{action: "updateSheet", sheetUrl, rowNumber, filename, ...}',
        updateHand: '{action: "updateHand", ...} (레거시)',
        analyzeHand: '{action: "analyzeHand", handNumber, ...}',
        updateIndex: '{action: "updateIndex", ...}'
      }
    },
    notes: [
      '배포 시 "액세스: 모든 사용자" 설정 필수',
      'Gemini API 키는 스크립트 속성에 설정',
      'CORS는 Apps Script가 자동으로 처리',
      'text/plain Content-Type 지원으로 CORS 문제 해결'
    ]
  };
}