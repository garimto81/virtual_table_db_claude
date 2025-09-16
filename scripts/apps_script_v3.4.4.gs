// Virtual Table DB - Google Apps Script v3.4.4
// E열 드롭다운 데이터 검증 규칙 자동 설정
// 최종 업데이트: 2025-01-16
//
// ⚠️ 중요: 이 파일이 항상 최신 버전입니다.
// 다른 버전은 모두 삭제하고 이 파일만 사용하세요.

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
    version: 'v3.4.4',
    service: 'Virtual Table Sheet Updater',
    features: [
      'Sheet Update',
      'Gemini AI Analysis',
      'Auto Analysis',
      'Index Sheet Support',
      'text/plain Support',
      'finalAnalysis 오류 수정'
    ],
    gemini_enabled: !!GEMINI_API_KEY,
    message: '서비스가 정상 작동 중입니다',
    cors: 'enabled'
  };

  return createCorsResponse(response);
}

// POST 요청 처리
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
    // 2. Text/Plain 형식 (CORS 회피용)
    else if (e.postData && e.postData.type === 'text/plain') {
      try {
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

      case 'verifyUpdate':
        result = handleVerifyUpdate(requestData);
        break;

      case 'updateStatus':
        result = handleStatusUpdate(requestData);
        break;

      case 'test':
        result = {
          status: 'success',
          message: 'Apps Script 연결 성공!',
          timestamp: new Date().toISOString(),
          version: 'v3.4.4',
          receivedData: requestData,
          availableActions: ['updateSheet', 'updateHand', 'analyzeHand', 'updateIndex', 'verifyUpdate', 'updateStatus', 'test']
        };
        break;

      default:
        result = {
          status: 'error',
          message: `알 수 없는 액션: ${action}`,
          availableActions: ['updateSheet', 'updateHand', 'analyzeHand', 'updateIndex', 'verifyUpdate', 'updateStatus', 'test']
        };
    }

    return createCorsResponse(result);

  } catch (error) {
    console.error('❌ POST 처리 오류:', error);
    return createCorsResponse({
      status: 'error',
      message: error.toString(),
      errorStack: error.stack
    });
  }
}

// ========================================
// 4. 시트 업데이트 핸들러 (핵심 기능)
// ========================================
function handleSheetUpdate(data) {
  console.log('🔄 시트 업데이트 시작...');

  // finalAnalysis와 updateTime을 최상위 스코프에 선언
  let finalAnalysis = '';
  let updateTime = new Date();

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

    // 최대 행 수 확인 및 필요시 행 추가
    const maxRow = sheet.getMaxRows();
    if (targetRow > maxRow) {
      sheet.insertRowsAfter(maxRow, targetRow - maxRow);
      console.log(`📝 행 추가: ${targetRow - maxRow}개`);
    }

    // E열 드롭다운 데이터 검증 규칙 설정
    try {
      const range = sheet.getRange(targetRow, 5);

      // 드롭다운 검증 규칙 생성
      const rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(['미완료', '복사완료'], true)
        .setAllowInvalid(false)
        .build();

      range.setDataValidation(rule);
      console.log('✅ E열 드롭다운 검증 규칙 설정');
    } catch (e) {
      console.log('⚠️ 드롭다운 검증 규칙 설정 실패:', e.message);
    }

    // 데이터 업데이트
    const updates = [];

    // AI 분석 초기화
    finalAnalysis = aiAnalysis || '';
    if (!finalAnalysis || finalAnalysis === '분석 실패' || finalAnalysis.trim() === '') {
      finalAnalysis = generateDefaultAnalysis({
        handNumber: handNumber,
        filename: filename,
        timestamp: timestamp
      });
    }

    try {
      // D열: 핸드 번호 (선택사항)
      if (handNumber) {
        sheet.getRange(targetRow, 4).setValue(handNumber);
        updates.push('핸드번호(D열)');
      }

      // E열: 상태 (드롭다운 - '미완료' 또는 '복사완료')
      const status = data.status || '미완료'; // 기본값: 미완료
      sheet.getRange(targetRow, 5).setValue(status);
      updates.push(`상태(E열: ${status})`);

      // F열: 파일명
      sheet.getRange(targetRow, 6).setValue(filename);
      updates.push('파일명(F열)');

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
      // 부분 성공도 보고
      return {
        status: 'partial',
        message: `셀 업데이트 부분 실패: ${cellError.toString()}`,
        updates: updates,
        finalAnalysis: finalAnalysis
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
    console.error('오류 스택:', error.stack);

    // finalAnalysis가 정의되어 있는지 확인하고 반환
    return {
      status: 'error',
      message: error.toString(),
      details: '시트 접근 권한을 확인하세요',
      errorStack: error.stack,
      finalAnalysis: finalAnalysis || '분석 데이터 없음'
    };
  }
}

// ========================================
// 5. 업데이트 검증 핸들러
// ========================================
function handleVerifyUpdate(data) {
  console.log('🔍 업데이트 검증 시작...');

  try {
    const { sheetUrl, rowNumber } = data;

    if (!sheetUrl || !rowNumber) {
      return {
        status: 'error',
        message: '시트 URL과 행 번호가 필요합니다'
      };
    }

    const sheet = openSheetByUrl(sheetUrl);
    if (!sheet) {
      return {
        status: 'error',
        message: '시트를 열 수 없습니다'
      };
    }

    const targetRow = parseInt(rowNumber);

    // F열과 H열 데이터 읽기
    const fValue = sheet.getRange(targetRow, 6).getValue();
    const hValue = sheet.getRange(targetRow, 8).getValue();

    console.log(`✅ 검증 완료 - 행 ${targetRow}: F열="${fValue}", H열="${hValue}"`);

    return {
      status: 'success',
      message: '데이터 검증 완료',
      data: {
        rowNumber: targetRow,
        columnF: fValue,
        columnH: hValue,
        verifiedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ 검증 오류:', error);
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

// ========================================
// 6. 상태(E열) 업데이트 핸들러
// ========================================
function handleStatusUpdate(data) {
  console.log('📝 E열 상태 업데이트 시작...');

  try {
    const { sheetUrl, rowNumber, status } = data;

    if (!sheetUrl || !rowNumber) {
      return {
        status: 'error',
        message: '시트 URL과 행 번호가 필요합니다'
      };
    }

    if (!status || (status !== '미완료' && status !== '복사완료')) {
      return {
        status: 'error',
        message: '유효한 상태값이 필요합니다 (미완료 또는 복사완료)'
      };
    }

    const sheet = openSheetByUrl(sheetUrl);
    if (!sheet) {
      return {
        status: 'error',
        message: '시트를 열 수 없습니다'
      };
    }

    const targetRow = parseInt(rowNumber);

    // E열에 상태 업데이트
    sheet.getRange(targetRow, 5).setValue(status);
    SpreadsheetApp.flush();

    console.log(`✅ E열 상태 업데이트 완료 - 행 ${targetRow}: "${status}"`);

    return {
      status: 'success',
      message: 'E열 상태 업데이트 완료',
      data: {
        rowNumber: targetRow,
        columnE: status,
        updatedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ 상태 업데이트 오류:', error);
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

// ========================================
// 7. 핸드 업데이트 핸들러 (레거시 호환)
// ========================================
function handleHandUpdate(data) {
  console.log('🔄 핸드 업데이트 (레거시 모드)...');

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
// 7. AI 분석 핸들러
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
// 8. Index 시트 업데이트
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
// 9. 유틸리티 함수들
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
  return {
    version: '3.4.4',
    lastUpdated: '2025-01-16',
    description: 'E열 드롭다운 데이터 검증 규칙 자동 설정',
    author: 'Virtual Table DB Team',
    status: 'production',
    changeLog: [
      'v3.4.4: E열 드롭다운 데이터 검증 규칙 자동 설정',
      'v3.4.3: E열 상태 드롭다운 지원 (미완료/복사완료)',
      'v3.4.2: finalAnalysis 변수 스코프 문제 완전 해결',
      'v3.4.1: 오류 처리 개선',
      'v3.4.0: verifyUpdate 액션 추가',
      'v3.3.0: E열 데이터 검증 규칙 자동 제거',
      'v3.2.0: 부분 성공 상태 추가',
      'v3.1.0: text/plain 파싱 개선'
    ],
    features: [
      'Google Apps Script 최신 문법',
      'text/plain Content-Type 지원',
      'CORS 자동 처리',
      'Virtual 시트 업데이트 (D, E, F, H, I열)',
      'Index 시트 업데이트',
      'Gemini API 통합',
      'finalAnalysis 오류 방지',
      '상세한 에러 로깅'
    ],
    endpoints: {
      GET: '서비스 상태 확인',
      POST: {
        test: '연결 테스트',
        updateSheet: '시트 데이터 업데이트',
        verifyUpdate: '업데이트 데이터 검증',
        updateHand: '핸드 업데이트 (레거시)',
        analyzeHand: 'AI 핸드 분석',
        updateIndex: 'Index 시트 업데이트'
      }
    },
    deployment: {
      requirement: '액세스: 모든 사용자',
      apiKey: 'GEMINI_API_KEY in Script Properties',
      cors: '자동 처리됨'
    }
  };
}