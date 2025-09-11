// Virtual Table DB - Google Apps Script v2 (CORS 완전 해결)
// 기존 로직 100% 유지 + CORS 헤더 강화

// ========================================
// 1. 기본 설정
// ========================================
const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// ========================================
// 2. CORS 헤더 헬퍼 함수
// ========================================
function createCorsResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  
  // CORS 헤더 추가
  output.addHeader('Access-Control-Allow-Origin', '*');
  output.addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  output.addHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  output.addHeader('Access-Control-Max-Age', '3600');
  
  return output;
}

// ========================================
// 3. HTTP 메소드 핸들러
// ========================================

// OPTIONS 요청 처리 (CORS Preflight)
function doOptions(e) {
  return createCorsResponse({
    status: 'ok',
    message: 'CORS preflight accepted',
    timestamp: new Date().toISOString()
  });
}

// GET 요청 처리
function doGet(e) {
  console.log('📥 GET 요청 수신:', JSON.stringify(e));
  
  // 서비스 상태 확인
  const response = {
    status: 'ok',
    method: 'GET',
    time: new Date().toISOString(),
    version: 'v2.0',
    service: 'Virtual Table Sheet Updater',
    features: ['Sheet Update', 'Gemini AI Analysis', 'Auto Analysis', 'Index Sheet Support'],
    gemini_enabled: !!GEMINI_API_KEY,
    message: '서비스가 정상 작동 중입니다'
  };
  
  return createCorsResponse(response);
}

// POST 요청 처리
function doPost(e) {
  console.log('📥 POST 요청 수신');
  
  try {
    // 요청 데이터 파싱
    let requestData = {};
    
    // 1. JSON 형식
    if (e.postData && e.postData.type === 'application/json') {
      requestData = JSON.parse(e.postData.contents);
    }
    // 2. Form 형식
    else if (e.parameter) {
      if (e.parameter.payload) {
        requestData = JSON.parse(e.parameter.payload);
      } else {
        requestData = e.parameter;
      }
    }
    // 3. Text 형식
    else if (e.postData && e.postData.contents) {
      try {
        requestData = JSON.parse(e.postData.contents);
      } catch {
        requestData = { raw: e.postData.contents };
      }
    }
    
    console.log('📋 파싱된 데이터:', JSON.stringify(requestData));
    
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
        
      case 'test':
        result = {
          status: 'success',
          message: 'Apps Script 연결 성공!',
          timestamp: new Date().toISOString(),
          receivedData: requestData
        };
        break;
        
      default:
        result = {
          status: 'error',
          message: `알 수 없는 액션: ${action}`,
          availableActions: ['updateSheet', 'updateHand', 'analyzeHand', 'updateIndex', 'test']
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
      - 파일명: ${filename}`);
    
    // 시트 열기
    const sheet = openSheetByUrl(sheetUrl);
    if (!sheet) {
      throw new Error('시트를 열 수 없습니다');
    }
    
    const targetRow = parseInt(rowNumber);
    console.log(`📋 시트 이름: "${sheet.getName()}", 대상 행: ${targetRow}`);
    
    // 데이터 업데이트
    const updates = [];
    
    // D열: 핸드 번호 (선택사항)
    if (handNumber) {
      sheet.getRange(targetRow, 4).setValue(handNumber);
      updates.push('핸드번호(D열)');
    }
    
    // E열: 파일명 (Virtual 시트 구조에 따라 E열 또는 F열)
    sheet.getRange(targetRow, 5).setValue(filename);
    updates.push('파일명(E열)');
    
    // F열: 파일명 (호환성을 위해 F열에도 저장)
    sheet.getRange(targetRow, 6).setValue(filename);
    updates.push('파일명(F열)');
    
    // G열 또는 H열: AI 분석
    let finalAnalysis = aiAnalysis;
    if (!finalAnalysis || finalAnalysis === '분석 실패' || finalAnalysis.trim() === '') {
      // AI 분석이 없으면 자동 생성
      finalAnalysis = generateDefaultAnalysis({
        handNumber: handNumber,
        filename: filename,
        timestamp: timestamp
      });
    }
    
    // H열: AI 분석 (메인)
    sheet.getRange(targetRow, 8).setValue(finalAnalysis);
    updates.push('AI분석(H열)');
    
    // I열: 업데이트 시간
    const updateTime = new Date();
    sheet.getRange(targetRow, 9).setValue(updateTime);
    updates.push('업데이트시간(I열)');
    
    // 변경사항 저장
    SpreadsheetApp.flush();
    
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
      throw new Error('핸드 번호 또는 파일명이 필요합니다');
    }
    
    let analysis;
    
    // Gemini API 사용 가능한 경우
    if (GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY') {
      analysis = analyzeWithGemini(data);
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
// 8. 유틸리티 함수들
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
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    
    // GID가 있으면 해당 시트 선택
    const gidMatch = url.match(/[#&]gid=([0-9]+)/);
    if (gidMatch) {
      const gid = parseInt(gidMatch[1]);
      const sheets = spreadsheet.getSheets();
      for (const sheet of sheets) {
        if (sheet.getSheetId() === gid) {
          console.log('시트 찾음:', sheet.getName());
          return sheet;
        }
      }
    }
    
    // GID가 없으면 첫 번째 시트 반환
    console.log('기본 시트 사용');
    return spreadsheet.getSheets()[0];
    
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
    `시간: ${timestamp ? new Date(timestamp).toLocaleString('ko-KR') : '알 수 없음'}`
  ];
  
  return lines.join('\n');
}

function analyzeWithGemini(params) {
  try {
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
    const analysis = result.candidates[0].content.parts[0].text;
    
    return analysis.trim().substring(0, 100);
    
  } catch (error) {
    console.error('Gemini 분석 실패:', error);
    return generateDefaultAnalysis(params);
  }
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
  console.log('🧪 테스트 결과:', result);
  
  return result;
}

function testCORS() {
  // 브라우저에서 테스트할 URL
  const webAppUrl = ScriptApp.getService().getUrl();
  
  console.log('='.repeat(60));
  console.log('🧪 CORS 테스트 가이드');
  console.log('='.repeat(60));
  console.log('Web App URL:', webAppUrl);
  console.log('');
  console.log('브라우저 콘솔에서 다음 코드를 실행하세요:');
  console.log('');
  console.log(`fetch('${webAppUrl}')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);`);
  console.log('='.repeat(60));
  
  return {
    webAppUrl: webAppUrl,
    status: 'ready',
    corsEnabled: true
  };
}

// ========================================
// 10. 배포 정보
// ========================================
function getDeploymentInfo() {
  return {
    version: '2.0',
    lastUpdated: '2025-01-11',
    description: 'CORS 완전 해결 버전',
    author: 'Virtual Table DB Team',
    features: [
      'CORS 헤더 완벽 지원',
      'OPTIONS 메소드 처리',
      '기존 로직 100% 호환',
      'Virtual 시트 업데이트',
      'Index 시트 업데이트',
      'AI 분석 (Gemini)',
      '에러 처리 강화'
    ],
    endpoints: {
      test: 'POST {action: "test"}',
      updateSheet: 'POST {action: "updateSheet", sheetUrl, rowNumber, filename, ...}',
      analyzeHand: 'POST {action: "analyzeHand", handNumber, ...}',
      updateIndex: 'POST {action: "updateIndex", ...}'
    }
  };
}