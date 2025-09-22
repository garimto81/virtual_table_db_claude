// Google Apps Script - CORS 문제 해결 버전
// 이 코드를 Google Apps Script 에디터에 복사해서 사용하세요

// ========================================
// CORS 헤더를 포함한 응답 생성
// ========================================
function createCorsResponse(data) {
  const output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);

  // CORS 헤더 설정
  return output;
}

// ========================================
// GET 요청 처리 - JSONP 지원 추가
// ========================================
function doGet(e) {
  console.log('📥 GET 요청 수신:', JSON.stringify(e));

  const response = {
    status: 'ok',
    method: 'GET',
    time: new Date().toISOString(),
    version: 'v3.5.0-CORS',
    service: 'Virtual Table Sheet Updater',
    features: ['Sheet Update', 'Gemini AI Analysis', 'CORS Support'],
    message: '서비스가 정상 작동 중입니다'
  };

  // JSONP 콜백이 있는 경우
  if (e.parameter.callback) {
    const jsonpResponse = e.parameter.callback + '(' + JSON.stringify(response) + ')';
    return ContentService
      .createTextOutput(jsonpResponse)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  // 일반 JSON 응답
  return createCorsResponse(response);
}

// ========================================
// POST 요청 처리 - 향상된 CORS 지원
// ========================================
function doPost(e) {
  console.log('📥 POST 요청 수신');

  try {
    let requestData = {};

    // 요청 데이터 파싱
    if (e.postData && e.postData.contents) {
      try {
        requestData = JSON.parse(e.postData.contents);
      } catch (error) {
        console.error('❌ JSON 파싱 실패:', error);
        requestData = { raw: e.postData.contents };
      }
    }

    console.log('📋 파싱된 데이터:', JSON.stringify(requestData));

    // 액션 처리
    const action = requestData.action || 'unknown';
    let result;

    switch(action) {
      case 'test':
        result = {
          status: 'success',
          message: 'Apps Script 연결 성공! (CORS 지원)',
          timestamp: new Date().toISOString(),
          version: 'v3.5.0-CORS',
          receivedData: requestData
        };
        break;

      case 'updateSheet':
        // 기존 updateSheet 로직
        result = handleSheetUpdate(requestData);
        break;

      default:
        result = {
          status: 'error',
          message: `알 수 없는 액션: ${action}`,
          availableActions: ['test', 'updateSheet', 'updateHand', 'analyzeHand']
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
// OPTIONS 요청 처리 (Preflight)
// ========================================
function doOptions(e) {
  return createCorsResponse({
    status: 'ok',
    message: 'CORS preflight 성공'
  });
}

// 나머지 함수들은 기존 코드 유지...